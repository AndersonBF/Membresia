// src/app/(dashboard)/[role]/visitantes/page.tsx
import { currentUser } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import prisma from "@/lib/prisma"
import { ArrowLeft, UserRound } from "lucide-react"
import GroupVisitorsTable, { GroupVisitor } from "@/components/GroupVisitorsTable"
import { getManageableGroups } from "@/lib/permissions"
import { isGroupRole, visitorWhereForScope, scopeForRole } from "@/lib/visitorScope"

export const dynamic = "force-dynamic"

const roleConfig: Record<string, { label: string; color: string; accent: string }> = {
  ump:        { label: "UMP",        color: "text-blue-700",   accent: "#2563eb" },
  upa:        { label: "UPA",        color: "text-amber-700",  accent: "#d97706" },
  uph:        { label: "UPH",        color: "text-orange-700", accent: "#ea580c" },
  saf:        { label: "SAF",        color: "text-pink-700",   accent: "#db2777" },
  ucp:        { label: "UCP",        color: "text-yellow-700", accent: "#f59e0b" },
  diaconia:   { label: "Diaconia",   color: "text-teal-700",   accent: "#0d9488" },
  conselho:   { label: "Conselho",   color: "text-indigo-700", accent: "#4f46e5" },
  ministerio: { label: "Ministério", color: "text-green-700",  accent: "#16a34a" },
  ebd:        { label: "EBD",        color: "text-amber-700",  accent: "#b45309" },
}

export default async function RoleVisitantesPage({ params }: { params: { role: string } }) {
  const { role } = params
  const config = roleConfig[role]
  if (!config || !isGroupRole(role)) notFound()

  const user = await currentUser()
  const roles = (user?.publicMetadata?.roles as string[]) ?? []
  const isSuperAdmin = roles.includes("superadmin")
  const isPastor = roles.includes("pastor")
  const isEbdSuperintendent = role === "ebd" && roles.includes("superintendente")

  if (!isSuperAdmin && !isPastor && !isEbdSuperintendent && !roles.includes(role)) notFound()

  const { isAdmin: isGlobalAdmin, groups } = await getManageableGroups()
  const canManage = isGlobalAdmin || groups.has(role)

  const rows = await prisma.visitor.findMany({
    where: visitorWhereForScope(scopeForRole(role)),
    orderBy: { name: "asc" },
    include: {
      attendances: {
        where: { isPresent: true },
        select: { event: { select: { date: true } } },
      },
    },
  })

  const initial: GroupVisitor[] = rows.map((v) => {
    const dates = v.attendances
      .map((a) => a.event?.date)
      .filter((d): d is Date => !!d)
      .sort((a, b) => b.getTime() - a.getTime())

    return {
      id: v.id,
      name: v.name,
      phone: v.phone,
      email: v.email,
      gender: v.gender,
      birthDate: v.birthDate ? v.birthDate.toISOString() : null,
      notes: v.notes,
      isActive: v.isActive,
      createdAt: v.createdAt.toISOString(),
      visits: v.attendances.length,
      lastVisit: dates[0] ? dates[0].toISOString() : null,
    }
  })

  return (
    <div className="p-4 flex flex-col gap-6">
      <Link
        href={`/${role}`}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition w-fit"
      >
        <ArrowLeft size={16} />
        <span>Voltar para {config.label}</span>
      </Link>

      <div className="bg-white p-4 rounded-md flex-1">
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${config.accent}18` }}
          >
            <UserRound size={20} style={{ color: config.accent }} />
          </div>
          <div>
            <h1 className={`text-lg font-semibold ${config.color}`}>
              Visitantes — {config.label}
            </h1>
            <p className="text-sm text-gray-500">
              {initial.length} visitante(s) cadastrado(s) neste grupo
            </p>
          </div>
        </div>

        <GroupVisitorsTable
          initial={initial}
          role={role}
          canManage={canManage}
          accent={config.accent}
        />
      </div>
    </div>
  )
}
