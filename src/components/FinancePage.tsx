"use client"

import { useState, useMemo } from "react"
import { useFormState } from "react-dom"
import { createFinance, deleteFinance, updateFinance } from "@/lib/actions"
import {
  TrendingUp, TrendingDown, Wallet, Plus, Trash2, X,
  Download, Pencil, ArrowUpRight, ArrowDownRight,
  BarChart3, Sparkles, ChevronDown, Search,
  DollarSign, Activity, Target,
} from "lucide-react"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from "recharts"

// ── Paleta verde escuro (mesma do sistema) ──
const C = {
  primary:     "#15803d",   // green-700
  primaryDark: "#166534",   // green-800
  primaryDeep: "#14532d",   // green-900
  primaryLight:"#dcfce7",   // green-100
  primaryMid:  "#bbf7d0",   // green-200
  primarySoft: "#f0fdf4",   // green-50
  accent:      "#16a34a",   // green-600  (hover/ativo)
}

type Finance = {
  id: number
  description: string
  type: "ENTRADA" | "SAIDA"
  value: number
  date: Date
  month: number
  year: number
  societyId: number | null
  society?: { name: string } | null
}

type Society = { id: number; name: string }

type Props = {
  finances: Finance[]
  societies: Society[]
  societyId: number | null
  roleContext: string | null
  isAdmin: boolean
}

const MONTHS      = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"]
const MONTHS_FULL = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:12, padding:"10px 14px", boxShadow:"0 8px 24px rgba(0,0,0,.10)" }}>
      <p style={{ color:"#94a3b8", fontSize:11, marginBottom:6, fontWeight:600 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color:p.color, fontSize:13, fontWeight:700 }}>
          {p.name === "entradas" ? "↑" : "↓"} R$ {Number(p.value).toLocaleString("pt-BR", { minimumFractionDigits:2 })}
        </p>
      ))}
    </div>
  )
}

