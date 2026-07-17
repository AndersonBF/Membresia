import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import prisma from "@/lib/prisma"
import { getEbdAccess, canAccessClass } from "@/lib/ebdAccess"
import EbdAttendanceTaker from "@/components/ebd/EbdAttendanceTaker"

export const dynamic = "force-dynamic"

/** Domingo mais recente no formato YYYY-MM-DD (UTC) */
function currentSundayStr(): string {
  const now = new Date()
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  d.setUTCDate(d.getUTCDate() - d.getUTCDay())
  return d.toISOString().slice(0, 10)
}

export default async function ChamadaPage({
  params,
  searchParams,
}: {
  params: { role: string; classId: string }
  searchParams: { date?: string }
}) {
  if (params.role !== "ebd") notFound()
  const classId = Number(params.classId)
  if (!classId) notFound()

  const access = await getEbdAccess()
  if (!canAccessClass(access, classId)) notFound()

  const dateStr = /^\d{4}-\d{2}-\d{2}$/.test(searchParams.date ?? "")
    ? (searchParams.date as string)
    : currentSundayStr()

  const turma = await prisma.bibleSchoolClass.findUnique({
    where: { id: classId },
    select: {
      id: true,
      name: true,
      members: {
        where: { isActive: true },
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
      },
    },
  })

  if (!turma) notFound()

  const lesson = await prisma.bibleSchoolLesson.findUnique({
    where: { classId_date: { classId, date: new Date(`${dateStr}T00:00:00.000Z`) } },
    include: { attendances: { select: { memberId: true, isPresent: true } } },
  })

  return (
    <div className="p-4 flex flex-col gap-4">
      <Link href={`/ebd/turma/${classId}`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition w-fit">
        <ArrowLeft size={16} /> Voltar para a turma
      </Link>

      <div className="bg-white p-4 md:p-6 rounded-md">
        <EbdAttendanceTaker
          classId={classId}
          className={turma.name}
          date={dateStr}
          members={turma.members}
          existing={lesson?.attendances ?? []}
          topic={lesson?.topic ?? ""}
        />
      </div>
    </div>
  )
}
