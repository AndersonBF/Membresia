"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import {
  ArrowLeft, Users, TrendingUp, DollarSign, Award,
  BarChart2, Download, RefreshCw, Calendar, CheckCircle,
  XCircle, ChevronUp, ChevronDown, Minus,
} from "lucide-react"
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts"

// ── Config ────────────────────────────────────────────────────────────────────

const roleConfig: Record<string, { label: string; tagline: string; ac: string; ad: string; al: string }> = {
  ump:        { label: "UMP",        tagline: "União de Mocidade Presbiteriana",     ac: "#2563eb", al: "#eff6ff", ad: "#1e3a8a" },
  upa:        { label: "UPA",        tagline: "União Presbiteriana de Adolescentes", ac: "#d97706", al: "#fffbeb", ad: "#78350f" },
  uph:        { label: "UPH",        tagline: "União Presbiteriana de Homens",       ac: "#ea580c", al: "#fff7ed", ad: "#7c2d12" },
  saf:        { label: "SAF",        tagline: "Sociedade Auxiliadora Feminina",      ac: "#db2777", al: "#fdf2f8", ad: "#831843" },
  ucp:        { label: "UCP",        tagline: "União das Crianças Presbiterianas",   ac: "#f59e0b", al: "#fefce8", ad: "#78350f" },
  diaconia:   { label: "Diaconia",   tagline: "Ministério de Serviço e Cuidado",    ac: "#0d9488", al: "#f0fdfa", ad: "#134e4a" },
  conselho:   { label: "Conselho",   tagline: "Conselho da Igreja",                 ac: "#4f46e5", al: "#eef2ff", ad: "#1e1b4b" },
  ministerio: { label: "Ministério", tagline: "Ministério de Louvor e Adoração",    ac: "#16a34a", al: "#f0fdf4", ad: "#14532d" },
  ebd:        { label: "EBD",        tagline: "Escola Bíblica Dominical",           ac: "#b45309", al: "#fffbeb", ad: "#451a03" },
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface ReportData {
  members: {
    total: number; active: number; inactive: number
    genderDist: { masculino: number; feminino: number; nao_informado: number }
    ageDist: { faixa: string; total: number }[]
    monthlyGrowth: { mes: string; total: number }[]
  }
  attendance: {
    totalEvents: number
    byEvent: { id: number; title: string; date: string; total: number; present: number; absent: number; rate: number }[]
    monthly: { mes: string; eventos: number; presentes: number; total: number; taxa: number }[]
    ranking: { id: number; name: string; present: number; total: number; rate: number | null }[]
  }
  finance: {
    totalEntradas: number; totalSaidas: number; saldo: number
    byMonth: { mes: string; entradas: number; saidas: number; saldo: number }[]
    transactions: { id: number; description: string; type: string; value: number; date: string; month: number; year: number }[]
  }
  directory: { cargo: string; member: { id: number; name: string; phone: string | null; gender: string } }[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
const fmtN = (v: number) => v.toLocaleString("pt-BR")

function StatCard({ label, value, sub, icon: Icon, color, light }: any) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: light }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-xs text-gray-500 mt-1">{label}</p>
        {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function SectionTitle({ icon: Icon, title, color }: any) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <span className="w-0.5 h-5 rounded-full block" style={{ background: color }} />
      <Icon size={16} style={{ color }} />
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function RelatoriosPage({ params }: { params: { role: string } }) {
  const { role } = params
  const cfg = roleConfig[role] ?? { label: role, tagline: "", ac: "#4f46e5", al: "#eef2ff", ad: "#1e1b4b" }
  const { ac, ad, al } = cfg

  const [data, setData]       = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState<"membros" | "presenca" | "financeiro" | "diretoria">("membros")
  const [exporting, setExporting] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch(`/api/relatorios/${role}`)
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [role])

  // ── Export Excel ────────────────────────────────────────────────────────
  async function handleExportExcel() {
    if (!data) return
    setExporting(true)
    try {
      const XLSX = await import("xlsx")
      const wb = XLSX.utils.book_new()

      // Aba membros
      const membersSheet = XLSX.utils.json_to_sheet([
        { Seção: "Membros", Total: data.members.total, Ativos: data.members.active, Inativos: data.members.inactive },
      ])
      XLSX.utils.book_append_sheet(wb, membersSheet, "Membros")

      // Aba presença por evento
      const attendanceSheet = XLSX.utils.json_to_sheet(
        data.attendance.byEvent.map(e => ({
          Evento: e.title,
          Data: new Date(e.date).toLocaleDateString("pt-BR"),
          Total: e.total,
          Presentes: e.present,
          Ausentes: e.absent,
          "Taxa (%)": e.rate,
        }))
      )
      XLSX.utils.book_append_sheet(wb, attendanceSheet, "Presença por Evento")

      // Aba ranking presença
      const rankingSheet = XLSX.utils.json_to_sheet(
        data.attendance.ranking.map((m, i) => ({
          Posição: i + 1,
          Membro: m.name,
          Presenças: m.present,
          Total: m.total,
          "Taxa (%)": m.rate ?? "-",
        }))
      )
      XLSX.utils.book_append_sheet(wb, rankingSheet, "Ranking Presença")

      // Aba financeiro
      if (data.finance.transactions.length > 0) {
        const finSheet = XLSX.utils.json_to_sheet([
          { Resumo: "Total Entradas", Valor: data.finance.totalEntradas },
          { Resumo: "Total Saídas",   Valor: data.finance.totalSaidas },
          { Resumo: "Saldo",          Valor: data.finance.saldo },
          {},
          ...data.finance.transactions.map(t => ({
            Descrição: t.description,
            Tipo: t.type,
            Valor: t.value,
            Data: new Date(t.date).toLocaleDateString("pt-BR"),
          })),
        ])
        XLSX.utils.book_append_sheet(wb, finSheet, "Financeiro")
      }

      XLSX.writeFile(wb, `relatorio-${cfg.label.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.xlsx`)
    } finally {
      setExporting(false)
    }
  }

  // ── Export PDF (print) ──────────────────────────────────────────────────
  function handlePrint() {
    window.print()
  }

  // ── Loading ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw size={28} className="animate-spin" style={{ color: ac }} />
          <p className="text-gray-500 text-sm">Carregando relatório...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Erro ao carregar dados.</p>
      </div>
    )
  }

  const avgAttendanceRate = data.attendance.monthly.filter(m => m.total > 0).length > 0
    ? Math.round(data.attendance.monthly.filter(m => m.total > 0).reduce((s, m) => s + m.taxa, 0) / data.attendance.monthly.filter(m => m.total > 0).length)
    : 0

  const GENDER_COLORS  = [ac, "#f472b6", "#d1d5db"]
  const FINANCE_COLORS = { entrada: "#16a34a", saida: "#ef4444" }

  const genderData = [
    { name: "Masculino",     value: data.members.genderDist.masculino },
    { name: "Feminino",      value: data.members.genderDist.feminino },
    { name: "Não informado", value: data.members.genderDist.nao_informado },
  ].filter(d => d.value > 0)

  // ageData já vem pronto da API como array { faixa, total }
  // Gera uma paleta de cores ciclando entre tons para as faixas
  const AGE_PALETTE = ["#6366f1","#8b5cf6","#a78bfa",ac,"#34d399","#f59e0b","#f97316","#ef4444","#ec4899","#06b6d4","#0ea5e9","#3b82f6","#6366f1","#8b5cf6","#a78bfa","#d1d5db","#9ca3af"]
  const ageData = data.members.ageDist

  return (
    <>
      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        .rp { font-family: 'DM Sans', sans-serif; }
        @keyframes rp-in { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .rp-in { animation: rp-in 0.35s cubic-bezier(.22,1,.36,1) both; }
        .tab-btn { transition: all .15s; }
        @media print {
          .no-print { display: none !important; }
          .rp { background: white !important; }
        }
      `}</style>

      <div className="rp bg-gray-50 min-h-screen" ref={printRef}>

        {/* HERO */}
        <div style={{ background: ad }}>
          <div className="px-6 md:px-10 pt-6 pb-8">
            <Link href={`/${role}`} className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs transition mb-6 no-print">
              <ArrowLeft size={13} /> Voltar
            </Link>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <BarChart2 size={26} className="text-white/60" />
                  <h1 className="text-white font-bold text-4xl">Relatórios</h1>
                </div>
                <p className="text-white/40 text-sm">{cfg.label} — {cfg.tagline}</p>
              </div>
              <div className="flex items-center gap-2 no-print">
                <button onClick={fetchData}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white/60 hover:text-white text-xs transition"
                  style={{ background: "rgba(255,255,255,0.08)" }}>
                  <RefreshCw size={12} /> Atualizar
                </button>
                <button onClick={handleExportExcel} disabled={exporting}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition disabled:opacity-50"
                  style={{ background: ac, color: "#fff" }}>
                  <Download size={12} /> {exporting ? "Exportando..." : "Excel"}
                </button>
                <button onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition"
                  style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>
                  <Download size={12} /> PDF
                </button>
              </div>
            </div>
          </div>
          <div style={{ height: 2, background: `linear-gradient(90deg, ${ac}, ${ac}55, transparent)` }} />
        </div>

        {/* TABS */}
        <div className="px-6 md:px-10 border-b border-gray-200 bg-white no-print">
          <div className="flex gap-1 -mb-px overflow-x-auto">
            {([
              { key: "membros",    label: "Membros",    icon: Users },
              { key: "presenca",   label: "Presença",   icon: CheckCircle },
              { key: "financeiro", label: "Financeiro", icon: DollarSign },
              { key: "diretoria",  label: "Diretoria",  icon: Award },
            ] as const).map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`tab-btn flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 whitespace-nowrap ${
                  tab === key
                    ? "border-current"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
                style={{ color: tab === key ? ac : undefined, borderColor: tab === key ? ac : undefined }}>
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-4 md:p-6 rp-in">

          {/* ── MEMBROS ── */}
          {tab === "membros" && (
            <div className="flex flex-col gap-6">
              {/* Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard label="Total de membros" value={fmtN(data.members.total)} icon={Users} color={ac} light={al} />
                <StatCard label="Membros ativos" value={fmtN(data.members.active)} sub={`${Math.round((data.members.active / data.members.total) * 100)}% do total`} icon={CheckCircle} color="#16a34a" light="#f0fdf4" />
                <StatCard label="Membros inativos" value={fmtN(data.members.inactive)} icon={XCircle} color="#ef4444" light="#fef2f2" />
                <StatCard label="Taxa de atividade" value={`${Math.round((data.members.active / (data.members.total || 1)) * 100)}%`} icon={TrendingUp} color={ac} light={al} />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Gênero */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <SectionTitle icon={Users} title="Distribuição por Gênero" color={ac} />
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={genderData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                          {genderData.map((_, i) => <Cell key={i} fill={GENDER_COLORS[i]} />)}
                        </Pie>
                        <Tooltip formatter={(v: any) => [fmtN(v), ""]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-col gap-2 shrink-0">
                      {genderData.map((g, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <span className="w-3 h-3 rounded-full" style={{ background: GENDER_COLORS[i] }} />
                          <span className="text-gray-600">{g.name}</span>
                          <span className="font-semibold text-gray-900 ml-1">{g.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Faixa etária */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <SectionTitle icon={Users} title="Faixa Etária (de 5 em 5 anos)" color={ac} />
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={ageData} barSize={20}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="faixa" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" height={48} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip formatter={(v: any) => [fmtN(v), "Membros"]} />
                      <Bar dataKey="total" name="Membros" radius={[4, 4, 0, 0]}>
                        {ageData.map((_, i) => <Cell key={i} fill={AGE_PALETTE[i % AGE_PALETTE.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Crescimento mensal */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <SectionTitle icon={TrendingUp} title="Crescimento de Membros (12 meses)" color={ac} />
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={data.members.monthlyGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="total" name="Membros" stroke={ac} strokeWidth={2.5} dot={{ fill: ac, r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── PRESENÇA ── */}
          {tab === "presenca" && (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard label="Total de eventos" value={fmtN(data.attendance.totalEvents)} icon={Calendar} color={ac} light={al} />
                <StatCard label="Taxa média de presença" value={`${avgAttendanceRate}%`} icon={TrendingUp} color={ac} light={al} />
                <StatCard label="Membros com registro" value={fmtN(data.attendance.ranking.length)} icon={Users} color={ac} light={al} />
                <StatCard
                  label="Melhor presença"
                  value={data.attendance.ranking[0]?.rate != null ? `${data.attendance.ranking[0].rate}%` : "—"}
                  sub={data.attendance.ranking[0]?.name}
                  icon={Award} color="#f59e0b" light="#fefce8"
                />
              </div>

              {/* Presença mensal */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <SectionTitle icon={TrendingUp} title="Presença Mensal (12 meses)" color={ac} />
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={data.attendance.monthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="presentes" name="Presentes" fill={ac} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="total" name="Total" fill={`${ac}40`} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Tabela por evento */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <SectionTitle icon={Calendar} title="Presença por Evento" color={ac} />
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left text-xs font-semibold text-gray-400 pb-2">Evento</th>
                          <th className="text-center text-xs font-semibold text-gray-400 pb-2">Pres.</th>
                          <th className="text-center text-xs font-semibold text-gray-400 pb-2">Total</th>
                          <th className="text-center text-xs font-semibold text-gray-400 pb-2">Taxa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.attendance.byEvent.slice().reverse().map(e => (
                          <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                            <td className="py-2.5 pr-2">
                              <p className="font-medium text-gray-800 text-xs truncate max-w-[140px]">{e.title}</p>
                              <p className="text-[10px] text-gray-400">{new Date(e.date).toLocaleDateString("pt-BR")}</p>
                            </td>
                            <td className="text-center text-green-600 font-semibold">{e.present}</td>
                            <td className="text-center text-gray-500">{e.total}</td>
                            <td className="text-center">
                              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                                e.rate >= 75 ? "bg-green-100 text-green-700"
                                : e.rate >= 50 ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-600"
                              }`}>{e.rate}%</span>
                            </td>
                          </tr>
                        ))}
                        {data.attendance.byEvent.length === 0 && (
                          <tr><td colSpan={4} className="text-center text-gray-400 text-xs py-6">Nenhum evento registrado</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Ranking */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <SectionTitle icon={Award} title="Ranking de Presença" color={ac} />
                  <div className="flex flex-col gap-1 max-h-80 overflow-y-auto pr-1">
                    {data.attendance.ranking.map((m, i) => (
                      <div key={m.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          i === 0 ? "bg-yellow-100 text-yellow-700"
                          : i === 1 ? "bg-gray-100 text-gray-600"
                          : i === 2 ? "bg-orange-100 text-orange-600"
                          : "bg-gray-50 text-gray-400"
                        }`}>{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800 truncate">{m.name}</p>
                          <p className="text-[10px] text-gray-400">{m.present}/{m.total} presenças</p>
                        </div>
                        {m.rate !== null && (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            m.rate >= 75 ? "bg-green-100 text-green-700"
                            : m.rate >= 50 ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-600"
                          }`}>{m.rate}%</span>
                        )}
                      </div>
                    ))}
                    {data.attendance.ranking.length === 0 && (
                      <p className="text-center text-gray-400 text-xs py-6">Nenhum dado de presença</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── FINANCEIRO ── */}
          {tab === "financeiro" && (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <StatCard label="Total entradas" value={fmt(data.finance.totalEntradas)} icon={TrendingUp} color="#16a34a" light="#f0fdf4" />
                <StatCard label="Total saídas" value={fmt(data.finance.totalSaidas)} icon={ChevronDown} color="#ef4444" light="#fef2f2" />
                <StatCard
                  label="Saldo"
                  value={fmt(data.finance.saldo)}
                  icon={data.finance.saldo >= 0 ? ChevronUp : ChevronDown}
                  color={data.finance.saldo >= 0 ? "#16a34a" : "#ef4444"}
                  light={data.finance.saldo >= 0 ? "#f0fdf4" : "#fef2f2"}
                />
              </div>

              {/* Gráfico mensal */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <SectionTitle icon={DollarSign} title="Entradas e Saídas Mensais (12 meses)" color={ac} />
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={data.finance.byMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: any) => [fmt(v), ""]} />
                    <Legend />
                    <Bar dataKey="entradas" name="Entradas" fill={FINANCE_COLORS.entrada} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="saidas"   name="Saídas"   fill={FINANCE_COLORS.saida}   radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Saldo acumulado */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <SectionTitle icon={TrendingUp} title="Evolução do Saldo Mensal" color={ac} />
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={data.finance.byMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: any) => [fmt(v), "Saldo"]} />
                    <Line type="monotone" dataKey="saldo" name="Saldo" stroke={ac} strokeWidth={2.5} dot={{ fill: ac, r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Tabela de transações */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <SectionTitle icon={DollarSign} title="Transações" color={ac} />
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left text-xs font-semibold text-gray-400 pb-2">Descrição</th>
                        <th className="text-left text-xs font-semibold text-gray-400 pb-2">Data</th>
                        <th className="text-right text-xs font-semibold text-gray-400 pb-2">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.finance.transactions.slice().reverse().map(t => (
                        <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                          <td className="py-2.5">
                            <div className="flex items-center gap-2">
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.type === "ENTRADA" ? "bg-green-500" : "bg-red-500"}`} />
                              <span className="text-gray-800 text-xs">{t.description}</span>
                            </div>
                          </td>
                          <td className="text-xs text-gray-400">{new Date(t.date).toLocaleDateString("pt-BR")}</td>
                          <td className={`text-right text-xs font-semibold ${t.type === "ENTRADA" ? "text-green-600" : "text-red-500"}`}>
                            {t.type === "ENTRADA" ? "+" : "-"}{fmt(t.value)}
                          </td>
                        </tr>
                      ))}
                      {data.finance.transactions.length === 0 && (
                        <tr><td colSpan={3} className="text-center text-gray-400 text-xs py-6">Nenhuma transação registrada</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── DIRETORIA ── */}
          {tab === "diretoria" && (
            <div className="flex flex-col gap-6">
              {data.directory.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm text-center">
                  <Award size={32} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500 font-medium">Nenhum cargo de diretoria registrado</p>
                  <p className="text-gray-400 text-sm mt-1">Esta role não possui estrutura de diretoria ou os cargos não foram atribuídos</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <StatCard label="Cargos preenchidos" value={data.directory.length} icon={Award} color={ac} light={al} />
                    <StatCard label="Masculino" value={data.directory.filter(d => d.member.gender === "MASCULINO").length} icon={Users} color="#2563eb" light="#eff6ff" />
                    <StatCard label="Feminino"  value={data.directory.filter(d => d.member.gender === "FEMININO").length}  icon={Users} color="#db2777" light="#fdf2f8" />
                  </div>

                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <SectionTitle icon={Award} title="Diretoria Atual" color={ac} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {data.directory.map((d, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0"
                            style={{ background: ac }}>
                            {d.member.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: ac }}>{d.cargo}</p>
                            <p className="font-semibold text-gray-800 text-sm truncate">{d.member.name}</p>
                            {d.member.phone && (
                              <a href={`tel:${d.member.phone}`} className="text-[10px] text-gray-400 hover:text-gray-600 transition">
                                {d.member.phone}
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  )
}