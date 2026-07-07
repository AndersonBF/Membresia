"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft, Plus, Trash2, X,
  Users, Search, Pencil, Check, CalendarDays,
} from "lucide-react"

type ScheduleType = "DOMINGO" | "EVENTO"

interface ScheduleMember {
  id: number
  member: { id: number; name: string; profileImageUrl: string | null }
}
interface Schedule {
  id: number
  title: string | null
  type: ScheduleType
  date: string
  notes: string | null
  members: ScheduleMember[]
}
interface Diacono {
  id: number
  name: string
  profileImageUrl: string | null
}

const AC = "#0d9488"

// Datas são "puras" (sem hora), guardadas como meia-noite UTC.
// Sempre formatamos em UTC para não deslocar o dia no fuso local.
function formatDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric", timeZone: "UTC",
  })
}
function shortDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" })
}
function monthLabel(d: string) {
  return new Date(d).toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" })
}
function monthKey(d: string) {
  const dt = new Date(d)
  return `${dt.getUTCFullYear()}-${dt.getUTCMonth()}`
}
function dayNum(d: string) {
  return new Date(d).getUTCDate()
}
function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map(p => p[0]).join("").toUpperCase()
}

// próximo domingo (para pré-preencher o formulário) — em componentes locais, sem UTC shift
function nextSunday() {
  const d = new Date()
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7))
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

type FormState = {
  type: ScheduleType
  title: string
  date: string
  notes: string
  memberIds: number[]
}
const emptyForm = (): FormState => ({
  type: "DOMINGO", title: "", date: nextSunday(), notes: "", memberIds: [],
})