export default function FinancePage({ finances, societies, societyId, roleContext, isAdmin }: Props) {
  const [showForm, setShowForm]             = useState(false)
  const [showSaldoForm, setShowSaldoForm]   = useState(false)
  const [editingFinance, setEditingFinance] = useState<Finance | null>(null)
  const [saldoInicial, setSaldoInicial]     = useState(0)
  const [selectedMonth, setSelectedMonth]   = useState<number | null>(null)
  const [selectedYear, setSelectedYear]     = useState<number>(new Date().getFullYear())
  const [searchTerm, setSearchTerm]         = useState("")
  const [typeFilter, setTypeFilter]         = useState<"ALL"|"ENTRADA"|"SAIDA">("ALL")
  const [chartType, setChartType]           = useState<"area"|"bar">("area")

  const [createState, createAction] = useFormState(createFinance, { success:false, error:false })
  const [deleteState, deleteAction] = useFormState(deleteFinance, { success:false, error:false })
  const [updateState, updateAction] = useFormState(updateFinance, { success:false, error:false })

  const years = useMemo(() => {
    const y = [...new Set(finances.map(f => f.year))].sort((a,b) => b-a)
    if (!y.includes(new Date().getFullYear())) y.unshift(new Date().getFullYear())
    return y
  }, [finances])

  const resumoPorMes = useMemo(() => Array.from({ length:12 }, (_,i) => {
    const mes      = i + 1
    const doMes    = finances.filter(f => f.month === mes && f.year === selectedYear)
    const entradas = doMes.filter(f => f.type === "ENTRADA").reduce((s,f) => s+f.value, 0)
    const saidas   = doMes.filter(f => f.type === "SAIDA").reduce((s,f) => s+f.value, 0)
    return { mes, name:MONTHS[i], entradas, saidas, saldo:entradas-saidas }
  }), [finances, selectedYear])

  const totalEntradas = finances.filter(f => f.type === "ENTRADA").reduce((s,f) => s+f.value, 0)
  const totalSaidas   = finances.filter(f => f.type === "SAIDA").reduce((s,f) => s+f.value, 0)
  const saldoGeral    = saldoInicial + totalEntradas - totalSaidas

  const filtered = useMemo(() => finances.filter(f => {
    const matchMonth  = selectedMonth ? f.month === selectedMonth : true
    const matchYear   = f.year === selectedYear
    const matchSearch = f.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchType   = typeFilter === "ALL" ? true : f.type === typeFilter
    return matchMonth && matchYear && matchSearch && matchType
  }), [finances, selectedMonth, selectedYear, searchTerm, typeFilter])

  const entradasFiltradas = filtered.filter(f => f.type === "ENTRADA").reduce((s,f) => s+f.value, 0)
  const saidasFiltradas   = filtered.filter(f => f.type === "SAIDA").reduce((s,f) => s+f.value, 0)
  const saldoFiltrado     = entradasFiltradas - saidasFiltradas

  const prevMonthData  = resumoPorMes[new Date().getMonth()-1] ?? { entradas:0 }
  const currMonthData  = resumoPorMes[new Date().getMonth()]   ?? { entradas:0 }
  const entradasChange = prevMonthData.entradas > 0
    ? ((currMonthData.entradas - prevMonthData.entradas) / prevMonthData.entradas * 100).toFixed(1)
    : null

  const fmtBRL = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits:2 })}`

  const exportToExcel = () => {
    const rows = [
      ["Data","Descrição","Tipo","Valor (R$)","Sociedade"],
      ...finances.map(f => [new Date(f.date).toLocaleDateString("pt-BR"), f.description, f.type === "ENTRADA" ? "Entrada" : "Saída", f.value.toFixed(2).replace(".",","), f.society?.name ?? "Geral"]),
      [],
      ["","","Total Entradas", totalEntradas.toFixed(2).replace(".",","),""],
      ["","","Total Saídas",   totalSaidas.toFixed(2).replace(".",","),""],
      ["","","Saldo Inicial",  saldoInicial.toFixed(2).replace(".",","),""],
      ["","","Saldo Final",    saldoGeral.toFixed(2).replace(".",","),""],
    ]
    const blob = new Blob(["\uFEFF"+rows.map(r=>r.join(";")).join("\n")], { type:"text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href=url; a.download=`financeiro_${roleContext??"geral"}_${selectedYear}.csv`; a.click(); URL.revokeObjectURL(url)
  }

  /* ── shared styles ── */
  const card: React.CSSProperties = { background:"#fff", border:"1px solid #e2e8f0", borderRadius:20, boxShadow:"0 1px 3px rgba(0,0,0,.04)" }
  const inp:  React.CSSProperties = { background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:12, color:"#1e293b", width:"100%", padding:"10px 14px", fontSize:14, outline:"none", fontFamily:"Inter,sans-serif" }
  const lbl:  React.CSSProperties = { fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".08em", display:"block", marginBottom:6 }
  const btnP: React.CSSProperties = { background:C.primary, color:"#fff", border:"none", borderRadius:12, padding:"10px 20px", fontSize:14, fontWeight:600, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:7, fontFamily:"Inter,sans-serif", transition:"background .15s" }
  const btnG: React.CSSProperties = { background:"#f1f5f9", color:"#64748b", border:"1.5px solid #e2e8f0", borderRadius:12, padding:"9px 16px", fontSize:13, fontWeight:600, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:6, fontFamily:"Inter,sans-serif" }
  const iconBtn: React.CSSProperties = { width:30, height:30, borderRadius:8, border:"none", background:"#f8fafc", color:"#94a3b8", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all .15s" }

  /* ── modal form shared ── */
  const ModalForm = ({
    title, icon, iconBg, iconColor, submitLabel, submitBg,
    onClose, onSubmit, defaultType, defaultDesc, defaultValue, defaultDate,
    error,
  }: {
    title: string; icon: React.ReactNode; iconBg: string; iconColor: string
    submitLabel: string; submitBg: string
    onClose: () => void; onSubmit: (fd: FormData) => void
    defaultType?: "ENTRADA"|"SAIDA"; defaultDesc?: string; defaultValue?: number; defaultDate?: string
    error?: boolean
  }) => (
    <div className="fp-fade" style={{ position:"fixed", inset:0, zIndex:50, display:"flex", alignItems:"center", justifyContent:"center", padding:20, pointerEvents:"none" }}>
      <div className="fp-modal p-6 w-full" style={{ maxWidth:440, pointerEvents:"auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:iconBg, display:"flex", alignItems:"center", justifyContent:"center" }}>{icon}</div>
            <p style={{ color:"#0f172a", fontWeight:700, fontSize:16 }}>{title}</p>
          </div>
          <button onClick={onClose} style={{ ...iconBtn, flexShrink:0 }}><X size={14}/></button>
        </div>
        <form action={onSubmit} style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div>
            <label style={lbl}>Tipo</label>
            <div style={{ display:"flex", gap:10 }}>
              <label className="type-opt ent" style={{ flex:1 }}>
                <input type="radio" name="type" value="ENTRADA" defaultChecked={defaultType !== "SAIDA"} style={{ accentColor:C.primary }}/>
                <TrendingUp size={15} style={{ color:C.primary }}/>
                <span style={{ color:"#1e293b", fontSize:13, fontWeight:600 }}>Entrada</span>
              </label>
              <label className="type-opt sai" style={{ flex:1 }}>
                <input type="radio" name="type" value="SAIDA" defaultChecked={defaultType === "SAIDA"} style={{ accentColor:"#ef4444" }}/>
                <TrendingDown size={15} style={{ color:"#dc2626" }}/>
                <span style={{ color:"#1e293b", fontSize:13, fontWeight:600 }}>Saída</span>
              </label>
            </div>
          </div>
          <div>
            <label style={lbl}>Descrição</label>
            <input className="fp-inp" style={inp} type="text" name="description" required placeholder="Ex: Oferta do culto" defaultValue={defaultDesc}/>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <label style={lbl}>Valor (R$)</label>
              <input className="fp-inp" style={inp} type="number" name="value" required min="0" step="0.01" placeholder="0,00" defaultValue={defaultValue}/>
            </div>
            <div>
              <label style={lbl}>Data</label>
              <input className="fp-inp" style={inp} type="date" name="date" required defaultValue={defaultDate ?? new Date().toISOString().split("T")[0]}/>
            </div>
          </div>
          {isAdmin && !societyId && societies.length > 0 && !defaultDesc && (
            <div>
              <label style={lbl}>Sociedade (opcional)</label>
              <select name="societyId" className="fp-inp" style={{ ...inp, cursor:"pointer" }}>
                <option value="">Geral (Igreja)</option>
                {societies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}
          {error && <p style={{ color:"#dc2626", fontSize:12 }}>Erro ao salvar. Tente novamente.</p>}
          <div style={{ display:"flex", gap:8, paddingTop:4 }}>
            <button type="button" onClick={onClose} style={{ ...btnG, flex:1, justifyContent:"center" }}>Cancelar</button>
            <button type="submit" style={{ ...btnP, flex:1, justifyContent:"center", background:submitBg }}>
              <Sparkles size={14}/> {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return (
    <>
      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        .fp { font-family:'Inter',sans-serif; }
        .fp-bg { background:#f1f5f9; min-height:100vh; }

        @keyframes fp-in   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fp-fade { from{opacity:0} to{opacity:1} }
        .fp-in   { animation:fp-in .4s cubic-bezier(.22,1,.36,1) both; }
        .fp-fade { animation:fp-fade .2s ease both; }
        .d1{animation-delay:.04s}.d2{animation-delay:.09s}.d3{animation-delay:.14s}.d4{animation-delay:.19s}

        .kpi { transition:box-shadow .2s,transform .2s; }
        .kpi:hover { box-shadow:0 8px 24px rgba(0,0,0,.08)!important; transform:translateY(-2px); }

        .tx-row { border-bottom:1px solid #f1f5f9; transition:background .12s; }
        .tx-row:hover { background:#f8fafc; }
        .tx-row:last-child { border-bottom:none; }

        .mpill { border:none; border-radius:8px; background:transparent; color:#64748b;
                 font-size:12px; font-weight:600; padding:5px 11px;
                 cursor:pointer; transition:all .15s; font-family:'Inter',sans-serif; }
        .mpill:hover  { color:${C.primary}; background:${C.primarySoft}; }
        .mpill.active { color:${C.primary}; background:${C.primarySoft}; outline:1.5px solid ${C.primaryMid}; }

        .ct-btn { padding:5px 12px; border-radius:8px; border:none; font-size:12px;
                  font-weight:600; cursor:pointer; font-family:'Inter',sans-serif; transition:all .15s; }

        .fp-inp:focus { border-color:${C.primary}!important; box-shadow:0 0 0 3px rgba(21,128,61,.1); outline:none; }
        .fp-inp::placeholder { color:#94a3b8; }
        .fp-inp option { background:#fff; }

        .type-opt { display:flex; align-items:center; gap:8px; border:2px solid #e2e8f0;
                    border-radius:12px; padding:10px 14px; cursor:pointer; transition:all .15s; }
        .type-opt:has(input:checked).ent { border-color:${C.primary}; background:${C.primarySoft}; }
        .type-opt:has(input:checked).sai { border-color:#ef4444; background:#fef2f2; }

        .fp-modal { background:#fff; border:1px solid #e2e8f0; border-radius:24px;
                    box-shadow:0 24px 60px rgba(0,0,0,.13); }

        .fp-scroll::-webkit-scrollbar { width:4px; }
        .fp-scroll::-webkit-scrollbar-thumb { background:#e2e8f0; border-radius:4px; }

        .badge { display:inline-flex; align-items:center; gap:3px; border-radius:8px; padding:3px 8px; font-size:11px; font-weight:700; }
        .bGreen  { background:${C.primaryLight}; color:${C.primaryDark}; }
        .bRed    { background:#fee2e2; color:#dc2626; }
        .bBlue   { background:#e0e7ff; color:#4f46e5; }
        .bGray   { background:#f1f5f9; color:#64748b; }
        .bPrimary{ background:${C.primarySoft}; color:${C.primary}; outline:1px solid ${C.primaryMid}; }

        .btn-primary-hover:hover { background:${C.primaryDark}!important; }
      `}</style>

      <div className="fp fp-bg">
        <div className="px-5 md:px-8 py-7 flex flex-col gap-6">

          {/* ── HEADER ── */}
          <div className="fp-in d1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:4 }}>
                <Activity size={14} style={{ color:C.primary }}/>
                <span style={{ color:C.primary, fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:".1em" }}>
                  Financeiro {roleContext ? `· ${roleContext.toUpperCase()}` : ""}
                </span>
              </div>
              <h1 style={{ color:"#0f172a", fontSize:24, fontWeight:800, lineHeight:1.2 }}>Visão Geral</h1>
              <p style={{ color:"#94a3b8", fontSize:13, marginTop:3 }}>Acompanhe entradas, saídas e saldo em tempo real</p>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
              <div style={{ position:"relative" }}>
                <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}
                  className="fp-inp" style={{ ...inp, paddingRight:32, appearance:"none", minWidth:100, cursor:"pointer" }}>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <ChevronDown size={13} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", color:"#94a3b8", pointerEvents:"none" }}/>
              </div>
              <button onClick={exportToExcel} style={btnG}><Download size={14}/> Exportar</button>
              <button onClick={() => setShowForm(true)} className="btn-primary-hover" style={btnP}>
                <Plus size={15}/> Lançamento
              </button>
            </div>
          </div>

          {/* ── KPI CARDS ── */}
          <div className="fp-in d2 grid grid-cols-2 lg:grid-cols-4 gap-4">

            {/* Entradas */}
            <div className="kpi" style={{ ...card, padding:20 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:C.primaryLight, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <TrendingUp size={16} style={{ color:C.primaryDark }}/>
                </div>
                {entradasChange && (
                  <span className={`badge ${Number(entradasChange) >= 0 ? "bGreen" : "bRed"}`}>
                    {Number(entradasChange) >= 0 ? <ArrowUpRight size={9}/> : <ArrowDownRight size={9}/>}
                    {Math.abs(Number(entradasChange))}%
                  </span>
                )}
              </div>
              <p style={{ color:"#64748b", fontSize:12, fontWeight:500, marginBottom:4 }}>Total Entradas</p>
              <p style={{ color:"#0f172a", fontSize:20, fontWeight:800, lineHeight:1 }}>{fmtBRL(totalEntradas)}</p>
            </div>

            {/* Saídas */}
            <div className="kpi" style={{ ...card, padding:20 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:"#fee2e2", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <TrendingDown size={16} style={{ color:"#dc2626" }}/>
                </div>
                <span className="badge bGray">
                  {totalEntradas > 0 ? `${((totalSaidas/totalEntradas)*100).toFixed(0)}%` : "—"}
                </span>
              </div>
              <p style={{ color:"#64748b", fontSize:12, fontWeight:500, marginBottom:4 }}>Total Saídas</p>
              <p style={{ color:"#0f172a", fontSize:20, fontWeight:800, lineHeight:1 }}>{fmtBRL(totalSaidas)}</p>
            </div>

            {/* Saldo Inicial */}
            <div className="kpi" style={{ ...card, padding:20, cursor:"pointer" }} onClick={() => setShowSaldoForm(true)}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:"#fef9c3", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Pencil size={14} style={{ color:"#ca8a04" }}/>
                </div>
                <span className="badge" style={{ background:"#fef9c3", color:"#a16207" }}><Pencil size={9}/> Editar</span>
              </div>
              <p style={{ color:"#64748b", fontSize:12, fontWeight:500, marginBottom:4 }}>Saldo Inicial</p>
              <p style={{ color:"#0f172a", fontSize:20, fontWeight:800, lineHeight:1 }}>{fmtBRL(saldoInicial)}</p>
            </div>

            {/* Saldo Total */}
            <div className="kpi" style={{ ...card, padding:20, borderColor: saldoGeral >= 0 ? C.primaryMid : "#fecaca" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                <div style={{ width:36, height:36, borderRadius:10, background: saldoGeral >= 0 ? C.primaryLight : "#fee2e2", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Wallet size={14} style={{ color: saldoGeral >= 0 ? C.primaryDark : "#dc2626" }}/>
                </div>
                <span className={`badge ${saldoGeral >= 0 ? "bGreen" : "bRed"}`}>
                  {saldoGeral >= 0 ? <ArrowUpRight size={9}/> : <ArrowDownRight size={9}/>}
                  {saldoGeral >= 0 ? "Positivo" : "Negativo"}
                </span>
              </div>
              <p style={{ color:"#64748b", fontSize:12, fontWeight:500, marginBottom:4 }}>Saldo Total</p>
              <p style={{ color: saldoGeral >= 0 ? C.primaryDark : "#dc2626", fontSize:20, fontWeight:800, lineHeight:1 }}>{fmtBRL(saldoGeral)}</p>
            </div>
          </div>

          {/* ── CHART ── */}
          <div className="fp-in d3" style={{ ...card, padding:24 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:22 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:C.primaryLight, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <BarChart3 size={16} style={{ color:C.primaryDark }}/>
                </div>
                <div>
                  <p style={{ color:"#0f172a", fontSize:15, fontWeight:700 }}>Fluxo Mensal</p>
                  <p style={{ color:"#94a3b8", fontSize:12 }}>{selectedYear}</p>
                </div>
              </div>
              <div style={{ display:"flex", gap:3, background:"#f1f5f9", borderRadius:10, padding:3 }}>
                {(["area","bar"] as const).map(t => (
                  <button key={t} className="ct-btn" onClick={() => setChartType(t)} style={{
                    background: chartType === t ? "#fff" : "transparent",
                    color: chartType === t ? C.primary : "#94a3b8",
                    boxShadow: chartType === t ? "0 1px 4px rgba(0,0,0,.08)" : "none",
                  }}>
                    {t === "area" ? "Área" : "Barras"}
                  </button>
                ))}
              </div>
            </div>

            <ResponsiveContainer width="100%" height={220}>
              {chartType === "area" ? (
                <AreaChart data={resumoPorMes} margin={{ top:4, right:4, left:-24, bottom:0 }}>
                  <defs>
                    <linearGradient id="gE" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={C.primary} stopOpacity={0.2}/>
                      <stop offset="95%" stopColor={C.primary} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.14}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                  <XAxis dataKey="name" tick={{ fill:"#94a3b8", fontSize:11 }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fill:"#94a3b8", fontSize:10 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Area type="monotone" dataKey="entradas" name="entradas" stroke={C.primary} strokeWidth={2.5} fill="url(#gE)" dot={false} activeDot={{ r:5, fill:C.primary, strokeWidth:0 }}/>
                  <Area type="monotone" dataKey="saidas"   name="saidas"   stroke="#ef4444"  strokeWidth={2.5} fill="url(#gS)" dot={false} activeDot={{ r:5, fill:"#ef4444", strokeWidth:0 }}/>
                </AreaChart>
              ) : (
                <BarChart data={resumoPorMes} margin={{ top:4, right:4, left:-24, bottom:0 }} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                  <XAxis dataKey="name" tick={{ fill:"#94a3b8", fontSize:11 }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fill:"#94a3b8", fontSize:10 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Bar dataKey="entradas" name="entradas" fill={C.primary} fillOpacity={0.85} radius={[6,6,0,0]} maxBarSize={18}/>
                  <Bar dataKey="saidas"   name="saidas"   fill="#ef4444"  fillOpacity={0.75} radius={[6,6,0,0]} maxBarSize={18}/>
                </BarChart>
              )}
            </ResponsiveContainer>

            <div style={{ display:"flex", justifyContent:"center", gap:24, marginTop:14 }}>
              {[{ color:C.primary, label:"Entradas" },{ color:"#ef4444", label:"Saídas" }].map(l => (
                <div key={l.label} style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <div style={{ width:8, height:8, borderRadius:2, background:l.color }}/>
                  <span style={{ color:"#94a3b8", fontSize:11, fontWeight:500 }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── TRANSACTIONS ── */}
          <div className="fp-in d4" style={{ ...card, overflow:"hidden" }}>

            {/* Header */}
            <div style={{ padding:"18px 20px 14px", borderBottom:"1px solid #f1f5f9" }}>

              {/* Month pills */}
              <div style={{ display:"flex", gap:3, flexWrap:"wrap", marginBottom:14 }}>
                <button className={`mpill ${selectedMonth === null ? "active" : ""}`} onClick={() => setSelectedMonth(null)}>
                  Todos
                </button>
                {MONTHS.map((m,i) => {
                  const hasData = resumoPorMes[i].entradas > 0 || resumoPorMes[i].saidas > 0
                  return (
                    <button key={i} className={`mpill ${selectedMonth === i+1 ? "active" : ""}`}
                      onClick={() => setSelectedMonth(selectedMonth === i+1 ? null : i+1)}
                      style={{ opacity: hasData ? 1 : 0.38 }}>
                      {m}
                    </button>
                  )
                })}
              </div>

              {/* Toolbar */}
              <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", justifyContent:"space-between", gap:10 }}>
                <div>
                  <p style={{ color:"#0f172a", fontWeight:700, fontSize:15 }}>
                    Lançamentos
                    {selectedMonth && <span style={{ color:"#94a3b8", fontWeight:400, fontSize:13, marginLeft:8 }}>— {MONTHS_FULL[selectedMonth-1]} {selectedYear}</span>}
                  </p>
                  {selectedMonth && (
                    <div style={{ display:"flex", gap:8, marginTop:5 }}>
                      <span className="badge bGreen"><TrendingUp size={9}/> {fmtBRL(entradasFiltradas)}</span>
                      <span className="badge bRed"><TrendingDown size={9}/> {fmtBRL(saidasFiltradas)}</span>
                      <span className={`badge ${saldoFiltrado >= 0 ? "bPrimary" : "bRed"}`}>= {fmtBRL(saldoFiltrado)}</span>
                    </div>
                  )}
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <div style={{ position:"relative" }}>
                    <Search size={13} style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", color:"#94a3b8" }}/>
                    <input className="fp-inp" style={{ ...inp, paddingLeft:32, fontSize:13, width:180 }}
                      placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
                  </div>
                  <div style={{ display:"flex", gap:3, background:"#f1f5f9", borderRadius:10, padding:3 }}>
                    {(["ALL","ENTRADA","SAIDA"] as const).map(t => (
                      <button key={t} className="ct-btn" onClick={() => setTypeFilter(t)} style={{
                        fontSize:11,
                        background: typeFilter === t ? "#fff" : "transparent",
                        color: typeFilter === t
                          ? t === "ENTRADA" ? C.primaryDark : t === "SAIDA" ? "#dc2626" : "#0f172a"
                          : "#94a3b8",
                        boxShadow: typeFilter === t ? "0 1px 4px rgba(0,0,0,.08)" : "none",
                      }}>
                        {t === "ALL" ? "Todos" : t === "ENTRADA" ? "Entradas" : "Saídas"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Rows */}
            <div className="fp-scroll" style={{ maxHeight:400, overflowY:"auto" }}>
              {filtered.length === 0 ? (
                <div style={{ textAlign:"center", padding:"48px 20px" }}>
                  <DollarSign size={32} style={{ color:"#e2e8f0", margin:"0 auto 12px" }}/>
                  <p style={{ color:"#64748b", fontWeight:600, fontSize:14 }}>Nenhum lançamento</p>
                  <p style={{ color:"#94a3b8", fontSize:12, marginTop:4 }}>Ajuste os filtros ou adicione um novo lançamento</p>
                </div>
              ) : filtered.map(f => (
                <div key={f.id} className="tx-row" style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 20px" }}>
                  <div style={{
                    width:36, height:36, borderRadius:10, flexShrink:0,
                    background: f.type === "ENTRADA" ? C.primaryLight : "#fee2e2",
                    display:"flex", alignItems:"center", justifyContent:"center",
                  }}>
                    {f.type === "ENTRADA"
                      ? <TrendingUp size={15} style={{ color:C.primaryDark }}/>
                      : <TrendingDown size={15} style={{ color:"#dc2626" }}/>
                    }
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ color:"#0f172a", fontSize:13, fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                      {f.description}
                    </p>
                    <p style={{ color:"#94a3b8", fontSize:11, marginTop:2 }}>
                      {new Date(f.date).toLocaleDateString("pt-BR")}
                      {f.society && <span style={{ marginLeft:6, color:"#cbd5e1" }}>· {f.society.name}</span>}
                    </p>
                  </div>
                  <span style={{ fontWeight:800, fontSize:14, whiteSpace:"nowrap", color: f.type === "ENTRADA" ? C.primaryDark : "#dc2626" }}>
                    {f.type === "ENTRADA" ? "+" : "−"} {fmtBRL(f.value)}
                  </span>
                  <div style={{ display:"flex", gap:4 }}>
                    <button style={iconBtn} onClick={() => setEditingFinance(f)} title="Editar"
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background=C.primarySoft; (e.currentTarget as HTMLElement).style.color=C.primary }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background="#f8fafc"; (e.currentTarget as HTMLElement).style.color="#94a3b8" }}>
                      <Pencil size={13}/>
                    </button>
                    <form action={deleteAction} style={{ display:"contents" }}>
                      <input type="hidden" name="id" value={f.id}/>
                      <input type="hidden" name="societyId" value={societyId ?? ""}/>
                      <input type="hidden" name="roleContext" value={roleContext ?? ""}/>
                      <button type="submit" style={iconBtn} title="Excluir"
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background="#fef2f2"; (e.currentTarget as HTMLElement).style.color="#ef4444" }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background="#f8fafc"; (e.currentTarget as HTMLElement).style.color="#94a3b8" }}>
                        <Trash2 size={13}/>
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── MODAL BACKDROP ── */}
        {(showSaldoForm || showForm || !!editingFinance) && (
          <div className="fp-fade" style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.38)", backdropFilter:"blur(5px)", zIndex:49 }}
            onClick={() => { setShowSaldoForm(false); setShowForm(false); setEditingFinance(null) }}/>
        )}

        {/* ── MODAL: Saldo Inicial ── */}
        {showSaldoForm && (
          <div className="fp-fade" style={{ position:"fixed", inset:0, zIndex:50, display:"flex", alignItems:"center", justifyContent:"center", padding:20, pointerEvents:"none" }}>
            <div className="fp-modal p-6 w-full" style={{ maxWidth:380, pointerEvents:"auto" }} onClick={e => e.stopPropagation()}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:"#fef9c3", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Target size={16} style={{ color:"#ca8a04" }}/>
                  </div>
                  <div>
                    <p style={{ color:"#0f172a", fontWeight:700, fontSize:15 }}>Saldo Inicial</p>
                    <p style={{ color:"#94a3b8", fontSize:12 }}>Valor já em caixa</p>
                  </div>
                </div>
                <button onClick={() => setShowSaldoForm(false)} style={{ ...iconBtn, flexShrink:0 }}><X size={14}/></button>
              </div>
              <input type="number" min="0" step="0.01" value={saldoInicial}
                onChange={e => setSaldoInicial(parseFloat(e.target.value)||0)}
                className="fp-inp" style={{ ...inp, marginBottom:16 }}/>
              <button onClick={() => setShowSaldoForm(false)} className="btn-primary-hover"
                style={{ ...btnP, width:"100%", justifyContent:"center" }}>
                Confirmar
              </button>
            </div>
          </div>
        )}

        {/* ── MODAL: Novo Lançamento ── */}
        {showForm && (
          <ModalForm
            title="Novo Lançamento"
            icon={<Plus size={16} style={{ color:C.primary }}/>}
            iconBg={C.primaryLight}
            iconColor={C.primary}
            submitLabel="Salvar"
            submitBg={C.primary}
            onClose={() => setShowForm(false)}
            error={createState.error}
            onSubmit={async (fd) => {
              if (societyId) fd.set("societyId", String(societyId))
              if (roleContext) fd.set("roleContext", roleContext)
              await createAction(fd)
              setShowForm(false)
            }}
          />
        )}

        {/* ── MODAL: Editar Lançamento ── */}
        {editingFinance && (
          <ModalForm
            title="Editar Lançamento"
            icon={<Pencil size={15} style={{ color:"#ca8a04" }}/>}
            iconBg="#fef9c3"
            iconColor="#ca8a04"
            submitLabel="Atualizar"
            submitBg="#ca8a04"
            onClose={() => setEditingFinance(null)}
            error={updateState.error}
            defaultType={editingFinance.type}
            defaultDesc={editingFinance.description}
            defaultValue={editingFinance.value}
            defaultDate={new Date(editingFinance.date).toISOString().split("T")[0]}
            onSubmit={async (fd) => {
              fd.set("id", String(editingFinance.id))
              if (societyId) fd.set("societyId", String(societyId))
              if (roleContext) fd.set("roleContext", roleContext)
              await updateAction(fd)
              setEditingFinance(null)
            }}
          />
        )}
      </div>
    </>
  )
}