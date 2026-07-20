"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "react-toastify"
import {
  BookOpen, Plus, Pencil, Trash2, X, MapPin, Filter, BarChart3, Loader2, ArrowLeft, Lock,
} from "lucide-react"

const CATEGORIES = ["Visita", "Aconselhamento", "Culto", "Reunião", "Outro"] as const
type Category = (typeof CATEGORIES)[number]

const categoryStyle: Record<string, { bg: string; color: string }> = {
  "Visita":         { bg: "#eff6ff", color: "#1d4ed8" },
  "Aconselhamento": { bg: "#f0fdf4", color: "#15803d" },
  "Culto":          { bg: "#fef3c7", color: "#b45309" },
  "Reunião":        { bg: "#eef2ff", color: "#4338ca" },
  "Outro":          { bg: "#f3f4f6", color: "#4b5563" },
}

const AC = "#0f766e"

type Entry = {
  id: number
  authorId: string
  authorName: string
  category: string
  title: string
  description: string | null
  visits: number
  isPrivate: boolean
  date: string
  createdAt: string
  redacted?: boolean
  mine?: boolean
}

type FormState = {
  id?: number
  category: Category
  title: string
  description: string
  visits: string
  date: string
  isPrivate: boolean
}

function todayISO() {
  const d = new Date()
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10)
}

const emptyForm: FormState = {
  category: "Visita",
  title: "",
  description: "",
  visits: "0",
  date: todayISO(),
  isPrivate: false,
}

