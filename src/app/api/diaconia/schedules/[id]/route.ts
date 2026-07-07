import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const id = parseInt(params.id)
  const body = await req.json()
  const data: any = {}

  if (body.type !== undefined) {
    data.type = body.type === "EVENTO" ? "EVENTO" : "DOMINGO"
    data.title = body.type === "EVENTO" ? (body.title ?? null) : null
  } else if (body.title !== undefined) {
    data.title = body.title
  }
  if (body.date !== undefined)  data.date  = new Date(body.date)
  if (body.notes !== undefined) data.notes = body.notes

  // Se vier a lista de membros, substitui todos os escalados
  if (Array.isArray(body.memberIds)) {
    const memberIds: number[] = body.memberIds
    await prisma.$transaction([
      prisma.diaconateScheduleMember.deleteMany({ where: { scheduleId: id } }),
      prisma.diaconateScheduleMember.createMany({
        data: memberIds.map((memberId) => ({ scheduleId: id, memberId })),
        skipDuplicates: true,
      }),
    ])
  }

  const schedule = await prisma.diaconateSchedule.update({
    where: { id },
    data,
    include: {
      members: {
        include: {
          member: { select: { id: true, name: true, profileImageUrl: true } },
        },
      },
    },
  })
  return NextResponse.json(schedule)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await prisma.diaconateSchedule.delete({ where: { id: parseInt(params.id) } })
  return NextResponse.json({ ok: true })
}
