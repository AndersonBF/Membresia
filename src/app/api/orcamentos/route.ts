import { auth, currentUser } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { fetchOgImage } from "@/lib/ogImage"
import { canAccessOrcamentos, isOrcamentoContext } from "@/lib/orcamentoAccess"

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

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const context = new URL(req.url).searchParams.get("context") ?? ""
  if (!isOrcamentoContext(context)) {
    return NextResponse.json({ error: "Contexto inválido" }, { status: 400 })
  }
  if (!(await canAccessOrcamentos(context))) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
  }

  const orcamentos = await prisma.orcamento.findMany({
    where: { context },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  })
  return NextResponse.json(orcamentos)
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const context = body.context
  if (!isOrcamentoContext(context)) {
    return NextResponse.json({ error: "Contexto inválido" }, { status: 400 })
  }
  if (!(await canAccessOrcamentos(context))) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
  }

  const user = await currentUser()
  const createdByName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.username || null

  const orcamento = await prisma.orcamento.create({
    data: {
      context,
      title: String(body.title ?? "").trim() || "Sem título",
      description: body.description?.trim() || null,
      urgencia: URGENCIAS.includes(body.urgencia) ? body.urgencia : "MEDIA",
      neededBy: body.neededBy ? new Date(body.neededBy) : null,
      freeShipping: !!body.freeShipping,
      shippingCost: body.freeShipping ? 0 : Number(body.shippingCost) || 0,
      createdByName,
      items: { create: await withImages(sanitizeItems(body.items)) },
    },
    include: { items: true },
  })
  return NextResponse.json(orcamento, { status: 201 })
}
