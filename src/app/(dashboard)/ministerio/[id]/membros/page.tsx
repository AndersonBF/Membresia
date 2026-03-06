// src/app/(dashboard)/ministerio/[id]/membros/page.tsx
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
import MemberAvatar from "@/components/MemberAvatar"
import MemberDrawerWrapper from "@/components/MemberDrawerWrapper"
import AddMemberToMinistryButton from "@/components/AddMemberToMinistryButton"

type MemberWithRelations = Prisma.MemberGetPayload<{
  include: {
    societies: { include: { society: true } }
    council: true
    diaconate: true
    ministries: { include: { ministry: true } }
    bibleSchoolClass: true
  }
}>

export default async function MinistryMembrosPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { [key: string]: string | undefined }
}) {
  const user = await currentUser()
  const roles = (user?.publicMetadata?.roles as string[]) ?? []
  const isSuperAdmin = roles.includes("superadmin")
  const isAdmin = isSuperAdmin || roles.includes("admin")

  if (!isSuperAdmin && !roles.includes("ministerio")) notFound()

  const ministryId = parseInt(params.id)
  if (isNaN(ministryId)) notFound()

  const ministry = await prisma.ministry.findUnique({ where: { id: ministryId } })
  if (!ministry) notFound()

  const p = searchParams.page ? parseInt(searchParams.page) : 1

  let memberWhere: Prisma.MemberWhereInput = {
    ministries: { some: { ministryId } },
  }

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
    <tr
      key={item.id}
      className="border-b border-gray-200 text-sm hover:bg-lamaPurpleLight transition-colors even:bg-slate-50"
    >
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
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
          item.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}>
          {item.isActive ? "Ativo" : "Inativo"}
        </span>
      </td>

      {isAdmin && (
        <td>
          <div className="flex items-center gap-2">
            <button
              data-drawer={item.id}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky view-trigger"
            >
              <Image src="/view.png" alt="" width={16} height={16} />
            </button>
            <FormContainer table="member" type="update" data={item} />
            <FormContainer table="member" type="delete" id={item.id} />
          </div>
        </td>
      )}
    </tr>
  )

  // Busca todos os membros que ainda NÃO estão neste ministério (para o picker)
  const availableMembers = await prisma.member.findMany({
    where: {
      isActive: true,
      ministries: { none: { ministryId } },
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

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
      <Link
        href={`/ministerio/${ministryId}`}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition w-fit"
      >
        <ArrowLeft size={16} />
        <span>Voltar para {ministry.name}</span>
      </Link>

      <div className="bg-white p-4 rounded-md flex-1">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold text-green-700">
            Membros — {ministry.name}
          </h1>
          <div className="flex items-center gap-3">
            <TableSearch />
            {isAdmin && (
              <>
                {/* Adicionar membro existente ao ministério */}
                <AddMemberToMinistryButton
                  ministryId={ministryId}
                  availableMembers={availableMembers}
                />
                {/* Criar novo membro */}
                <FormContainer table="member" type="create" />
              </>
            )}
          </div>
        </div>

        <Table columns={columns} renderRow={renderRow} data={data} />
        <Pagination page={p} count={count} />
      </div>

      <MemberDrawerWrapper
        members={data.map((m) => ({
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
          societies: m.societies.map((s) => ({
            societyId: s.societyId,
            cargo: s.cargo ?? null,
            society: { name: s.society.name },
          })),
          council: m.council ? { councilId: m.council.councilId } : null,
          diaconate: m.diaconate ? { diaconateId: m.diaconate.diaconateId } : null,
          ministries: m.ministries.map((mm) => ({ ministry: { name: mm.ministry.name } })),
          bibleSchoolClass: m.bibleSchoolClass
            ? { name: (m.bibleSchoolClass as any).name ?? "" }
            : null,
        }))}
        isAdmin={isAdmin}
        role="ministerio"
      />
    </div>
  )
}