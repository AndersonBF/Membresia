import { currentUser } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import { Inbox } from "lucide-react"
import VisitantesTable from "@/components/VisitantesTable"

export const dynamic = "force-dynamic"

export default async function VisitantesPage() {
  const user = await currentUser()
  const roles = (user?.publicMetadata?.roles as string[]) ?? []
  const canManage =
    roles.includes("admin") || roles.includes("superadmin") || roles.includes("pastor")
  if (!canManage) notFound()

  const rows = await prisma.visitorContact.findMany({
    orderBy: [{ handled: "asc" }, { createdAt: "desc" }],
  })
  const pendentes = rows.filter((r) => !r.handled).length

  const initial = rows.map((r) => ({
    id: r.id,
    name: r.name,
    phone: r.phone,
    message: r.message,
    handled: r.handled,
    createdAt: r.createdAt.toISOString(),
  }))

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
          <Inbox size={20} className="text-green-700" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Visitantes</h1>
          <p className="text-sm text-gray-500">
            Contatos recebidos pelo "Quero conhecer/visitar"
            {pendentes > 0 && <span className="text-amber-600 font-medium"> · {pendentes} novo(s)</span>}
          </p>
        </div>
      </div>

      <VisitantesTable initial={initial} />
    </div>
  )
}