export default function EscalaPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [diaconos, setDiaconos]   = useState<Diacono[]>([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm]           = useState<FormState>(emptyForm())
  const [memberSearch, setMemberSearch] = useState("")
  const [saving, setSaving]       = useState(false)

  async function load() {
    setLoading(true)
    const [sRes, mRes] = await Promise.all([
      fetch("/api/diaconia/schedules"),
      fetch("/api/diaconia/members"),
    ])
    setSchedules(await sRes.json())
    setDiaconos(await mRes.json())
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm())
    setMemberSearch("")
    setShowForm(true)
  }
  function openEdit(s: Schedule) {
    setEditingId(s.id)
    setForm({
      type: s.type,
      title: s.title ?? "",
      date: s.date.slice(0, 10),
      notes: s.notes ?? "",
      memberIds: s.members.map(m => m.member.id),
    })
    setMemberSearch("")
    setShowForm(true)
  }

  function toggleMember(id: number) {
    setForm(f => ({
      ...f,
      memberIds: f.memberIds.includes(id)
        ? f.memberIds.filter(x => x !== id)
        : [...f.memberIds, id],
    }))
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!form.date) return
    if (form.type === "EVENTO" && !form.title.trim()) return
    setSaving(true)
    const payload = {
      type: form.type,
      title: form.title.trim() || null,
      date: form.date,
      notes: form.notes.trim() || null,
      memberIds: form.memberIds,
    }
    if (editingId) {
      await fetch(`/api/diaconia/schedules/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    } else {
      await fetch("/api/diaconia/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    }
    setShowForm(false)
    setSaving(false)
    load()
  }

  async function remove(id: number) {
    if (!confirm("Remover esta escala?")) return
    setSchedules(prev => prev.filter(s => s.id !== id))
    await fetch(`/api/diaconia/schedules/${id}`, { method: "DELETE" })
  }

  const filteredMembers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase()
    if (!q) return diaconos
    return diaconos.filter(d => d.name.toLowerCase().includes(q))
  }, [diaconos, memberSearch])

  // Agrupa as escalas por mês (mantém a ordem já vinda da API: data asc)
  const groups = useMemo(() => {
    const out: { key: string; label: string; items: Schedule[] }[] = []
    for (const s of schedules) {
      const key = monthKey(s.date)
      let g = out.find(x => x.key === key)
      if (!g) { g = { key, label: monthLabel(s.date), items: [] }; out.push(g) }
      g.items.push(s)
    }
    return out
  }, [schedules])

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .ep { font-family:'DM Sans',sans-serif; }
        @keyframes ep-in { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .ep-in { animation: ep-in 0.3s ease both; }
        .sched-card { transition: box-shadow .15s, transform .15s; }
        .sched-card:hover { box-shadow: 0 6px 22px rgba(0,0,0,.08); }
        .row-btn { opacity:0; transition: opacity .15s; }
        .sched-card:hover .row-btn { opacity:1; }
      ` }} />

      <div className="ep bg-gray-50 min-h-screen p-4 md:p-6">

        {/* Header */}
        <div className="ep-in mb-6 flex items-start justify-between gap-4">
          <div>
            <Link href="/diaconia" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-xs transition mb-3">
              <ArrowLeft size={13} /> Voltar para Diaconia
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Escala</h1>
            <p className="text-sm text-gray-400 mt-0.5">Diáconos escalados para os cultos de domingo e eventos</p>
          </div>
          <button onClick={openCreate} style={{ background: AC }}
            className="inline-flex items-center gap-2 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm hover:opacity-90 transition mt-7 flex-shrink-0">
            <Plus size={15} /> Nova escala
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className="py-24 text-center text-gray-400 text-sm">Carregando…</div>
        ) : schedules.length === 0 ? (
          <div className="ep-in bg-white rounded-2xl border border-gray-200 py-20 text-center">
            <CalendarDays size={40} className="mx-auto text-gray-300" />
            <p className="text-gray-500 font-medium mt-3">Nenhuma escala cadastrada</p>
            <p className="text-gray-400 text-sm mt-1">Crie a primeira escala para começar.</p>
          </div>
        ) : (
          <div className="columns-1 lg:columns-2 gap-6 max-w-6xl [column-fill:balance]">
            {groups.map((group, gi) => (
              <div key={group.key} className="mb-8 break-inside-avoid inline-block w-full align-top">
                {/* Cabeçalho do mês */}
                <div className="ep-in flex items-center gap-3 mb-4 py-1"
                  style={{ animationDelay: `${gi * 0.04}s` }}>
                  <span className="text-sm font-bold text-gray-700 capitalize">{group.label}</span>
                  <span className="h-px flex-1 bg-gray-200" />
                  <span className="text-xs text-gray-400">
                    {group.items.length} escala{group.items.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Timeline vertical */}
                <div className="relative flex flex-col gap-4">
                  <span className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-gray-200" />
                  {group.items.map((s, i) => {
                    const isEvent = s.type === "EVENTO"
                    return (
                      <div key={s.id} className="relative flex gap-3 md:gap-4 items-start ep-in"
                        style={{ animationDelay: `${i * 0.03}s` }}>
                        {/* Nó da timeline com o dia */}
                        <div className="w-8 flex-shrink-0 flex justify-center pt-4 z-10">
                          <span className="w-8 h-8 rounded-full border-2 border-gray-50 flex items-center justify-center text-[11px] font-bold text-white shadow-sm"
                            style={{ background: isEvent ? "#7c3aed" : AC }}>
                            {dayNum(s.date)}
                          </span>
                        </div>

                        {/* Card da escala */}
                        <div className="sched-card bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex-1 min-w-0">
                  {/* Card header */}
                  <div className="flex items-start gap-3 px-5 pt-4 pb-3 border-b border-gray-100">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={isEvent
                            ? { background: "#f5f3ff", color: "#7c3aed", border: "1px solid #ddd6fe" }
                            : { background: "#f0fdfa", color: AC, border: "1px solid #99f6e4" }}>
                          {isEvent ? "Evento" : "Domingo"}
                        </span>
                        <span className="text-xs text-gray-400">{shortDate(s.date)}</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-800 mt-1 truncate">
                        {isEvent ? (s.title || "Evento") : "Culto de Domingo"}
                      </p>
                      <p className="text-xs text-gray-400 capitalize">{formatDate(s.date)}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => openEdit(s)}
                        className="row-btn text-gray-300 hover:text-teal-600 transition p-1">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => remove(s.id)}
                        className="row-btn text-gray-300 hover:text-red-400 transition p-1">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Escalados */}
                  <div className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">
                      <Users size={12} /> {s.members.length} diácono{s.members.length !== 1 ? "s" : ""} escalado{s.members.length !== 1 ? "s" : ""}
                    </div>
                    {s.members.length === 0 ? (
                      <p className="text-xs text-gray-300">Ninguém escalado ainda</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {s.members.map(m => (
                          <span key={m.id}
                            className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-full pl-1 pr-2.5 py-0.5">
                            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                              style={{ background: AC }}>
                              {initials(m.member.name)}
                            </span>
                            <span className="text-xs text-gray-700">{m.member.name}</span>
                          </span>
                        ))}
                      </div>
                    )}
                    {s.notes && (
                      <p className="text-xs text-gray-400 mt-3 border-t border-gray-50 pt-2.5">{s.notes}</p>
                    )}
                  </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="ep bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
            style={{ animation: "ep-in 0.2s ease both" }}>
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">
                {editingId ? "Editar escala" : "Nova escala"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 transition">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={save} className="px-6 py-5 flex flex-col gap-4 overflow-y-auto">
              {/* Tipo */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Tipo</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["DOMINGO", "EVENTO"] as ScheduleType[]).map(t => {
                    const active = form.type === t
                    return (
                      <button key={t} type="button"
                        onClick={() => setForm(f => ({ ...f, type: t }))}
                        className="text-sm font-medium py-2.5 rounded-lg border transition"
                        style={active
                          ? { background: t === "EVENTO" ? "#7c3aed" : AC, color: "#fff", borderColor: "transparent" }
                          : { background: "#fff", color: "#6b7280", borderColor: "#e5e7eb" }}>
                        {t === "DOMINGO" ? "Domingo" : "Evento"}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Nome do evento */}
              {form.type === "EVENTO" && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Nome do evento *</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    required autoFocus placeholder="Ex: Santa Ceia, Vigília…"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-teal-400 transition" />
                </div>
              )}

              {/* Data */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Data *</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-teal-400 transition" />
              </div>

              {/* Diáconos */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center justify-between mb-1.5">
                  <span>Diáconos escalados</span>
                  <span className="text-teal-600 normal-case tracking-normal font-semibold">{form.memberIds.length} selecionado{form.memberIds.length !== 1 ? "s" : ""}</span>
                </label>
                <div className="relative mb-2">
                  <Search size={14} className="absolute left-3 top-3 text-gray-400" />
                  <input value={memberSearch} onChange={e => setMemberSearch(e.target.value)}
                    placeholder="Buscar diácono…"
                    className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none focus:border-teal-400 transition" />
                </div>
                <div className="border border-gray-200 rounded-lg max-h-52 overflow-y-auto divide-y divide-gray-50">
                  {filteredMembers.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-6">Nenhum diácono encontrado</p>
                  ) : filteredMembers.map(d => {
                    const checked = form.memberIds.includes(d.id)
                    return (
                      <button key={d.id} type="button" onClick={() => toggleMember(d.id)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 transition text-left">
                        <span className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition"
                          style={checked
                            ? { background: AC, borderColor: AC }
                            : { background: "#fff", borderColor: "#d1d5db" }}>
                          {checked && <Check size={11} className="text-white" strokeWidth={3} />}
                        </span>
                        <span className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                          style={{ background: AC }}>
                          {initials(d.name)}
                        </span>
                        <span className="text-sm text-gray-700">{d.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Observações</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2} placeholder="Detalhes opcionais…"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-teal-400 transition resize-none" />
              </div>

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50 transition">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} style={{ background: AC }}
                  className="flex-1 text-white text-sm font-medium py-2.5 rounded-lg hover:opacity-90 transition disabled:opacity-60">
                  {saving ? "Salvando…" : editingId ? "Salvar alterações" : "Criar escala"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
