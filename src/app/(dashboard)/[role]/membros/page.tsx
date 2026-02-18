import { currentUser } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import FormContainer from "@/components/FormContainer"
import TableSearch from "@/components/TableSearch"
import Pagination from "@/components/Pagination"
import Table from "@/components/Table"
import { Prisma } from "@prisma/client"
import { ITEM_PER_PAGE } from "@/lib/settings"

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

type MemberWithRelations = Prisma.MemberGetPayload<{
  include: {
    societies: { include: { society: true } }
    council: true
    diaconate: true
    ministries: { include: { ministry: true } }
    bibleSchoolClass: true
  }
}>

export default async function RoleMembrosPage({
  params,
  searchParams,
}: {
  params: { role: string }
  searchParams: { [key: string]: string | undefined }
}) {
  const user = await currentUser()
  const roles = (user?.publicMetadata?.roles as string[]) ?? []
  const isSuperAdmin = roles.includes("superadmin")
  const isAdmin = isSuperAdmin || roles.includes("admin")

  const { role } = params
  const config = roleConfig[role]

  if (!config || (!isSuperAdmin && !roles.includes(role))) notFound()

  const p = searchParams.page ? parseInt(searchParams.page) : 1

  // Monta o filtro de where baseado no role
  let memberWhere: Prisma.MemberWhereInput = {}

  if (societyMap[role]) {
    memberWhere = { societies: { some: { societyId: societyMap[role] } } }
  } else if (role === "conselho") {
    memberWhere = { council: { isNot: null } }
  } else if (role === "diaconia") {
    memberWhere = { diaconate: { isNot: null } }
  } else if (role === "ministerio") {
    memberWhere = { ministries: { some: {} } }
  } else if (role === "ebd") {
    memberWhere = { bibleSchoolClassId: { not: null } }
  }

  // Adiciona filtro de busca
  if (searchParams.search) {
    memberWhere = {
      ...memberWhere,
      name: { contains: searchParams.search, mode: "insensitive" },
    }
  }

  const columns = [
    { header: "Info", accessor: "info" },
    { header: "Gênero", accessor: "gender", className: "hidden md:table-cell" },
    { header: "Telefone", accessor: "phone", className: "hidden lg:table-cell" },
    { header: "Email", accessor: "email", className: "hidden xl:table-cell" },
    { header: "Status", accessor: "isActive", className: "hidden md:table-cell" },
    ...(isAdmin ? [{ header: "Ações", accessor: "actions" }] : []),
  ]

  const renderRow = (item: MemberWithRelations) => (
    <tr key={item.id} className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight">
      <td className="flex items-center gap-4 p-4">
        <Image src="/profile.png" alt="" width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
        <div className="flex flex-col">
          <h3 className="font-semibold">{item.name}</h3>
          <p className="text-xs text-gray-500">{item.username || `ID: ${item.id}`}</p>
        </div>
      </td>
      <td className="hidden md:table-cell">
        {item.gender === "MASCULINO" ? (
          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">M</span>
        ) : item.gender === "FEMININO" ? (
          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-pink-100 text-pink-800">F</span>
        ) : <span className="text-gray-400">-</span>}
      </td>
      <td className="hidden lg:table-cell">{item.phone || "-"}</td>
      <td className="hidden xl:table-cell">{item.email || <span className="text-gray-400">-</span>}</td>
      <td className="hidden md:table-cell">
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {item.isActive ? "Ativo" : "Inativo"}
        </span>
      </td>
      {isAdmin && (
        <td>
          <div className="flex items-center gap-2">
            <Link href={`/list/members/${item.id}`}>
              <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky">
                <Image src="/view.png" alt="" width={16} height={16} />
              </button>
            </Link>
            <FormContainer table="member" type="update" data={item} />
            <FormContainer table="member" type="delete" id={item.id} />
          </div>
        </td>
      )}
    </tr>
  )

  const [data, count] = await prisma.$transaction([
    prisma.member.findMany({
      where: memberWhere,
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: { name: "asc" },
      include: {
        societies: { include: { society: true } },
        council: true,
        diaconate: true,
        ministries: { include: { ministry: true } },
        bibleSchoolClass: true,
      },
    }),
    prisma.member.count({ where: memberWhere }),
  ])

  return (
    <div className="p-4 flex flex-col gap-6">

      <Link href={`/${role}`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition w-fit">
        <ArrowLeft size={16} />
        <span>Voltar para {config.label}</span>
      </Link>

      <div className="bg-white p-4 rounded-md flex-1">
        <div className="flex items-center justify-between mb-4">
          <h1 className={`text-lg font-semibold ${config.color}`}>Membros — {config.label}</h1>
          <div className="flex items-center gap-4">
            <TableSearch />
            {isAdmin && <FormContainer table="member" type="create" />}
          </div>
        </div>

        <Table columns={columns} renderRow={renderRow} data={data} />
        <Pagination page={p} count={count} />
      </div>
    </div>
  )
}