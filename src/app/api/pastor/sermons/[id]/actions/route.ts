// src/app/api/pastor/sermons/[id]/actions/route.ts
// Ações sobre um sermão: duplicar e marcar como pregado.
// POST body: { action: "duplicar" } | { action: "pregado", date?: string, local?: string }
import { currentUser } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  if (!Number.isInteger(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const roles = (user.publicMetadata?.roles as string[]) ?? []
  if (!roles.includes("pastor") && !roles.includes("superadmin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const sermon = await prisma.sermon.findUnique({ where: { id } })
  if (!sermon) return NextResponse.json({ error: "Não encontrado" }, { status: 404 })
  if (sermon.authorId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const action = body?.action

  // ── Duplicar: cria uma cópia como rascunho, preservando estrutura ──
  if (action === "duplicar") {
    const copy = await prisma.sermon.create({
      data: {
        authorId: sermon.authorId,
        authorName: sermon.authorName,
        title: `${sermon.title} (cópia)`,
        passage: sermon.passage,
        content: sermon.content,
        blocks: sermon.blocks ?? undefined,
        series: sermon.series,
        tags: sermon.tags,
        date: null,
        status: "rascunho",
      },
    })
    return NextResponse.json({ sermon: copy }, { status: 201 })
  }

  // ── Marcar como pregado: guarda a data e lança no Diário do Pastor ──
  if (action === "pregado") {
    const when = body?.date ? new Date(body.date) : new Date()
    if (isNaN(when.getTime())) return NextResponse.json({ error: "Data inválida" }, { status: 400 })

    const updated = await prisma.sermon.update({
      where: { id },
      data: {
        preachedAt: { push: when },
        status: "pronto",
      },
    })

    // Integração com o Diário: registra automaticamente a pregação.
    const local = typeof body?.local === "string" && body.local.trim() ? body.local.trim() : null
    await prisma.pastorDiaryEntry.create({
      data: {
        authorId: user.id,
        authorName: sermon.authorName,
        category: "Culto",
        title: `Preguei: ${sermon.title}`,
        description: [sermon.passage ? `Texto: ${sermon.passage}` : null, local ? `Local: ${local}` : null]
          .filter(Boolean)
          .join(" · ") || null,
        visits: 0,
        date: when,
      },
    })

    return NextResponse.json({ sermon: updated })
  }

  return NextResponse.json({ error: "Ação desconhecida" }, { status: 400 })
}
