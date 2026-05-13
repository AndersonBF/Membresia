import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const data: any = {}

  if (body.title !== undefined)       data.title       = body.title
  if (body.description !== undefined) data.description = body.description
  if (body.priority !== undefined)    data.priority    = body.priority
  if (body.dueDate !== undefined)     data.dueDate     = body.dueDate ? new Date(body.dueDate) : null
  if (body.status !== undefined) {
    data.status = body.status
    data.completedAt = body.status === "CONCLUIDA" ? new Date() : null
  }

  const task = await prisma.diaconateTask.update({
    where: { id: parseInt(params.id) },
    data,
  })
  return NextResponse.json(task)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await prisma.diaconateTask.delete({ where: { id: parseInt(params.id) } })
  return NextResponse.json({ ok: true })
}
