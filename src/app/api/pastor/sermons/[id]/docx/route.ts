// src/app/api/pastor/sermons/[id]/docx/route.ts
// Exporta o sermão em .docx (para imprimir ou levar ao púlpito).
import { currentUser } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

const LABELS: Record<string, string> = {
  introducao: "INTRODUÇÃO",
  ponto: "PONTO",
  ilustracao: "ILUSTRAÇÃO",
  aplicacao: "APLICAÇÃO",
  conclusao: "CONCLUSÃO",
  oracao: "ORAÇÃO",
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
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

  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import("docx")

  const blocks = (Array.isArray(sermon.blocks) ? sermon.blocks : []) as { type: string; text: string }[]
  const pontoCount = new Map<string, number>()

  const children: any[] = [
    new Paragraph({
      text: sermon.title,
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
    }),
  ]

  const sub = [sermon.passage, sermon.series ? `Série: ${sermon.series}` : null]
    .filter(Boolean)
    .join("  ·  ")
  if (sub) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
        children: [new TextRun({ text: sub, italics: true, color: "555555" })],
      })
    )
  }

  for (const b of blocks) {
    if (!b?.text?.trim()) continue
    const base = LABELS[b.type] ?? b.type.toUpperCase()
    let label = base
    if (b.type === "ponto") {
      const n = (pontoCount.get("ponto") ?? 0) + 1
      pontoCount.set("ponto", n)
      label = `${base} ${n}`
    }
    children.push(
      new Paragraph({
        spacing: { before: 280, after: 100 },
        children: [new TextRun({ text: label, bold: true, size: 22 })],
      })
    )
    for (const par of b.text.split(/\n{2,}/)) {
      children.push(
        new Paragraph({
          spacing: { after: 120, line: 320 },
          children: [new TextRun({ text: par.replace(/\n/g, " "), size: 24 })],
        })
      )
    }
  }

  const doc = new Document({ sections: [{ children }] })
  const buffer = await Packer.toBuffer(doc)

  const safe = sermon.title.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-")

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${safe || "sermao"}.docx"`,
    },
  })
}
