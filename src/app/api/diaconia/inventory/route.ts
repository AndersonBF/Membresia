import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const items = await prisma.diaconateInventory.findMany({
    where: { diaconateId: 1 },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  })
  return NextResponse.json(items)
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const item = await prisma.diaconateInventory.create({
    data: {
      name: body.name,
      description: body.description ?? null,
      quantity: body.quantity ?? 1,
      category: body.category ?? null,
      condition: body.condition ?? "BOM",
      location: body.location ?? null,
      diaconateId: 1,
    },
  })
  return NextResponse.json(item, { status: 201 })
}
