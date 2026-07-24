import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { fetchOgImage } from "@/lib/ogImage"
import { canAccessOrcamentos } from "@/lib/orcamentoAccess"

const URGENCIAS = ["ALTA", "MEDIA", "BAIXA"] as const

function sanitizeItems(raw: unknown) {
  const arr = Array.isArray(raw) ? raw : []
  return arr
    .filter((it: any) => it && String(it.name ?? "").trim())
    .map((it: any) => ({
      name: String(it.name).trim(),
      price: Number(it.price) || 0,
      quantity: Math.max(1, parseInt(it.quantity) || 1),
      link: it.link?.trim() || null,
    }))
}

async function withImages(items: ReturnType<typeof sanitizeItems>) {
  return Promise.all(
    items.map(async (it) => ({
      ...it,
      imageUrl: it.link ? await fetchOgImage(it.link) : null,
    })),
  )
}

// Carrega o orçamento e confirma que o usuário pode acessá-lo (pelo contexto dele).
async function loadAndAuthorize(id: number) {
  const { userId } = await auth()
  if (!userId) return { ok: false as const, status: 401, error: "Unauthorized" }

  const orcamento = await prisma.orcamento.findUnique({ where: { id }, include: { items: true } })
  if (!orcamento) return { ok: false as const, status: 404, error: "Não encontrado" }

  if (!(await canAccessOrcamentos(orcamento.context))) {
    return { ok: false as const, status: 403, error: "Sem permissão" }
  }
  return { ok: true as const, orcamento }
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const res = await loadAndAuthorize(Number(params.id))
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: res.status })
  return NextResponse.json(res.orcamento)
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  const res = await loadAndAuthorize(id)
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: res.status })

  const body = await req.json()
  const orcamento = await prisma.orcamento.update({
    where: { id },
    data: {
      title: String(body.title ?? "").trim() || "Sem título",
      description: body.description?.trim() || null,
      urgencia: URGENCIAS.includes(body.urgencia) ? body.urgencia : "MEDIA",
      neededBy: body.neededBy ? new Date(body.neededBy) : null,
      freeShipping: !!body.freeShipping,
      shippingCost: body.freeShipping ? 0 : Number(body.shippingCost) || 0,
      items: {
        deleteMany: {},
        create: await withImages(sanitizeItems(body.items)),
      },
    },
    include: { items: true },
  })
  return NextResponse.json(orcamento)
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  const res = await loadAndAuthorize(id)
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: res.status })

  await prisma.orcamento.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
