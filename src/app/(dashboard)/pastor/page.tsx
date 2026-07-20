import { currentUser } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import prisma from "@/lib/prisma"
import PastorCoverEditor from "@/components/PastorCoverEditor"
import {
  Users, Church, GraduationCap, Layers, Shield, HandHelping,
  BookOpen, Cross, ChevronRight, MapPin, ClipboardList, CalendarDays, ArrowLeft, Lock,
} from "lucide-react"

const mesesPT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

const categoryStyle: Record<string, { bg: string; color: string }> = {
  "Visita":         { bg: "#eff6ff", color: "#1d4ed8" },
  "Aconselhamento": { bg: "#f0fdf4", color: "#15803d" },
  "Culto":          { bg: "#fef3c7", color: "#b45309" },
  "Reunião":        { bg: "#eef2ff", color: "#4338ca" },
  "Outro":          { bg: "#f3f4f6", color: "#4b5563" },
}

export default async function PastorHomePage() {
  const user = await currentUser()
  const roles = (user?.publicMetadata?.roles as string[]) ?? []
  const isSuperAdmin = roles.includes("superadmin")
  const isPastor = roles.includes("pastor")

  if (!user || (!isSuperAdmin && !isPastor)) notFound()

  // Pastor vê o próprio diário; superadmin vê todos (fase de teste).
  const where: any = isSuperAdmin ? {} : { authorId: user.id }

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const [entries, agg, monthAgg, recent, settings] = await Promise.all([
    prisma.pastorDiaryEntry.count({ where }),
    prisma.pastorDiaryEntry.aggregate({ where, _sum: { visits: true } }),
    prisma.pastorDiaryEntry.aggregate({
      where: { ...where, date: { gte: monthStart, lt: monthEnd } },
      _sum: { visits: true },
      _count: true,
    }),
    prisma.pastorDiaryEntry.findMany({ where, orderBy: { date: "desc" }, take: 6 }),
    prisma.churchSettings.findFirst({ select: { pastorCoverUrl: true } }),
  ])

  const coverUrl = settings?.pastorCoverUrl ?? null
  const heroStyle = coverUrl
    ? {
        backgroundImage: `linear-gradient(rgba(15,23,42,0.72), rgba(15,23,42,0.88)), url(${coverUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : { background: "#0f172a" }

  const totalVisitas = agg._sum.visits ?? 0
  const visitasMes = monthAgg._sum.visits ?? 0
  const registrosMes = monthAgg._count ?? 0

  const quickLinks = [
    { label: "Membros", icon: Users, href: "/list/members" },
    { label: "Sociedades", icon: Church, href: "/list/internalsociety" },
    { label: "EBD", icon: GraduationCap, href: "/ebd" },
    { label: "Ministérios", icon: Layers, href: "/ministerio" },
    { label: "Conselho", icon: Shield, href: "/conselho" },
    { label: "Diaconia", icon: HandHelping, href: "/diaconia" },
  ]

  const ac = "#0f766e"

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      {/* HERO */}
      <div style={heroStyle}>
        <div className="px-6 md:px-10 pt-6 pb-10">
          <div className="flex items-center justify-between gap-4 mb-6">
            <Link
              href={isSuperAdmin ? "/admin" : "/member"}
              className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs transition"
            >
              <ArrowLeft size={13} /> Voltar
            </Link>
            <PastorCoverEditor />
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.08)" }}>
                <Cross size={40} className="text-white" />
              </div>
              <div>
                <h1 className="text-white font-bold leading-tight" style={{ fontSize: "clamp(2.2rem,6vw,3.5rem)" }}>
                  Painel do Pastor
                </h1>
                <p className="text-white/50 text-sm mt-1 font-light">
                  Bem-vindo, {user.firstName || user.username || "Pastor"} · {mesesPT[now.getMonth()]} de {now.getFullYear()}
                </p>
              </div>
            </div>

            <Link
              href="/pastor/diario"
              className="inline-flex items-center gap-2 bg-white text-slate-900 px-5 py-3 rounded-xl font-medium text-sm hover:bg-white/90 transition shadow-lg"
            >
              <BookOpen size={16} /> Abrir Diário
            </Link>
          </div>
        </div>
        <div style={{ height: 2, background: `linear-gradient(90deg, ${ac}, ${ac}55, transparent)` }} />
      </div>

      <div className="p-4 md:p-6 flex flex-col gap-8 max-w-6xl mx-auto">
        {/* STAT CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { n: totalVisitas, l: "Visitas (total)", icon: MapPin },
            { n: entries, l: "Registros (total)", icon: ClipboardList },
            { n: visitasMes, l: "Visitas no mês", icon: CalendarDays },
            { n: registrosMes, l: "Registros no mês", icon: BookOpen },
          ].map((s, i) => {
            const Icon = s.icon
            return (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-2">
                <Icon size={18} style={{ color: ac }} />
                <p className="text-3xl font-bold text-gray-900 leading-none">{s.n}</p>
                <p className="text-xs text-gray-400">{s.l}</p>
              </div>
            )
          })}
        </div>

        {/* QUICK LINKS */}
        <section>
          <div className="flex items-center gap-2.5 mb-4">
            <span className="w-0.5 h-5 rounded-full block" style={{ background: ac }} />
            <h2 className="text-lg font-semibold text-gray-900">Acesso rápido</h2>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {quickLinks.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="bg-white rounded-xl py-4 flex flex-col items-center gap-2 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition"
                >
                  <Icon size={20} style={{ color: ac }} />
                  <span className="text-xs font-medium text-gray-500 text-center">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </section>

        {/* REGISTROS RECENTES */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <span className="w-0.5 h-5 rounded-full block" style={{ background: ac }} />
              <h2 className="text-lg font-semibold text-gray-900">Registros recentes</h2>
            </div>
            <Link href="/pastor/diario" className="text-xs flex items-center gap-1" style={{ color: ac }}>
              Ver diário <ChevronRight size={11} />
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {recent.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-400 text-sm">Nenhum registro ainda.</p>
                <Link href="/pastor/diario" className="text-sm font-medium mt-2 inline-block" style={{ color: ac }}>
                  Criar o primeiro registro →
                </Link>
              </div>
            ) : (
              recent.map((e, i) => {
                const st = categoryStyle[e.category] ?? categoryStyle["Outro"]
                const d = new Date(e.date)
                // Entrada confidencial: título só aparece para o próprio autor.
                const redacted = e.isPrivate && e.authorId !== user.id
                return (
                  <div
                    key={e.id}
                    className={`flex items-center gap-4 px-5 py-3.5 ${i < recent.length - 1 ? "border-b border-gray-50" : ""}`}
                  >
                    <div className="text-center flex-shrink-0 w-12">
                      <p className="text-[10px] font-semibold" style={{ color: ac }}>
                        {d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "").toUpperCase()}
                      </p>
                      <p className="text-lg font-bold text-gray-900 leading-tight">
                        {d.getDate().toString().padStart(2, "0")}
                      </p>
                    </div>
                    <div className="w-px h-8 bg-gray-100 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      {redacted ? (
                        <p className="font-medium text-gray-400 italic text-sm truncate inline-flex items-center gap-1">
                          <Lock size={12} /> Registro confidencial
                        </p>
                      ) : (
                        <p className="font-medium text-gray-800 text-sm truncate">{e.title}</p>
                      )}
                      {isSuperAdmin && (
                        <p className="text-[11px] text-gray-400 truncate">por {e.authorName}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {e.visits > 0 && (
                        <span className="text-[11px] text-gray-500 inline-flex items-center gap-1">
                          <MapPin size={11} /> {e.visits}
                        </span>
                      )}
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                        style={{ background: st.bg, color: st.color }}
                      >
                        {e.category}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
