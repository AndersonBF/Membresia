// src/app/api/pastor/diary/route.ts
import { currentUser } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { DIARY_CATEGORIES as CATEGORIES, DiaryCategory as Category } from "@/lib/pastorDiary"

function getAccess(roles: string[]) {
  const isSuperAdmin = roles.includes("superadmin")
  const isPastor = roles.includes("pastor")
  return { isSuperAdmin, isPastor, allowed: isSuperAdmin || isPastor }
}

// GET — lista as entradas do diário.
// Pastor vê apenas as próprias; superadmin vê todas (fase de teste).
// Filtros opcionais: ?category=Visita & ?month=YYYY-MM
export async function GET(req: NextRequest) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const roles = (user.publicMetadata?.roles as string[]) ?? []
  const { isSuperAdmin, allowed } = getAccess(roles)
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const where: any = {}
  // Pastor só enxerga as próprias entradas; superadmin enxerga todas.
  if (!isSuperAdmin) where.authorId = user.id

  const category = req.nextUrl.searchParams.get("category")
  if (category && CATEGORIES.includes(category as Category)) where.category = category

  const month = req.nextUrl.searchParams.get("month") // YYYY-MM
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split("-").map(Number)
    where.date = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) }
  }

  const entries = await prisma.pastorDiaryEntry.findMany({
    where,
    orderBy: { date: "desc" },
  })

  return NextResponse.json({ entries })
}

// POST — cria uma entrada. O autor é sempre o usuário logado.
export async function POST(req: NextRequest) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const roles = (user.publicMetadata?.roles as string[]) ?? []
  const { allowed } = getAccess(roles)
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Corpo inválido" }, { status: 400 })

  const { category, title, description, visits, date } = body

  if (!CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Categoria inválida" }, { status: 400 })
  }
  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "Título obrigatório" }, { status: 400 })
  }
  if (!date || isNaN(new Date(date).getTime())) {
    return NextResponse.json({ error: "Data inválida" }, { status: 400 })
  }
  const visitsNum = Number(visits)
  if (!Number.isFinite(visitsNum) || visitsNum < 0) {
    return NextResponse.json({ error: "Nº de visitas inválido" }, { status: 400 })
  }

  const authorName =
    user.fullName ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.username ||
    "Pastor"

  const entry = await prisma.pastorDiaryEntry.create({
    data: {
      authorId: user.id,
      authorName,
      category,
      title: title.trim(),
      description: description?.trim() || null,
      visits: Math.floor(visitsNum),
      date: new Date(date),
    },
  })

  return NextResponse.json({ entry }, { status: 201 })
}
