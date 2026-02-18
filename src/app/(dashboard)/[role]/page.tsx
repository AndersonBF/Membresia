import { currentUser } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import Announcements from "@/components/Announcements"
import EventCalendarContainer from "@/components/EventCalendarContainer"
import prisma from "@/lib/prisma"
import Image from "next/image"
import Link from "next/link"
import { Users, Calendar, FileText, ArrowLeft } from "lucide-react"

const roleConfig: Record<string, { label: string; color: string; bg: string }> = {
  ump:        { label: "UMP",        color: "text-blue-700",   bg: "bg-blue-100" },
  upa:        { label: "UPA",        color: "text-purple-700", bg: "bg-purple-100" },
  uph:        { label: "UPH",        color: "text-orange-700", bg: "bg-orange-100" },
  saf:        { label: "SAF",        color: "text-pink-700",   bg: "bg-pink-100" },
  ucp:        { label: "UCP",        color: "text-yellow-700", bg: "bg-yellow-100" },
  diaconia:   { label: "Diaconia",   color: "text-teal-700",   bg: "bg-teal-100" },
  conselho:   { label: "Conselho",   color: "text-indigo-700", bg: "bg-indigo-100" },
  ministerio: { label: "Ministério", color: "text-green-700",  bg: "bg-green-100" },
  ebd:        { label: "EBD",        color: "text-amber-700",  bg: "bg-amber-100" },
}

const societyMap: Record<string, number> = {
  saf: 3, uph: 4, ump: 5, upa: 6, ucp: 7,
}

async function getDataForRole(role: string) {
  let memberWhere: any = {}
  let eventWhere: any = {}
  let documentWhere: any = {}

  if (societyMap[role]) {
    memberWhere = { societies: { some: { societyId: societyMap[role] } } }
    eventWhere = { societyId: societyMap[role] }
    documentWhere = { societyId: societyMap[role] }
  } else if (role === "conselho") {
    memberWhere = { council: { isNot: null } }
    documentWhere = { councilId: 1 }
  } else if (role === "diaconia") {
    memberWhere = { diaconate: { isNot: null } }
    documentWhere = { diaconateId: 1 }
  } else if (role === "ministerio") {
    memberWhere = { ministries: { some: {} } }
    documentWhere = { ministryId: { not: null } }
  } else if (role === "ebd") {
    memberWhere = { bibleSchoolClassId: { not: null } }
    documentWhere = { bibleSchoolClassId: { not: null } }
  }

  const [totalMembers, totalEvents, totalDocuments, recentMembers] = await Promise.all([
    prisma.member.count({ where: memberWhere }),
    prisma.event.count({ where: eventWhere }),
    prisma.document.count({ where: documentWhere }),
    prisma.member.findMany({
      where: memberWhere,
      orderBy: { name: "asc" },
      take: 5,
    }),
  ])

  return { totalMembers, totalEvents, totalDocuments, recentMembers }
}

const RolePage = async ({
  params,
  searchParams,
}: {
  params: { role: string }
  searchParams: { [key: string]: string | undefined }
}) => {
  const user = await currentUser()
  const roles = (user?.publicMetadata?.roles as string[]) ?? []
  const isSuperAdmin = roles.includes("superadmin")

  const { role } = params
  const config = roleConfig[role]

  if (!config || (!isSuperAdmin && !roles.includes(role))) {
    notFound()
  }

  const { totalMembers, totalEvents, totalDocuments, recentMembers } = await getDataForRole(role)

  const cards = [
    { label: "Membros", value: totalMembers, icon: Users, color: "bg-blue-50 text-blue-700" },
    { label: "Eventos", value: totalEvents, icon: Calendar, color: "bg-green-50 text-green-700" },
    { label: "Documentos", value: totalDocuments, icon: FileText, color: "bg-amber-50 text-amber-700" },
  ]

  return (
    <div className="p-4 flex gap-4 flex-col md:flex-row">
      <div className="w-full lg:w-2/3 flex flex-col gap-6">

        {/* BOTÃO VOLTAR + HEADER */}
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition"
          >
            <ArrowLeft size={16} />
            <span>Voltar para grupos</span>
          </Link>
        </div>

        <div className={`${config.bg} ${config.color} rounded-xl px-6 py-5 shadow-sm`}>
          <h1 className="text-2xl font-bold">{config.label}</h1>
        </div>

        {/* CARDS DE RESUMO */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {cards.map((card) => {
            const Icon = card.icon
            return (
              <div key={card.label} className={`${card.color} rounded-xl p-5 flex items-center gap-4 shadow-sm`}>
                <Icon size={28} className="shrink-0" />
                <div>
                  <p className="text-2xl font-bold">{card.value}</p>
                  <p className="text-sm">{card.label}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* MEMBROS RECENTES */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-700">Membros recentes</h2>
            <Link
              href={`/${role}/membros`}
              className="text-sm text-blue-600 hover:underline"
            >
              Ver todos
            </Link>
          </div>
          {recentMembers.length === 0 ? (
            <p className="p-6 text-gray-500 text-sm">Nenhum membro neste grupo.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-left">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3 hidden md:table-cell">Username</th>
                  <th className="px-4 py-3 hidden md:table-cell">Gênero</th>
                  <th className="px-4 py-3 hidden md:table-cell">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentMembers.map((m) => (
                  <tr key={m.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Image src="/profile.png" alt="" width={32} height={32} className="rounded-full" />
                        <span className="font-medium">{m.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-gray-500">{m.username ?? "-"}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {m.gender === "MASCULINO" ? (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">M</span>
                      ) : m.gender === "FEMININO" ? (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-pink-100 text-pink-800">F</span>
                      ) : "-"}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${m.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {m.isActive ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="w-full lg:w-1/3 flex flex-col gap-8">
        <EventCalendarContainer searchParams={searchParams} />
        <Announcements />
      </div>
    </div>
  )
}

export default RolePage