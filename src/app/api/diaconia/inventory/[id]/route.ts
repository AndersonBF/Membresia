import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const data: any = {}

  if (body.name !== undefined)        data.name        = body.name
  if (body.description !== undefined) data.description = body.description
  if (body.quantity !== undefined)    data.quantity    = body.quantity
  if (body.category !== undefined)    data.category    = body.category
  if (body.condition !== undefined)   data.condition   = body.condition
  if (body.location !== undefined)    data.location    = body.location

  const item = await prisma.diaconateInventory.update({
    where: { id: parseInt(params.id) },
    data,
  })
  return NextResponse.json(item)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await prisma.diaconateInventory.delete({ where: { id: parseInt(params.id) } })
  return NextResponse.json({ ok: true })
}
