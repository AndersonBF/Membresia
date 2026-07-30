import { currentUser } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Landmark } from "lucide-react"
import prisma from "@/lib/prisma"
import { societyMap, canManageSociety, getMySecretarias } from "@/lib/permissions"
import { accentFor } from "@/lib/societyAccent"
import SecretariasList from "@/components/SecretariasList"

export const dynamic = "force-dynamic"

export default async function SecretariasPage({ params }: { params: { role: string } }) {
  const { role } = params
  const societyId = societyMap[role]

  const user = await currentUser()
  const roles = (user?.publicMetadata?.roles as string[]) ?? []
  const canView =
    roles.includes(role) || roles.includes("pastor") || roles.includes("admin") || roles.includes("superadmin")
  if (!societyId || !canView) notFound()

  const [society, secretarias, canManage, mine] = await Promise.all([
    prisma.internalSociety.findUnique({ where: { id: societyId }, select: { name: true } }),
    prisma.secretaria.findMany({
      where: { societyId },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        _count: { select: { members: true, events: true, documents: true, orcamentos: true } },
      },
    }),
    canManageSociety(societyId),
    getMySecretarias(),
  ])

  const data = secretarias.map((s) => ({
    id: s.id,
    name: s.name,
    members: s._count.members,
    events: s._count.events,
    documents: s._count.documents,
    orcamentos: s._count.orcamentos,
    mine: mine.has(s.id),
  }))

  const ac = accentFor(role)

  return (
    <div className="bg-gray-50 min-h-screen">
      <div style={{ background: ac.dark }}>
        <div className="px-6 md:px-10 pt-6 pb-8">
          <Link href={`/${role}`} className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs transition">
            <ArrowLeft size={13} /> {role.toUpperCase()}
          </Link>
          <div className="flex items-center gap-4 mt-4">
            <div className="rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.08)" }}>
              <Landmark size={30} className="text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold" style={{ fontSize: "clamp(1.7rem,5vw,2.4rem)" }}>Secretarias</h1>
              <p className="text-white/50 text-sm mt-1 font-light">{society?.name ?? role.toUpperCase()}</p>
            </div>
          </div>
        </div>
        <div style={{ height: 2, background: `linear-gradient(90deg, ${ac.color}, ${ac.color}55, transparent)` }} />
      </div>

      <div className="p-4 md:p-6 max-w-4xl">
        <SecretariasList role={role} societyId={societyId} canManage={canManage} secretarias={data} />
      </div>
    </div>
  )
}
