// src/app/api/pastor/sermons/route.ts
// Sermões são PESSOAIS: cada autor só enxerga e mexe nos próprios.
import { currentUser } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

async function requireAuthor() {
  const user = await currentUser()
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }

  const roles = (user.publicMetadata?.roles as string[]) ?? []
  if (!roles.includes("pastor") && !roles.includes("superadmin")) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }
  return { user }
}

// GET — lista apenas os sermões do próprio autor
export async function GET(req: NextRequest) {
  const auth = await requireAuthor()
  if (auth.error) return auth.error
  const user = auth.user!

  const where: any = { authorId: user.id }
  const status = req.nextUrl.searchParams.get("status")
  if (status === "rascunho" || status === "pronto") where.status = status

  const sermons = await prisma.sermon.findMany({
    where,
    orderBy: { updatedAt: "desc" },
  })

  return NextResponse.json({ sermons })
}

// POST — cria um sermão (rascunho por padrão)
export async function POST(req: NextRequest) {
  const auth = await requireAuthor()
  if (auth.error) return auth.error
  const user = auth.user!

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Corpo inválido" }, { status: 400 })

  const { title, passage, content, date, status, blocks, series, tags } = body
  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "Título obrigatório" }, { status: 400 })
  }
  if (date && isNaN(new Date(date).getTime())) {
    return NextResponse.json({ error: "Data inválida" }, { status: 400 })
  }

  const authorName =
    user.fullName ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.username ||
    "Pastor"

  const sermon = await prisma.sermon.create({
    data: {
      authorId: user.id,
      authorName,
      title: title.trim(),
      passage: passage?.trim() || null,
      content: content?.trim() || null,
      blocks: Array.isArray(blocks) ? blocks : undefined,
      series: series?.trim() || null,
      tags: Array.isArray(tags) ? tags.filter(Boolean) : [],
      date: date ? new Date(date) : null,
      status: status === "pronto" ? "pronto" : "rascunho",
    },
  })

  return NextResponse.json({ sermon }, { status: 201 })
}
