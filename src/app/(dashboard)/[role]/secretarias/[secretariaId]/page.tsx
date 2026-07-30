import { currentUser } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import { societyMap, canManageSociety, getMySecretarias } from "@/lib/permissions"
import SecretariaDetail from "@/components/SecretariaDetail"

export const dynamic = "force-dynamic"

export default async function SecretariaPage({
  params,
  searchParams,
}: {
  params: { role: string; secretariaId: string }
  searchParams: { tab?: string }
}) {
  const { role } = params
  const validTabs = ["membros", "programacoes", "documentos", "orcamentos"] as const
  const activeTab = (validTabs as readonly string[]).includes(searchParams.tab ?? "")
    ? (searchParams.tab as (typeof validTabs)[number])
    : "membros"
  const societyId = societyMap[role]
  const secretariaId = Number(params.secretariaId)

  const user = await currentUser()
  const roles = (user?.publicMetadata?.roles as string[]) ?? []
  const canView =
    roles.includes(role) || roles.includes("pastor") || roles.includes("admin") || roles.includes("superadmin")
  if (!societyId || !canView || !secretariaId) notFound()

  const [secretaria, societyMembers, canManage, mine] = await Promise.all([
    prisma.secretaria.findUnique({
      where: { id: secretariaId },
      select: {
        id: true,
        name: true,
        societyId: true,
        members: { select: { member: { select: { id: true, name: true } } } },
        documents: { select: { id: true, title: true, fileUrl: true }, orderBy: { createdAt: "desc" } },
        events: {
          select: { id: true, title: true, description: true, date: true, startTime: true, endTime: true, isPublic: true },
          orderBy: { date: "desc" },
          take: 30,
        },
        orcamentos: {
          select: {
            id: true,
            title: true,
            urgencia: true,
            status: true,
            createdByName: true,
            items: { select: { name: true, quantity: true, price: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 30,
        },
      },
    }),
    prisma.member.findMany({
      where: { societies: { some: { societyId } } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    canManageSociety(societyId),
    getMySecretarias(),
  ])

  // A secretaria precisa existir e pertencer à sociedade desta rota.
  if (!secretaria || secretaria.societyId !== societyId) notFound()

  const data = {
    id: secretaria.id,
    name: secretaria.name,
    members: secretaria.members.map((m) => ({ id: m.member.id, name: m.member.name })),
    documents: secretaria.documents.map((d) => ({ id: d.id, title: d.title, fileUrl: d.fileUrl })),
    events: secretaria.events.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      date: e.date.toISOString(),
      startTime: e.startTime ? e.startTime.toISOString() : null,
      endTime: e.endTime ? e.endTime.toISOString() : null,
      isPublic: e.isPublic,
    })),
    orcamentos: secretaria.orcamentos.map((o) => ({
      id: o.id,
      title: o.title,
      urgencia: o.urgencia as string,
      status: (o.status ?? "solicitado") as string,
      createdByName: o.createdByName,
      total: o.items.reduce((sum, it) => sum + it.price * it.quantity, 0),
      items: o.items.map((it) => ({ name: it.name, quantity: it.quantity, price: it.price })),
    })),
  }

  return (
    <SecretariaDetail
      role={role}
      societyName={role.toUpperCase()}
      canManage={canManage}
      mine={mine.has(secretaria.id)}
      secretaria={data}
      societyMembers={societyMembers}
      activeTab={activeTab}
    />
  )
}
