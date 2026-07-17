import { notFound } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, GraduationCap, ClipboardCheck, FileText, Users, UserCheck, Calendar,
} from "lucide-react"
import prisma from "@/lib/prisma"
import { getEbdAccess, canAccessClass } from "@/lib/ebdAccess"
import MemberAvatar from "@/components/MemberAvatar"
import AddExistingMemberButton from "@/components/AddExistingMemberButton"

export const dynamic = "force-dynamic"

const AC = "#b45309"

export default async function TurmaDetailPage({
  params,
}: {
  params: { role: string; classId: string }
}) {
  if (params.role !== "ebd") notFound()
  const classId = Number(params.classId)
  if (!classId) notFound()

  const access = await getEbdAccess()
  if (!canAccessClass(access, classId)) notFound()

  const turma = await prisma.bibleSchoolClass.findUnique({
    where: { id: classId },
    include: {
      teachers: { include: { member: { select: { id: true, name: true, phone: true } } } },
      members: {
        where: { isActive: true },
        select: { id: true, name: true, phone: true, gender: true, profileImageUrl: true },
        orderBy: { name: "asc" },
      },
      lessons: {
        orderBy: { date: "desc" },
        take: 8,
        include: { _count: { select: { attendances: true } }, attendances: { where: { isPresent: true }, select: { id: true } } },
      },
    },
  })

  if (!turma) notFound()

  // Documentos da turma + os "EBD geral" (visíveis em todas as turmas)
  const documents = await prisma.document.findMany({
    where: { OR: [{ bibleSchoolClassId: classId }, { bibleSchoolGeneral: true }] },
    orderBy: { createdAt: "desc" },
    take: 10,
  })

  // Membros gerais que podem ser adicionados a esta turma: qualquer membro ativo
  // que ainda não esteja nela (inclui os sem turma e os de outras turmas — nesse
  // caso serão movidos, pois a EBD tem uma turma por membro).
  const availableMembers = access.canSeeAll
    ? await prisma.member.findMany({
        where: {
          OR: [
            { bibleSchoolClassId: null },
            { bibleSchoolClassId: { not: classId } },
          ],
        },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    : []

  return (
    <div className="p-4 flex flex-col gap-6">
      <Link href="/ebd" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition w-fit">
        <ArrowLeft size={16} /> Voltar para EBD
      </Link>

      {/* Cabeçalho */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 md:p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
              <GraduationCap size={24} style={{ color: AC }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{turma.name}</h1>
              <p className="text-sm text-gray-400 mt-0.5">
                {turma.members.length} {turma.members.length === 1 ? "membro ativo" : "membros ativos"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {access.canSeeAll && (
              <AddExistingMemberButton
                role="ebd"
                label={turma.name}
                availableMembers={availableMembers}
                targets={[{ id: classId, name: turma.name }]}
                targetLabel="Classe"
              />
            )}
            <Link href={`/ebd/turma/${classId}/chamada`}
              className="px-5 py-2.5 rounded-xl text-white text-sm font-medium flex items-center gap-2 hover:opacity-90"
              style={{ background: AC }}>
              <ClipboardCheck size={16} /> Fazer chamada de hoje
            </Link>
          </div>
        </div>

        {/* Professoras */}
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1">
            <UserCheck size={13} /> Professoras:
          </span>
          {turma.teachers.length === 0 ? (
            <span className="text-xs text-gray-400 italic">nenhuma atribuída</span>
          ) : (
            turma.teachers.map((t) => (
              <span key={t.member.id} className="text-xs bg-amber-50 text-amber-800 px-2.5 py-1 rounded-full">
                {t.member.name}
              </span>
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Membros */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-50 flex items-center gap-2">
            <Users size={16} style={{ color: AC }} />
            <h2 className="font-semibold text-gray-900">Membros</h2>
          </div>
          {turma.members.length === 0 ? (
            <p className="p-8 text-center text-gray-400 text-sm">Nenhum membro nesta turma.</p>
          ) : (
            turma.members.map((m, i) => (
              <div key={m.id} className={`flex items-center gap-3 px-5 py-3 ${i < turma.members.length - 1 ? "border-b border-gray-50" : ""}`}>
                <MemberAvatar name={m.name} profileImageUrl={m.profileImageUrl} size={36} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{m.name}</p>
                  {m.phone && <p className="text-xs text-gray-400">{m.phone}</p>}
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                  style={{
                    background: m.gender === "MASCULINO" ? "#eff6ff" : m.gender === "FEMININO" ? "#fdf2f8" : "#f3f4f6",
                    color: m.gender === "MASCULINO" ? "#1d4ed8" : m.gender === "FEMININO" ? "#be185d" : "#9ca3af",
                  }}>
                  {m.gender === "MASCULINO" ? "M" : m.gender === "FEMININO" ? "F" : "—"}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Lateral: chamadas recentes + documentos */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-50 flex items-center gap-2">
              <Calendar size={16} style={{ color: AC }} />
              <h2 className="font-semibold text-gray-900">Chamadas recentes</h2>
            </div>
            {turma.lessons.length === 0 ? (
              <p className="p-6 text-center text-gray-400 text-sm">Nenhuma chamada registrada.</p>
            ) : (
              turma.lessons.map((l, i) => (
                <div key={l.id} className={`flex items-center justify-between px-5 py-3 text-sm ${i < turma.lessons.length - 1 ? "border-b border-gray-50" : ""}`}>
                  <span className="text-gray-700">
                    {new Date(l.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" })}
                  </span>
                  <span className="text-xs text-gray-400">
                    <span className="text-green-600 font-medium">{l.attendances.length}</span> presente(s) / {l._count.attendances}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={16} style={{ color: AC }} />
                <h2 className="font-semibold text-gray-900">Documentos</h2>
              </div>
              <Link href={`/list/documents?classId=${classId}&roleContext=ebd`} className="text-xs" style={{ color: AC }}>Ver todos</Link>
            </div>
            {documents.length === 0 ? (
              <p className="p-6 text-center text-gray-400 text-sm">Nenhum documento.</p>
            ) : (
              documents.map((d, i) => (
                <a key={d.id} href={d.fileUrl} target="_blank" rel="noreferrer"
                  className={`block px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 truncate ${i < documents.length - 1 ? "border-b border-gray-50" : ""}`}>
                  {d.title}
                </a>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