export default function PastorDiaryClient({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCat, setFilterCat] = useState<string>("")
  const [filterMonth, setFilterMonth] = useState<string>("") // YYYY-MM

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  async function load() {
    setLoading(true)
    try {
      const qs = new URLSearchParams()
      if (filterCat) qs.set("category", filterCat)
      if (filterMonth) qs.set("month", filterMonth)
      const res = await fetch(`/api/pastor/diary?${qs.toString()}`)
      const data = await res.json()
      setEntries(res.ok ? data.entries ?? [] : [])
    } catch {
      setEntries([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCat, filterMonth])

  function openCreate() {
    setForm({ ...emptyForm, date: todayISO() })
    setModalOpen(true)
  }

  function openEdit(e: Entry) {
    setForm({
      id: e.id,
      category: (CATEGORIES.includes(e.category as Category) ? e.category : "Outro") as Category,
      title: e.title,
      description: e.description ?? "",
      visits: String(e.visits),
      date: new Date(e.date).toISOString().slice(0, 10),
      isPrivate: e.isPrivate,
    })
    setModalOpen(true)
  }

  async function save() {
    if (!form.title.trim()) return toast.error("Informe um título.")
    if (!form.date) return toast.error("Informe a data.")
    setSaving(true)
    try {
      const payload = {
        category: form.category,
        title: form.title.trim(),
        description: form.description.trim() || null,
        visits: Number(form.visits) || 0,
        date: form.date,
        isPrivate: form.isPrivate,
      }
      const res = form.id
        ? await fetch(`/api/pastor/diary/${form.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch(`/api/pastor/diary`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar")
      toast.success(form.id ? "Registro atualizado!" : "Registro criado!")
      setModalOpen(false)
      load()
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: number) {
    if (!confirm("Excluir este registro?")) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/pastor/diary/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Registro excluído!")
      setEntries((prev) => prev.filter((e) => e.id !== id))
    } catch {
      toast.error("Erro ao excluir")
    } finally {
      setDeletingId(null)
    }
  }

  // ── Relatório (com base nas entradas atualmente carregadas) ──
  const report = useMemo(() => {
    const totalVisits = entries.reduce((s, e) => s + e.visits, 0)
    const byCategory = CATEGORIES.map((c) => {
      const items = entries.filter((e) => e.category === c)
      return { category: c, count: items.length, visits: items.reduce((s, e) => s + e.visits, 0) }
    }).filter((r) => r.count > 0)

    const byMonthMap: Record<string, { count: number; visits: number }> = {}
    entries.forEach((e) => {
      const d = new Date(e.date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      if (!byMonthMap[key]) byMonthMap[key] = { count: 0, visits: 0 }
      byMonthMap[key].count++
      byMonthMap[key].visits += e.visits
    })
    const byMonth = Object.entries(byMonthMap)
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .slice(0, 6)
      .map(([key, v]) => {
        const [y, m] = key.split("-").map(Number)
        const label = new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })
        return { label, ...v }
      })

    const maxMonthCount = Math.max(1, ...byMonth.map((m) => m.count))
    return { totalVisits, total: entries.length, byCategory, byMonth, maxMonthCount }
  }, [entries])

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      {/* HERO */}
      <div style={{ background: "#0f172a" }}>
        <div className="px-6 md:px-10 pt-6">
          <Link
            href="/pastor"
            className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs transition"
          >
            <ArrowLeft size={13} /> Voltar
          </Link>
        </div>
        <div className="px-6 md:px-10 pt-3 pb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.08)" }}>
              <BookOpen size={34} className="text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold" style={{ fontSize: "clamp(1.8rem,5vw,2.8rem)" }}>
                Diário do Pastor
              </h1>
              <p className="text-white/50 text-sm mt-1 font-light">
                {isSuperAdmin ? "Visão geral (todos os pastores)" : "Seus registros de visitas e atividades"}
              </p>
            </div>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 bg-white text-slate-900 px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-white/90 transition shadow-lg"
          >
            <Plus size={16} /> Novo registro
          </button>
        </div>
        <div style={{ height: 2, background: `linear-gradient(90deg, ${AC}, ${AC}55, transparent)` }} />
      </div>

      <div className="p-4 md:p-6 flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto">
        {/* LISTA */}
        <div className="w-full lg:w-2/3 flex flex-col gap-4">
          {/* FILTROS */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex flex-wrap items-center gap-3">
            <span className="text-xs text-gray-400 inline-flex items-center gap-1">
              <Filter size={13} /> Filtros
            </span>
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-teal-500"
            >
              <option value="">Todas as categorias</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-teal-500"
            />
            {(filterCat || filterMonth) && (
              <button
                onClick={() => { setFilterCat(""); setFilterMonth("") }}
                className="text-xs text-gray-400 hover:text-gray-700 transition"
              >
                Limpar
              </button>
            )}
          </div>

          {loading ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 flex items-center justify-center text-gray-400">
              <Loader2 className="animate-spin" size={20} />
            </div>
          ) : entries.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center">
              <p className="text-gray-400 text-sm">Nenhum registro encontrado.</p>
              <button onClick={openCreate} className="text-sm font-medium mt-2" style={{ color: AC }}>
                Criar registro →
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {entries.map((e) => {
                const st = categoryStyle[e.category] ?? categoryStyle["Outro"]
                const d = new Date(e.date)
                return (
                  <div key={e.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="text-center flex-shrink-0 w-12">
                          <p className="text-[10px] font-semibold" style={{ color: AC }}>
                            {d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "").toUpperCase()}
                          </p>
                          <p className="text-lg font-bold text-gray-900 leading-tight">
                            {d.getDate().toString().padStart(2, "0")}
                          </p>
                          <p className="text-[10px] text-gray-400">{d.getFullYear()}</p>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                              style={{ background: st.bg, color: st.color }}
                            >
                              {e.category}
                            </span>
                            {e.isPrivate && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-white inline-flex items-center gap-1">
                                <Lock size={9} /> Confidencial
                              </span>
                            )}
                            {e.visits > 0 && (
                              <span className="text-[11px] text-gray-500 inline-flex items-center gap-1">
                                <MapPin size={11} /> {e.visits} visita{e.visits > 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                          {e.redacted ? (
                            <p className="text-sm text-gray-400 italic mt-1 inline-flex items-center gap-1.5">
                              <Lock size={12} /> Conteúdo confidencial — visível apenas para o pastor
                            </p>
                          ) : (
                            <>
                              <p className="font-semibold text-gray-800 text-sm mt-1">{e.title}</p>
                              {e.description && (
                                <p className="text-sm text-gray-500 mt-1 whitespace-pre-wrap">{e.description}</p>
                              )}
                            </>
                          )}
                          {isSuperAdmin && (
                            <p className="text-[11px] text-gray-400 mt-1">por {e.authorName}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!e.redacted && (
                          <button
                            onClick={() => openEdit(e)}
                            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => remove(e.id)}
                          disabled={deletingId === e.id}
                          className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-50"
                        >
                          {deletingId === e.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* RELATÓRIO */}
        <div className="w-full lg:w-1/3 flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={16} style={{ color: AC }} />
              <h2 className="text-base font-semibold text-gray-900">Relatório</h2>
              <span className="text-[11px] text-gray-400 ml-auto">
                {filterCat || filterMonth ? "filtrado" : "geral"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="rounded-xl p-3" style={{ background: "#f0fdfa" }}>
                <p className="text-2xl font-bold" style={{ color: AC }}>{report.totalVisits}</p>
                <p className="text-[11px] text-gray-500">Visitas</p>
              </div>
              <div className="rounded-xl p-3 bg-gray-50">
                <p className="text-2xl font-bold text-gray-800">{report.total}</p>
                <p className="text-[11px] text-gray-500">Registros</p>
              </div>
            </div>

            {/* Por categoria */}
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Por categoria</p>
            <div className="flex flex-col gap-2 mb-5">
              {report.byCategory.length === 0 ? (
                <p className="text-xs text-gray-400">Sem dados.</p>
              ) : (
                report.byCategory.map((r) => {
                  const st = categoryStyle[r.category] ?? categoryStyle["Outro"]
                  return (
                    <div key={r.category} className="flex items-center justify-between text-sm">
                      <span className="inline-flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: st.color }} />
                        <span className="text-gray-600">{r.category}</span>
                      </span>
                      <span className="text-gray-400 text-xs">
                        {r.count} reg · {r.visits} vis
                      </span>
                    </div>
                  )
                })
              )}
            </div>

            {/* Por mês */}
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Por mês</p>
            <div className="flex flex-col gap-2">
              {report.byMonth.length === 0 ? (
                <p className="text-xs text-gray-400">Sem dados.</p>
              ) : (
                report.byMonth.map((m) => (
                  <div key={m.label} className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-500 w-14 flex-shrink-0">{m.label}</span>
                    <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(m.count / report.maxMonthCount) * 100}%`, background: AC }}
                      />
                    </div>
                    <span className="text-[11px] text-gray-400 w-16 text-right flex-shrink-0">
                      {m.count} · {m.visits}v
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL CRIAR/EDITAR */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl relative w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-black transition"
            >
              <X size={20} />
            </button>

            <h2 className="text-lg font-semibold mb-4">
              {form.id ? "Editar registro" : "Novo registro"}
            </h2>

            <div className="flex flex-col gap-4">
              {/* Categoria */}
              <div className="flex flex-col gap-1.5">
                <span className="text-sm text-gray-600 font-medium">Categoria</span>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, category: c }))}
                      className={`py-2 px-2 rounded-md text-xs font-medium border transition
                        ${form.category === c
                          ? "bg-teal-700 text-white border-teal-700"
                          : "bg-white text-gray-700 border-gray-300 hover:border-teal-500"}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Data + Visitas */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm text-gray-600 font-medium">Data</span>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm text-gray-600 font-medium">Nº de visitas</span>
                  <input
                    type="number"
                    min={0}
                    value={form.visits}
                    onChange={(e) => setForm((f) => ({ ...f, visits: e.target.value }))}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Título */}
              <div className="flex flex-col gap-1.5">
                <span className="text-sm text-gray-600 font-medium">Título</span>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Ex.: Visita à família Silva"
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Descrição */}
              <div className="flex flex-col gap-1.5">
                <span className="text-sm text-gray-600 font-medium">Relato</span>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={4}
                  placeholder="Descreva o que foi feito..."
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-teal-500 resize-none"
                />
              </div>

              {/* Confidencial */}
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, isPrivate: !f.isPrivate }))}
                className={`flex items-center gap-3 rounded-md border px-3 py-2.5 text-left transition
                  ${form.isPrivate
                    ? "bg-slate-800 text-white border-slate-800"
                    : "bg-white text-gray-700 border-gray-300 hover:border-slate-500"}`}
              >
                <Lock size={16} className="flex-shrink-0" />
                <span className="flex flex-col">
                  <span className="text-sm font-medium">Confidencial</span>
                  <span className={`text-[11px] ${form.isPrivate ? "text-white/70" : "text-gray-400"}`}>
                    Só você vê o título e o relato. Nem o administrador vê o conteúdo.
                  </span>
                </span>
                <span
                  className={`ml-auto w-9 h-5 rounded-full flex items-center px-0.5 transition flex-shrink-0
                    ${form.isPrivate ? "bg-white/30 justify-end" : "bg-gray-300 justify-start"}`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow" />
                </span>
              </button>

              <button
                onClick={save}
                disabled={saving}
                className="bg-teal-700 text-white py-2.5 rounded-md text-sm font-medium hover:bg-teal-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 size={15} className="animate-spin" />}
                {form.id ? "Salvar alterações" : "Criar registro"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
