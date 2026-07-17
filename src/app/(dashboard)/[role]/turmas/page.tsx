import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import prisma from "@/lib/prisma"
import { getEbdAccess } from "@/lib/ebdAccess"
import EbdTurmasManager from "@/components/ebd/EbdTurmasManager"

export const dynamic = "force-dynamic"

export default async function EbdTurmasPage({ params }: { params: { role: string } }) {
  if (params.role !== "ebd") notFound()

  const access = await getEbdAccess()
  if (!access.canSeeAll) notFound()

  const [classes, allMembers] = await Promise.all([
    prisma.bibleSchoolClass.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { members: true } },
        teachers: { include: { member: { select: { id: true, name: true } } } },
      },
    }),
    prisma.member.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  const data = classes.map((c) => ({
    id: c.id,
    name: c.name,
    memberCount: c._count.members,
    teachers: c.teachers.map((t) => ({ memberId: t.member.id, name: t.member.name })),
  }))

  return (
    <div className="p-4 flex flex-col gap-6">
      <Link href="/ebd" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition w-fit">
        <ArrowLeft size={16} /> Voltar para EBD
      </Link>

      <div className="bg-white p-4 md:p-6 rounded-md">
        <h1 className="text-lg font-semibold text-amber-700 mb-1">Gerenciar Turmas</h1>
        <p className="text-sm text-gray-500 mb-6">Crie turmas, renomeie e atribua professoras.</p>
        <EbdTurmasManager classes={data} allMembers={allMembers} />
      </div>
    </div>
  )
}
