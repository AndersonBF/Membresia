import Link from "next/link"
import prisma from "@/lib/prisma"
import { getEbdAccess } from "@/lib/ebdAccess"
import {
  ArrowLeft, Users, GraduationCap, FileText, Camera,
  BarChart2, Settings, ClipboardCheck, ChevronRight, UserCheck,
} from "lucide-react"

const AC = "#b45309"
const AD = "#451a03"

/** Domingo mais recente (00:00 UTC) — usado para status da chamada da semana */
function currentSundayUTC(): Date {
  const now = new Date()
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  d.setUTCDate(d.getUTCDate() - d.getUTCDay()) // volta ao domingo
  return d
}

export default async function EbdHome() {
  const access = await getEbdAccess()
  const sunday = currentSundayUTC()

  const classes = await prisma.bibleSchoolClass.findMany({
    where: access.canSeeAll ? {} : { id: { in: access.teacherClassIds } },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { members: true, teachers: true } },
      teachers: { include: { member: { select: { id: true, name: true } } } },
      lessons: {
        where: { date: sunday },
        include: { _count: { select: { attendances: true } } },
      },
    },
  })

  const totalMembers = classes.reduce((s, c) => s + c._count.members, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HERO */}
      <div style={{ background: AD }} className="px-6 md:px-10 pt-6 pb-10">
        <Link href="/member" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs transition mb-8">
          <ArrowLeft size={13} /> Voltar
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-white font-bold leading-[0.9]" style={{ fontSize: "clamp(3rem,8vw,5rem)" }}>EBD</h1>
            <p className="text-white/40 text-sm mt-3 font-light">Escola Bíblica Dominical</p>
            {!access.canSeeAll && (
              <span className="inline-flex items-center gap-1.5 mt-3 text-[11px] text-amber-200/80 bg-white/5 px-2.5 py-1 rounded-full">
                <UserCheck size={12} /> Você é professora — vê apenas sua(s) turma(s)
              </span>
            )}
          </div>
          <div className="flex divide-x divide-white/10 overflow-hidden rounded-xl" style={{ background: "rgba(255,255,255,0.06)" }}>
            {[
              { n: classes.length, l: "Turmas" },
              { n: totalMembers, l: "Membros" },
            ].map((s, i) => (
              <div key={i} className="px-6 py-4 text-center">
                <p className="text-white text-2xl font-semibold leading-none">{s.n}</p>
                <p className="text-white/35 text-[10px] mt-1.5 tracking-wide">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ height: 2, background: `linear-gradient(90deg, ${AC}, ${AC}55, transparent)` }} />

      <div className="p-4 md:p-6 flex flex-col gap-8">
        {/* ATALHOS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Membros", icon: Users, href: "/ebd/membros" },
            { label: "Documentos", icon: FileText, href: "/list/documents?roleContext=ebd" },
            { label: "Galeria", icon: Camera, href: "/ebd/galeria" },
            { label: "Relatórios", icon: BarChart2, href: "/ebd/relatorios" },
          ].map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.label} href={item.href}
                className="bg-white rounded-xl py-4 flex flex-col items-center gap-2 border border-gray-100 shadow-sm hover:shadow-md transition">
                <Icon size={18} style={{ color: AC }} />
                <span className="text-xs font-medium text-gray-500">{item.label}</span>
              </Link>
            )
          })}
        </div>

        {/* TURMAS */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <span className="w-0.5 h-5 rounded-full block" style={{ background: AC }} />
              <h2 className="text-xl font-semibold text-gray-900">Turmas</h2>
            </div>
            {access.canSeeAll && (
              <Link href="/ebd/turmas"
                className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg text-white" style={{ background: AC }}>
                <Settings size={12} /> Gerenciar turmas
              </Link>
            )}
          </div>

          {classes.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center text-gray-400 text-sm">
              Nenhuma turma {access.canSeeAll ? "cadastrada. Use “Gerenciar turmas” para criar." : "atribuída a você."}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map((c) => {
                const chamadaFeita = c.lessons.length > 0 && (c.lessons[0]._count.attendances > 0)
                return (
                  <div key={c.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <Link href={`/ebd/turma/${c.id}`} className="p-5 flex-1 hover:bg-gray-50 transition">
                      <div className="flex items-start justify-between gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#fffbeb" }}>
                          <GraduationCap size={20} style={{ color: AC }} />
                        </div>
                        <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${chamadaFeita ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                          {chamadaFeita ? "Chamada feita" : "Sem chamada"}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mt-3">{c.name}</h3>
                      <p className="text-xs text-gray-400 mt-1">
                        {c._count.members} {c._count.members === 1 ? "membro" : "membros"}
                        {" · "}
                        {c._count.teachers} {c._count.teachers === 1 ? "professora" : "professoras"}
                      </p>
                      {c.teachers.length > 0 && (
                        <p className="text-[11px] text-gray-400 mt-2 line-clamp-1">
                          {c.teachers.map((t) => t.member.name.split(" ")[0]).join(", ")}
                        </p>
                      )}
                    </Link>
                    <Link href={`/ebd/turma/${c.id}/chamada`}
                      className="border-t border-gray-50 px-5 py-3 flex items-center justify-between text-sm font-medium hover:bg-amber-50 transition"
                      style={{ color: AC }}>
                      <span className="flex items-center gap-2"><ClipboardCheck size={15} /> Fazer chamada</span>
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
