import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// Lista as indisponibilidades futuras dos diáconos.
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const today = new Date()
  const from = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))

  const items = await prisma.diaconateUnavailability.findMany({
    where: {
      date: { gte: from },
      member: { diaconate: { isNot: null } },
    },
    orderBy: [{ date: "asc" }],
    include: { member: { select: { id: true, name: true, profileImageUrl: true } } },
  })
  return NextResponse.json(items)
}

// Registra a indisponibilidade de um diácono em uma data.
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const memberId = parseInt(body.memberId, 10)
  if (!memberId || !body.date) {
    return NextResponse.json({ error: "Diácono e data são obrigatórios" }, { status: 400 })
  }

  const item = await prisma.diaconateUnavailability.upsert({
    where: { memberId_date: { memberId, date: new Date(body.date) } },
    update: { reason: body.reason?.trim() || null },
    create: { memberId, date: new Date(body.date), reason: body.reason?.trim() || null },
    include: { member: { select: { id: true, name: true, profileImageUrl: true } } },
  })
  return NextResponse.json(item, { status: 201 })
}

// Remove uma indisponibilidade por id (?id=).
export async function DELETE(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const id = parseInt(new URL(req.url).searchParams.get("id") || "", 10)
  if (!id) return NextResponse.json({ error: "id inválido" }, { status: 400 })

  await prisma.diaconateUnavailability.delete({ where: { id } }).catch(() => {})
  return NextResponse.json({ ok: true })
}
