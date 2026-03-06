// src/app/(dashboard)/[role]/membros/page.tsx
import { currentUser } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Eye } from "lucide-react"
import FormContainer from "@/components/FormContainer"
import TableSearch from "@/components/TableSearch"
import Pagination from "@/components/Pagination"
import Table from "@/components/Table"
import { Prisma } from "@prisma/client"
import { ITEM_PER_PAGE } from "@/lib/settings"
import MemberAvatar from "@/components/MemberAvatar"
import MemberDrawerWrapper from "@/components/MemberDrawerWrapper"

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
  const isSociedade = !!societyMap[role]

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

  if (searchParams.search) {
    memberWhere = {
      ...memberWhere,
      name: { contains: searchParams.search, mode: "insensitive" },
    }
  }

  const columns = [
    { header: "Info", accessor: "info" },
    ...(isSociedade ? [{ header: "Cargo", accessor: "cargo", className: "hidden md:table-cell" }] : []),
    { header: "Gênero", accessor: "gender", className: "hidden md:table-cell" },
    { header: "Telefone", accessor: "phone", className: "hidden lg:table-cell" },
    { header: "Email", accessor: "email", className: "hidden xl:table-cell" },
    { header: "Status", accessor: "isActive", className: "hidden md:table-cell" },
    ...(isAdmin ? [{ header: "Ações", accessor: "actions" }] : []),
  ]

  const renderRow = (item: MemberWithRelations) => {
    const cargo = isSociedade
      ? item.societies?.find((s) => s.societyId === societyMap[role])?.cargo
      : null
    const hasCargo = !!cargo

    return (
      <tr
        key={item.id}
        className={`border-b border-gray-200 text-sm hover:bg-lamaPurpleLight transition-colors
          ${hasCargo ? "bg-amber-50" : "even:bg-slate-50"}`}
      >
        {/* INFO */}
        <td className="flex items-center gap-4 p-4">
          <MemberAvatar
            name={item.name}
            profileImageUrl={(item as any).profileImageUrl}
            size={40}
          />
          <div className="flex flex-col">
            <h3 className="font-semibold">{item.name}</h3>
            <p className="text-xs text-gray-500">{item.username || `ID: ${item.id}`}</p>
          </div>
        </td>

        {/* CARGO */}
        {isSociedade && (
          <td className="hidden md:table-cell">
            {hasCargo ? (
              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                {cargo}
              </span>
            ) : (
              <span className="text-gray-400 text-xs">—</span>
            )}
          </td>
        )}

        {/* GÊNERO */}
        <td className="hidden md:table-cell">
          {item.gender === "MASCULINO" ? (
            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">M</span>
          ) : item.gender === "FEMININO" ? (
            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-pink-100 text-pink-800">F</span>
          ) : <span className="text-gray-400">-</span>}
        </td>

        {/* TELEFONE */}
        <td className="hidden lg:table-cell">{item.phone || "-"}</td>

        {/* EMAIL */}
        <td className="hidden xl:table-cell">{item.email || <span className="text-gray-400">-</span>}</td>

        {/* STATUS */}
        <td className="hidden md:table-cell">
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
            {item.isActive ? "Ativo" : "Inativo"}
          </span>
        </td>

        {/* AÇÕES */}
        {isAdmin && (
          <td>
            <div className="flex items-center gap-2">
              {/* botão view — aciona o drawer via hidden button */}
            <button
              data-drawer={item.id}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-sky-500 hover:bg-sky-600 transition"
            >
              <Eye size={14} className="pointer-events-none text-white" />
            </button>
              <FormContainer table="member" type="update" data={item} />
              <FormContainer table="member" type="delete" id={item.id} />
            </div>
          </td>
        )}
      </tr>
    )
  }

  const [data, count] = await prisma.$transaction([
    prisma.member.findMany({
      where: memberWhere,
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: [
        { societies: { _count: "desc" } },
        { name: "asc" },
      ],
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
          <div className="flex items-center gap-3">
            <h1 className={`text-lg font-semibold ${config.color}`}>Membros — {config.label}</h1>
            {isSociedade && (
              <span className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
                🏅 Destacado = diretoria
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <TableSearch />
            {isAdmin && <FormContainer table="member" type="create" />}
          </div>
        </div>

        <Table columns={columns} renderRow={renderRow} data={data} />
        <Pagination page={p} count={count} />
      </div>

      {/* Drawer — client component que escuta cliques nos botões .view-trigger */}
      <MemberDrawerWrapper
        members={data.map(m => ({
          id: m.id,
          name: m.name,
          username: m.username,
          profileImageUrl: (m as any).profileImageUrl ?? null,
          gender: m.gender,
          isActive: m.isActive,
          phone: m.phone ?? null,
          email: m.email ?? null,
          birthDate: m.birthDate ? m.birthDate.toISOString() : null,
          createdAt: m.createdAt.toISOString(),
          societies: m.societies.map(s => ({
            societyId: s.societyId,
            cargo: s.cargo ?? null,
            society: { name: s.society.name },
          })),
          council:   m.council   ? { councilId: m.council.councilId }     : null,
          diaconate: m.diaconate ? { diaconateId: m.diaconate.diaconateId } : null,
          ministries: m.ministries.map(mm => ({ ministry: { name: mm.ministry.name } })),
          bibleSchoolClass: m.bibleSchoolClass ? { name: (m.bibleSchoolClass as any).name ?? "" } : null,
        }))}
        isAdmin={isAdmin}
        role={role}
      />
    </div>
  )
}