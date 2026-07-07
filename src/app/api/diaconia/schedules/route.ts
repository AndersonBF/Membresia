import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const schedules = await prisma.diaconateSchedule.findMany({
    where: { diaconateId: 1 },
    orderBy: { date: "asc" },
    include: {
      members: {
        include: {
          member: { select: { id: true, name: true, profileImageUrl: true } },
        },
      },
    },
  })
  return NextResponse.json(schedules)
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const memberIds: number[] = Array.isArray(body.memberIds) ? body.memberIds : []

  const schedule = await prisma.diaconateSchedule.create({
    data: {
      title: body.type === "EVENTO" ? (body.title ?? null) : null,
      type: body.type === "EVENTO" ? "EVENTO" : "DOMINGO",
      date: new Date(body.date),
      notes: body.notes ?? null,
      diaconateId: 1,
      members: {
        create: memberIds.map((memberId) => ({ memberId })),
      },
    },
    include: {
      members: {
        include: {
          member: { select: { id: true, name: true, profileImageUrl: true } },
        },
      },
    },
  })
  return NextResponse.json(schedule, { status: 201 })
}
