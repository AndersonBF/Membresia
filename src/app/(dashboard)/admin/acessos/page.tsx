import { currentUser } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import prisma from "@/lib/prisma"
import { ArrowLeft, Activity, LogIn, Users, Eye, Clock } from "lucide-react"

export const dynamic = "force-dynamic"

const AC = "#0f766e"

function inicioDoDia(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export default async function AcessosPage() {
  const user = await currentUser()
  const roles = (user?.publicMetadata?.roles as string[]) ?? []
  const allowed = roles.includes("admin") || roles.includes("superadmin")
  if (!user || !allowed) notFound()

  const agora = new Date()
  const hoje = inicioDoDia(agora)
  const d7 = new Date(hoje); d7.setDate(hoje.getDate() - 6)   // últimos 7 dias (com hoje)
  const d30 = new Date(hoje); d30.setDate(hoje.getDate() - 29)

  const [logsRecentes, logins30, todos30] = await Promise.all([
    prisma.accessLog.findMany({ orderBy: { createdAt: "desc" }, take: 60 }),
    prisma.accessLog.findMany({
      where: { event: "login", createdAt: { gte: d30 } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.accessLog.findMany({
      where: { createdAt: { gte: d30 } },
      select: { userId: true, event: true, createdAt: true },
    }),
  ])

  // ── Métricas ──
  const distintos = (arr: { userId: string | null }[]) =>
    new Set(arr.map((x) => x.userId).filter(Boolean)).size

  const doDia = todos30.filter((l) => l.createdAt >= hoje)
  const do7 = todos30.filter((l) => l.createdAt >= d7)

  const pessoasHoje = distintos(doDia)
  const pessoas7 = distintos(do7)
  const pessoas30 = distintos(todos30)
  const loginsHoje = logins30.filter((l) => l.createdAt >= hoje).length
  const visitasHoje = doDia.filter((l) => l.event === "pageview").length

  // ── Série por dia (14 dias) ──
  const dias = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(hoje); d.setDate(hoje.getDate() - (13 - i))
    const fim = new Date(d); fim.setDate(d.getDate() + 1)
    const doDiaX = todos30.filter((l) => l.createdAt >= d && l.createdAt < fim)
    return {
      label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      pessoas: distintos(doDiaX),
      visitas: doDiaX.filter((l) => l.event === "pageview").length,
    }
  })
  const maxPessoas = Math.max(1, ...dias.map((d) => d.pessoas))

  const cards = [
    { icon: Users,  n: pessoasHoje, l: "Pessoas hoje" },
    { icon: LogIn,  n: loginsHoje,  l: "Logins hoje" },
    { icon: Eye,    n: visitasHoje, l: "Páginas hoje" },
    { icon: Activity, n: pessoas7,  l: "Pessoas (7 dias)" },
    { icon: Clock,  n: pessoas30,   l: "Pessoas (30 dias)" },
  ]

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="flex items-center gap-3 px-4 md:px-6 py-2.5 border-b border-gray-200 bg-white sticky top-0 z-20">
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-gray-700 text-xs transition">
          <ArrowLeft size={14} /> Admin
        </Link>
        <span className="w-px h-4 bg-gray-200" />
        <Activity size={16} className="text-teal-700" />
        <h1 className="font-semibold text-gray-900">Acessos</h1>
      </header>

      <div className="p-4 md:p-6 max-w-6xl mx-auto flex flex-col gap-6">
        {/* Cartões */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {cards.map((c) => {
            const Icon = c.icon
            return (
              <div key={c.l} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-1.5">
                <Icon size={17} style={{ color: AC }} />
                <p className="text-2xl font-bold text-gray-900 leading-none">{c.n}</p>
                <p className="text-[11px] text-gray-400">{c.l}</p>
              </div>
            )
          })}
        </div>

        {/* Gráfico por dia */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Pessoas por dia (14 dias)</h2>
          <div className="flex items-end gap-1.5 h-40">
            {dias.map((d) => (
              <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5 group">
                <div className="w-full rounded-t transition-all relative"
                  style={{ height: `${(d.pessoas / maxPessoas) * 100}%`, minHeight: d.pessoas ? 4 : 2, background: d.pessoas ? AC : "#e5e7eb" }}>
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-gray-600 opacity-0 group-hover:opacity-100 transition">
                    {d.pessoas}
                  </span>
                </div>
                <span className="text-[9px] text-gray-400 whitespace-nowrap">{d.label}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="grid lg:grid-cols-2 gap-5">
          {/* Logins */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
              <LogIn size={15} style={{ color: AC }} />
              <h2 className="text-sm font-semibold text-gray-900">Logins recentes</h2>
              <span className="ml-auto text-xs text-gray-400">{logins30.length} em 30 dias</span>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {logins30.length === 0 ? (
                <p className="p-6 text-center text-sm text-gray-400">
                  Nenhum login registrado ainda.
                </p>
              ) : logins30.slice(0, 40).map((l) => (
                <div key={l.id} className="flex items-center gap-3 px-5 py-2.5 border-b border-gray-50 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0">
                    <LogIn size={13} className="text-teal-700" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 truncate">{l.userName ?? "—"}</p>
                    {l.roles.length > 0 && (
                      <p className="text-[11px] text-gray-400 truncate">{l.roles.join(", ")}</p>
                    )}
                  </div>
                  <span className="text-[11px] text-gray-400 flex-shrink-0">
                    {l.createdAt.toLocaleDateString("pt-BR")} {l.createdAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Atividade */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
              <Eye size={15} style={{ color: AC }} />
              <h2 className="text-sm font-semibold text-gray-900">Últimos acessos</h2>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {logsRecentes.length === 0 ? (
                <p className="p-6 text-center text-sm text-gray-400">Sem registros ainda.</p>
              ) : logsRecentes.map((l) => (
                <div key={l.id} className="flex items-center gap-3 px-5 py-2.5 border-b border-gray-50 last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-800 truncate">
                      <span className="font-medium">{l.userName ?? "—"}</span>
                      {l.path && <span className="text-gray-400"> · {l.path}</span>}
                    </p>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${
                    l.event === "login" ? "bg-teal-50 text-teal-700" : "bg-gray-100 text-gray-500"
                  }`}>{l.event === "login" ? "login" : "página"}</span>
                  <span className="text-[11px] text-gray-400 flex-shrink-0">
                    {l.createdAt.toLocaleDateString("pt-BR")} {l.createdAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <p className="text-xs text-gray-400">
          Os registros são desta igreja e ficam no banco dela. Logins dependem do webhook do Clerk
          estar configurado para o evento <code>session.created</code>.
        </p>
      </div>
    </div>
  )
}
