import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import prisma from "@/lib/prisma"
import { canAccessOrcamentos, isOrcamentoContext } from "@/lib/orcamentoAccess"
import OrcamentosManager from "@/components/ebd/OrcamentosManager"

export const dynamic = "force-dynamic"

export default async function OrcamentosPage({ params }: { params: { role: string } }) {
  const context = params.role
  if (!isOrcamentoContext(context)) notFound()
  if (!(await canAccessOrcamentos(context))) notFound()

  const orcamentos = await prisma.orcamento.findMany({
    where: { context },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  })

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
      <Link href={`/${context}`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition w-fit">
        <ArrowLeft size={16} /> Voltar
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-800">Orçamentos</h1>
        <p className="text-sm text-gray-500 mt-1">
          Listas de materiais e livros para compra, com valores, frete e links.
        </p>
      </div>

      <OrcamentosManager initial={data} context={context} />
    </div>
  )
}
