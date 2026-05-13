import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const tasks = await prisma.diaconateTask.findMany({
    where: { diaconateId: 1 },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
  })
  return NextResponse.json(tasks)
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const task = await prisma.diaconateTask.create({
    data: {
      title: body.title,
      description: body.description ?? null,
      priority: body.priority ?? "MEDIA",
      status: "PENDENTE",
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      diaconateId: 1,
    },
  })
  return NextResponse.json(task, { status: 201 })
}
