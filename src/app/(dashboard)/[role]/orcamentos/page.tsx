import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import prisma from "@/lib/prisma"
import { getEbdAccess } from "@/lib/ebdAccess"
import OrcamentosManager from "@/components/ebd/OrcamentosManager"

export const dynamic = "force-dynamic"

export default async function OrcamentosPage({ params }: { params: { role: string } }) {
  if (params.role !== "ebd") notFound()

  const access = await getEbdAccess()
  const allowed = access.canSeeAll || access.teacherClassIds.length > 0
  if (!allowed) notFound()

  const orcamentos = await prisma.orcamento.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true },
  })

  // Serializa datas para o componente cliente.
  const data = orcamentos.map((o) => ({
    id: o.id,
    title: o.title,
    description: o.description,
    urgencia: o.urgencia as "ALTA" | "MEDIA" | "BAIXA",
    neededBy: o.neededBy ? o.neededBy.toISOString() : null,
    shippingCost: o.shippingCost,
    freeShipping: o.freeShipping,
    createdByName: o.createdByName,
    createdAt: o.createdAt.toISOString(),
    items: o.items.map((it) => ({
      id: it.id,
      name: it.name,
      price: it.price,
      quantity: it.quantity,
      link: it.link,
      imageUrl: it.imageUrl,
    })),
  }))

  return (
    <div className="p-4 md:p-6 flex flex-col gap-6">
      <Link href="/ebd" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition w-fit">
        <ArrowLeft size={16} /> Voltar para EBD
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-800">Orçamentos</h1>
        <p className="text-sm text-gray-500 mt-1">
          Listas de materiais e livros para compra, com valores, frete e links.
        </p>
      </div>

      <OrcamentosManager initial={data} />
    </div>
  )
}
