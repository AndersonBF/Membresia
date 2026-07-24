import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getEbdAccess } from "@/lib/ebdAccess"
import { fetchOgImage } from "@/lib/ogImage"

async function ensureAccess() {
  const { userId } = await auth()
  if (!userId) return { ok: false as const, status: 401, error: "Unauthorized" }
  const access = await getEbdAccess()
  const allowed = access.canSeeAll || access.teacherClassIds.length > 0
  if (!allowed) return { ok: false as const, status: 403, error: "Sem permissão" }
  return { ok: true as const, access }
}

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

// Para cada item com link, tenta puxar a imagem do produto (best-effort).
async function withImages(items: ReturnType<typeof sanitizeItems>) {
  return Promise.all(
    items.map(async (it) => ({
      ...it,
      imageUrl: it.link ? await fetchOgImage(it.link) : null,
    })),
  )
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const gate = await ensureAccess()
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  const orcamento = await prisma.orcamento.findUnique({
    where: { id: Number(params.id) },
    include: { items: true },
  })
  if (!orcamento) return NextResponse.json({ error: "Não encontrado" }, { status: 404 })
  return NextResponse.json(orcamento)
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const gate = await ensureAccess()
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  const body = await req.json()

  const orcamento = await prisma.orcamento.update({
    where: { id: Number(params.id) },
    data: {
      title: String(body.title ?? "").trim() || "Sem título",
      description: body.description?.trim() || null,
      urgencia: URGENCIAS.includes(body.urgencia) ? body.urgencia : "MEDIA",
      neededBy: body.neededBy ? new Date(body.neededBy) : null,
      freeShipping: !!body.freeShipping,
      shippingCost: body.freeShipping ? 0 : Number(body.shippingCost) || 0,
      // Substitui todos os itens pelos enviados.
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
  const gate = await ensureAccess()
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status })

  await prisma.orcamento.delete({ where: { id: Number(params.id) } })
  return NextResponse.json({ ok: true })
}
