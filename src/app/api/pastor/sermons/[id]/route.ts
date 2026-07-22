// src/app/api/pastor/sermons/[id]/route.ts
// Editar/excluir sermão — somente o próprio autor.
import { currentUser } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

async function loadOwned(id: number) {
  const user = await currentUser()
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }

  const roles = (user.publicMetadata?.roles as string[]) ?? []
  if (!roles.includes("pastor") && !roles.includes("superadmin")) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  const sermon = await prisma.sermon.findUnique({ where: { id } })
  if (!sermon) return { error: NextResponse.json({ error: "Não encontrado" }, { status: 404 }) }

  // Sermão é pessoal: nem superadmin acessa o de outro autor.
  if (sermon.authorId !== user.id) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return { user, sermon }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  if (!Number.isInteger(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

  const auth = await loadOwned(id)
  if (auth.error) return auth.error

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Corpo inválido" }, { status: 400 })

  const { title, passage, content, date, status, blocks, series, tags } = body

  if (title !== undefined && (typeof title !== "string" || !title.trim())) {
    return NextResponse.json({ error: "Título obrigatório" }, { status: 400 })
  }
  if (date !== undefined && date !== null && isNaN(new Date(date).getTime())) {
    return NextResponse.json({ error: "Data inválida" }, { status: 400 })
  }

  const updated = await prisma.sermon.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title: title.trim() } : {}),
      ...(passage !== undefined ? { passage: passage?.trim() || null } : {}),
      ...(content !== undefined ? { content: content?.trim() || null } : {}),
      ...(Array.isArray(blocks) ? { blocks } : {}),
      ...(series !== undefined ? { series: series?.trim() || null } : {}),
      ...(Array.isArray(tags) ? { tags: tags.filter(Boolean) } : {}),
      ...(date !== undefined ? { date: date ? new Date(date) : null } : {}),
      ...(status !== undefined ? { status: status === "pronto" ? "pronto" : "rascunho" } : {}),
    },
  })

  return NextResponse.json({ sermon: updated })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  if (!Number.isInteger(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

  const auth = await loadOwned(id)
  if (auth.error) return auth.error

  await prisma.sermon.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
