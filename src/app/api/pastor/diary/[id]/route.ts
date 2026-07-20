// src/app/api/pastor/diary/[id]/route.ts
import { currentUser } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { DIARY_CATEGORIES as CATEGORIES } from "@/lib/pastorDiary"

// Regras: o próprio autor edita/exclui suas entradas; superadmin também (fase de teste).
async function loadAndAuthorize(id: number) {
  const user = await currentUser()
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }

  const roles = (user.publicMetadata?.roles as string[]) ?? []
  const isSuperAdmin = roles.includes("superadmin")
  const isPastor = roles.includes("pastor")
  if (!isSuperAdmin && !isPastor) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  const entry = await prisma.pastorDiaryEntry.findUnique({ where: { id } })
  if (!entry) return { error: NextResponse.json({ error: "Não encontrado" }, { status: 404 }) }

  // Só o autor (ou superadmin) pode mutar.
  if (!isSuperAdmin && entry.authorId !== user.id) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return { user, entry }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  if (!Number.isInteger(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

  const auth = await loadAndAuthorize(id)
  if (auth.error) return auth.error

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Corpo inválido" }, { status: 400 })

  const { category, title, description, visits, date, isPrivate } = body

  if (category !== undefined && !CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Categoria inválida" }, { status: 400 })
  }
  if (title !== undefined && (typeof title !== "string" || !title.trim())) {
    return NextResponse.json({ error: "Título obrigatório" }, { status: 400 })
  }
  if (date !== undefined && isNaN(new Date(date).getTime())) {
    return NextResponse.json({ error: "Data inválida" }, { status: 400 })
  }
  let visitsNum: number | undefined
  if (visits !== undefined) {
    visitsNum = Number(visits)
    if (!Number.isFinite(visitsNum) || visitsNum < 0) {
      return NextResponse.json({ error: "Nº de visitas inválido" }, { status: 400 })
    }
  }

  const updated = await prisma.pastorDiaryEntry.update({
    where: { id },
    data: {
      ...(category !== undefined ? { category } : {}),
      ...(title !== undefined ? { title: title.trim() } : {}),
      ...(description !== undefined ? { description: description?.trim() || null } : {}),
      ...(visitsNum !== undefined ? { visits: Math.floor(visitsNum) } : {}),
      ...(isPrivate !== undefined ? { isPrivate: Boolean(isPrivate) } : {}),
      ...(date !== undefined ? { date: new Date(date) } : {}),
    },
  })

  return NextResponse.json({ entry: updated })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  if (!Number.isInteger(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

  const auth = await loadAndAuthorize(id)
  if (auth.error) return auth.error

  await prisma.pastorDiaryEntry.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
