"use client"

import { useMemo, useState } from "react"
import { toast } from "react-toastify"
import {
  Plus, Trash2, Save, BookMarked, Loader2, FileText, Check,
  ChevronUp, ChevronDown, Presentation, Printer, Clock, X, History,
  Search, Copy, CheckCircle2, Download, Library, Tag, Layers, BookOpen,
  Menu, PanelLeftClose,
} from "lucide-react"
import BiblePanel from "./BiblePanel"

// ── Tipos de bloco ──────────────────────────────────────────────────────────
const BLOCK_TYPES = [
  { type: "introducao", label: "Introdução", color: "#0369a1" },
  { type: "ponto",      label: "Ponto",      color: "#0f766e" },
  { type: "ilustracao", label: "Ilustração", color: "#b45309" },
  { type: "aplicacao",  label: "Aplicação",  color: "#7c3aed" },
  { type: "conclusao",  label: "Conclusão",  color: "#be123c" },
  { type: "oracao",     label: "Oração",     color: "#4b5563" },
] as const

type BlockType = (typeof BLOCK_TYPES)[number]["type"]
type Block = { id: string; type: BlockType; text: string }

export type Sermon = {
  id: number
  title: string
  passage: string | null
  content: string | null
  blocks: Block[] | null
  date: string | null
  series: string | null
  tags: string[]
  preachedAt: string[]
  status: string
  updatedAt: string
}

const AC = "#0f766e"
const WPM = 130
const TAG_SUGESTOES = ["Evangelístico", "Ceia do Senhor", "Funeral", "Casamento", "Natal", "Páscoa", "Batismo", "Doutrinário"]

const labelOf = (t: BlockType) => BLOCK_TYPES.find((b) => b.type === t)?.label ?? t
const colorOf = (t: BlockType) => BLOCK_TYPES.find((b) => b.type === t)?.color ?? "#6b7280"
const uid = () => Math.random().toString(36).slice(2, 9)
const toDateInput = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(0, 10) : "")

/** Livro bíblico a partir da referência: "1 Coríntios 13:4-7" → "1 Coríntios" */
function bookOf(passage: string | null): string | null {
  if (!passage) return null
  const b = passage.replace(/\s*\d+\s*:\s*\d+.*$/, "").trim()
  return b || null
}

/** Referências citadas no texto (ex.: "João 3:16", "1 Co 13:4-7"). */
function findRefs(text: string): string[] {
  const re = /\b(\d?\s?[A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç]{2,})\s+(\d{1,3}):(\d{1,3})(?:-(\d{1,3}))?/g
  const out = new Set<string>()
  let m
  while ((m = re.exec(text)) !== null) out.add(m[0].replace(/\s+/g, " ").trim())
  return [...out]
}

const DEFAULT_BLOCKS = (): Block[] => [
  { id: uid(), type: "introducao", text: "" },
  { id: uid(), type: "ponto", text: "" },
  { id: uid(), type: "aplicacao", text: "" },
  { id: uid(), type: "conclusao", text: "" },
]

export default function SermonsClient({ initial }: { initial: Sermon[] }) {
  const [list, setList] = useState<Sermon[]>(initial)
  const [selected, setSelected] = useState<Sermon | null>(initial[0] ?? null)
  const [title, setTitle] = useState(initial[0]?.title ?? "")
  const [passage, setPassage] = useState(initial[0]?.passage ?? "")
  const [series, setSeries] = useState(initial[0]?.series ?? "")
  const [tags, setTags] = useState<string[]>(initial[0]?.tags ?? [])
  const [date, setDate] = useState(toDateInput(initial[0]?.date ?? null))
  const [status, setStatus] = useState(initial[0]?.status ?? "rascunho")
  const [blocks, setBlocks] = useState<Block[]>(initial[0]?.blocks?.length ? initial[0].blocks! : DEFAULT_BLOCKS())
  const [saving, setSaving] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [pulpit, setPulpit] = useState(false)
  const [bibleOpen, setBibleOpen] = useState(true)
  const [bibleRef, setBibleRef] = useState("")
  const [activeBlock, setActiveBlock] = useState<string | null>(null)

  // filtros
  const [q, setQ] = useState("")
  const [fSeries, setFSeries] = useState("")
  const [fTag, setFTag] = useState("")
  const [showCoverage, setShowCoverage] = useState(false)
  const [listOpen, setListOpen] = useState(true)

  function open(s: Sermon) {
    setSelected(s)
    setTitle(s.title)
    setPassage(s.passage ?? "")
    setSeries(s.series ?? "")
    setTags(s.tags ?? [])
    setDate(toDateInput(s.date))
    setStatus(s.status)
    setBlocks(s.blocks?.length ? s.blocks : DEFAULT_BLOCKS())
  }

  // ── Métricas ──
  const fullText = useMemo(() => blocks.map((b) => b.text).join("\n"), [blocks])
  const words = useMemo(() => (fullText.trim() ? fullText.trim().split(/\s+/).length : 0), [fullText])
  const minutes = Math.max(0, Math.round(words / WPM))
  const refs = useMemo(() => findRefs(`${passage}\n${fullText}`), [passage, fullText])

  const previous = useMemo(() => {
    const p = passage.trim().toLowerCase()
    if (!p) return []
    return list.filter((s) => s.id !== selected?.id && (s.passage ?? "").trim().toLowerCase() === p)
  }, [passage, list, selected])

  // ── Busca e filtros ──
  const allSeries = useMemo(
    () => [...new Set(list.map((s) => s.series).filter(Boolean) as string[])].sort(),
    [list]
  )
  const allTags = useMemo(
    () => [...new Set(list.flatMap((s) => s.tags ?? []))].sort(),
    [list]
  )
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return list.filter((s) => {
      if (fSeries && s.series !== fSeries) return false
      if (fTag && !(s.tags ?? []).includes(fTag)) return false
      if (!term) return true
      const hay = [s.title, s.passage, s.series, s.content, (s.tags ?? []).join(" ")]
        .filter(Boolean).join(" ").toLowerCase()
      return hay.includes(term)
    })
  }, [list, q, fSeries, fTag])

  // ── Cobertura bíblica ──
  const coverage = useMemo(() => {
    const map = new Map<string, { count: number; last: number | null }>()
    for (const s of list) {
      const book = bookOf(s.passage)
      if (!book) continue
      const dates = [...(s.preachedAt ?? []), ...(s.date ? [s.date] : [])].map((d) => new Date(d).getTime())
      const last = dates.length ? Math.max(...dates) : null
      const cur = map.get(book)
      map.set(book, {
        count: (cur?.count ?? 0) + 1,
        last: cur?.last != null && last != null ? Math.max(cur.last, last) : (last ?? cur?.last ?? null),
      })
    }
    return [...map.entries()]
      .map(([book, v]) => ({ book, ...v }))
      .sort((a, b) => (b.last ?? 0) - (a.last ?? 0))
  }, [list])

  // ── Blocos ──
  const addBlock = (type: BlockType) => setBlocks((p) => [...p, { id: uid(), type, text: "" }])
  const removeBlock = (id: string) => setBlocks((p) => p.filter((b) => b.id !== id))
  const setText = (id: string, text: string) => setBlocks((p) => p.map((b) => (b.id === id ? { ...b, text } : b)))
  const move = (i: number, dir: -1 | 1) =>
    setBlocks((p) => {
      const j = i + dir
      if (j < 0 || j >= p.length) return p
      const n = [...p]; [n[i], n[j]] = [n[j], n[i]]; return n
    })

  /** Abre a Bíblia numa referência (texto base ou chip clicado). */
  function abrirBiblia(r?: string) {
    setBibleRef(r || passage || "")
    setBibleOpen(true)
  }

  /** Insere a citação no bloco em foco (ou no último). */
  function inserirCitacao(texto: string) {
    const alvo = activeBlock ?? blocks[blocks.length - 1]?.id
    if (!alvo) return
    setBlocks((p) =>
      p.map((b) => (b.id === alvo ? { ...b, text: b.text ? `${b.text}\n\n${texto}` : texto } : b))
    )
    toast.success("Passagem inserida no sermão")
  }

  const toggleTag = (t: string) =>
    setTags((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]))

  // ── Ações ──
  async function novo() {
    setBusy("novo")
    try {
      const res = await fetch("/api/pastor/sermons", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Sem título", blocks: DEFAULT_BLOCKS() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setList((p) => [data.sermon, ...p]); open(data.sermon)
    } catch { toast.error("Erro ao criar sermão") } finally { setBusy(null) }
  }

  async function salvar() {
    if (!selected) return
    if (!title.trim()) return toast.error("Dê um título ao sermão.")
    setSaving(true)
    try {
      const res = await fetch(`/api/pastor/sermons/${selected.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, passage, series, tags, date: date || null, status, blocks, content: fullText }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setList((p) => p.map((x) => (x.id === data.sermon.id ? data.sermon : x)))
      setSelected(data.sermon)
      toast.success("Sermão salvo")
    } catch { toast.error("Erro ao salvar") } finally { setSaving(false) }
  }

  async function duplicar() {
    if (!selected) return
    setBusy("dup")
    try {
      const res = await fetch(`/api/pastor/sermons/${selected.id}/actions`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "duplicar" }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setList((p) => [data.sermon, ...p]); open(data.sermon)
      toast.success("Cópia criada")
    } catch { toast.error("Erro ao duplicar") } finally { setBusy(null) }
  }

  async function marcarPregado() {
    if (!selected) return
    const quando = date || new Date().toISOString().slice(0, 10)
    if (!confirm(`Registrar que você pregou este sermão em ${new Date(quando).toLocaleDateString("pt-BR")}?\n\nIsso também lança uma entrada no Diário do Pastor.`)) return
    setBusy("pregado")
    try {
      const res = await fetch(`/api/pastor/sermons/${selected.id}/actions`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pregado", date: quando }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setList((p) => p.map((x) => (x.id === data.sermon.id ? data.sermon : x)))
      setSelected(data.sermon); setStatus("pronto")
      toast.success("Registrado — e lançado no Diário")
    } catch { toast.error("Erro ao registrar") } finally { setBusy(null) }
  }

  async function excluir() {
    if (!selected) return
    if (!confirm(`Excluir "${selected.title}"?`)) return
    try {
      const res = await fetch(`/api/pastor/sermons/${selected.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      const rest = list.filter((x) => x.id !== selected.id)
      setList(rest)
      if (rest[0]) open(rest[0])
      else { setSelected(null); setTitle(""); setPassage(""); setSeries(""); setTags([]); setDate(""); setBlocks(DEFAULT_BLOCKS()) }
      toast.success("Sermão excluído")
    } catch { toast.error("Erro ao excluir") }
  }

  const btn = "inline-flex items-center gap-1.5 text-sm border border-gray-300 hover:border-teal-500 px-3 py-2 rounded-lg transition disabled:opacity-50"

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden !important; }
          #sermao-print, #sermao-print * { visibility: visible !important; }
          #sermao-print { position: absolute; left: 0; top: 0; width: 100%; padding: 24px; }
          .no-print { display: none !important; }
        }
      `}} />

      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* Alternar a lista para liberar espaço de escrita */}
        {!listOpen && (
          <button onClick={() => setListOpen(true)} title="Mostrar lista de sermões"
            className="hidden lg:flex flex-shrink-0 sticky top-16 h-fit flex-col items-center gap-2 px-2.5 py-4 rounded-xl border border-gray-300 bg-white text-gray-500 hover:border-teal-500 hover:text-teal-700 transition no-print">
            <Menu size={18} />
            <span className="text-[11px] font-medium" style={{ writingMode: "vertical-rl" }}>Sermões</span>
          </button>
        )}

        {/* ── LATERAL ── */}
        <aside className={`${listOpen ? "flex" : "hidden"} w-full lg:w-60 flex-shrink-0 flex-col gap-3 no-print`}>
          <div className="flex gap-2">
            <button onClick={novo} disabled={busy === "novo"}
              className="flex-1 inline-flex items-center justify-center gap-2 text-white font-medium py-2.5 rounded-xl transition disabled:opacity-60"
              style={{ background: AC }}>
              {busy === "novo" ? <Loader2 size={15} className="animate-spin" /> : <Plus size={16} />}
              Novo
            </button>
            <button onClick={() => setListOpen(false)} title="Recolher a lista"
              className="hidden lg:flex w-10 items-center justify-center rounded-xl border border-gray-300 text-gray-400 hover:border-teal-500 hover:text-teal-700 transition">
              <PanelLeftClose size={17} />
            </button>
          </div>

          {/* Busca */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar título, texto, tema…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500" />
          </div>

          {/* Filtros */}
          {(allSeries.length > 0 || allTags.length > 0) && (
            <div className="flex flex-col gap-2">
              {allSeries.length > 0 && (
                <select value={fSeries} onChange={(e) => setFSeries(e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-2.5 py-2 focus:outline-none focus:border-teal-500">
                  <option value="">Todas as séries</option>
                  {allSeries.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              )}
              {allTags.length > 0 && (
                <select value={fTag} onChange={(e) => setFTag(e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-2.5 py-2 focus:outline-none focus:border-teal-500">
                  <option value="">Todas as ocasiões</option>
                  {allTags.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              )}
            </div>
          )}

          {/* Lista */}
          <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Nenhum sermão encontrado.</p>
            ) : filtered.map((s) => {
              const active = selected?.id === s.id
              return (
                <button key={s.id} onClick={() => open(s)}
                  className={`text-left rounded-xl border p-3 transition ${
                    active ? "border-teal-500 bg-teal-50" : "border-gray-100 bg-white hover:border-gray-300"
                  }`}>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-800 truncate flex-1">{s.title}</p>
                    {(s.preachedAt?.length ?? 0) > 0
                      ? <CheckCircle2 size={13} className="text-teal-600 flex-shrink-0" />
                      : s.status === "pronto" && <Check size={13} className="text-teal-600 flex-shrink-0" />}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {s.passage && <p className="text-[11px] text-gray-500 truncate">{s.passage}</p>}
                    {s.series && <span className="text-[10px] text-teal-700 bg-teal-50 px-1.5 rounded">{s.series}</span>}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Cobertura bíblica */}
          {coverage.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-3">
              <button onClick={() => setShowCoverage((v) => !v)}
                className="w-full flex items-center gap-2 text-sm font-medium text-gray-700">
                <Library size={15} style={{ color: AC }} />
                Cobertura bíblica
                <span className="ml-auto text-xs text-gray-400">{coverage.length} livros</span>
              </button>
              {showCoverage && (
                <div className="mt-3 flex flex-col gap-1.5 max-h-56 overflow-y-auto">
                  {coverage.map((c) => {
                    const meses = c.last ? Math.floor((Date.now() - c.last) / (1000 * 60 * 60 * 24 * 30)) : null
                    return (
                      <div key={c.book} className="flex items-center gap-2 text-xs">
                        <span className="text-gray-700 flex-1 truncate">{c.book}</span>
                        <span className="text-gray-400">{c.count}×</span>
                        <span className={`${meses !== null && meses >= 12 ? "text-amber-600" : "text-gray-400"}`}>
                          {meses === null ? "—" : meses === 0 ? "este mês" : `${meses}m`}
                        </span>
                      </div>
                    )
                  })}
                  <p className="text-[10px] text-gray-400 mt-1">Tempo desde a última vez que você pregou no livro.</p>
                </div>
              )}
            </div>
          )}
        </aside>

        {/* ── EDITOR ── */}
        <section className="flex-1 min-w-0">
          {!selected ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <FileText size={30} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Crie um sermão para começar.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Ações */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap items-center gap-2 no-print">
                <button onClick={() => setStatus(status === "pronto" ? "rascunho" : "pronto")}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                    status === "pronto" ? "bg-teal-600 text-white border-teal-600" : "bg-white text-gray-600 border-gray-300 hover:border-teal-500"
                  }`}>
                  {status === "pronto" ? "Pronto" : "Rascunho"}
                </button>

                <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 mr-1">
                  <Clock size={14} style={{ color: AC }} />
                  <strong>≈ {minutes} min</strong>
                  <span className="text-gray-400 text-xs">({words} palavras)</span>
                </span>

                {(selected.preachedAt?.length ?? 0) > 0 && (
                  <span className="text-xs text-teal-700 bg-teal-50 border border-teal-100 px-2 py-1 rounded-full">
                    pregado {selected.preachedAt.length}×
                  </span>
                )}

                <div className="flex flex-wrap items-center gap-2 ml-auto">
                  <button onClick={marcarPregado} disabled={busy === "pregado"} className={btn} title="Registra a data e lança no Diário">
                    {busy === "pregado" ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />} Pregado
                  </button>
                  <button onClick={duplicar} disabled={busy === "dup"} className={btn}>
                    {busy === "dup" ? <Loader2 size={15} className="animate-spin" /> : <Copy size={15} />} Duplicar
                  </button>
                  <a href={`/api/pastor/sermons/${selected.id}/docx`} className={btn}>
                    <Download size={15} /> .docx
                  </a>
                  <button onClick={() => setPulpit(true)} className={btn}><Presentation size={15} /> Púlpito</button>
                  <button onClick={() => window.print()} className={btn}><Printer size={15} /> Imprimir</button>
                  <button onClick={excluir} className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition">
                    <Trash2 size={15} />
                  </button>
                  <button onClick={salvar} disabled={saving}
                    className="inline-flex items-center gap-2 text-white font-medium px-4 py-2 rounded-lg transition disabled:opacity-60"
                    style={{ background: AC }}>
                    {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Salvar
                  </button>
                </div>
              </div>

              {/* Conteúdo */}
              <div id="sermao-print" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6 flex flex-col gap-4">
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título do sermão"
                  className="text-2xl font-bold text-gray-900 border-0 border-b border-gray-200 focus:border-teal-500 focus:outline-none pb-2 placeholder:text-gray-300" />

                <div className="grid sm:grid-cols-3 gap-3 no-print">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs text-gray-500 font-medium inline-flex items-center gap-1.5"><BookMarked size={12} /> Texto base</span>
                    <div className="flex gap-1.5">
                      <input value={passage} onChange={(e) => setPassage(e.target.value)} placeholder="Ex.: Hebreus 13:8"
                        className="flex-1 min-w-0 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-teal-500" />
                      <button
                        onClick={() => { setBibleOpen(true); abrirBiblia(passage) }}
                        title="Ler este texto na Bíblia"
                        className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 rounded-md text-white text-sm font-medium transition"
                        style={{ background: AC }}
                      >
                        <BookOpen size={15} /> Ler
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs text-gray-500 font-medium inline-flex items-center gap-1.5"><Layers size={12} /> Série</span>
                    <input value={series} onChange={(e) => setSeries(e.target.value)} placeholder="Ex.: Efésios" list="series-list"
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-teal-500" />
                    <datalist id="series-list">{allSeries.map((s) => <option key={s} value={s} />)}</datalist>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs text-gray-500 font-medium">Data da pregação</span>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-teal-500" />
                  </div>
                </div>

                {/* Ocasião */}
                <div className="flex flex-wrap items-center gap-1.5 no-print">
                  <span className="text-xs text-gray-500 font-medium inline-flex items-center gap-1.5 mr-1"><Tag size={12} /> Ocasião:</span>
                  {[...new Set([...TAG_SUGESTOES, ...tags])].map((t) => (
                    <button key={t} onClick={() => toggleTag(t)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition ${
                        tags.includes(t) ? "bg-teal-600 text-white border-teal-600" : "bg-white text-gray-600 border-gray-300 hover:border-teal-500"
                      }`}>{t}</button>
                  ))}
                </div>

                {/* Histórico de pregações */}
                {(selected.preachedAt?.length ?? 0) > 0 && (
                  <div className="rounded-xl border border-teal-100 bg-teal-50 px-4 py-2.5 no-print">
                    <p className="text-xs text-teal-900">
                      <strong>Já pregado em:</strong>{" "}
                      {[...selected.preachedAt].sort().reverse()
                        .map((d) => new Date(d).toLocaleDateString("pt-BR")).join(" · ")}
                    </p>
                  </div>
                )}

                {/* Já pregou nessa passagem */}
                {previous.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-2.5 no-print">
                    <History size={15} className="text-amber-700 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-amber-900">
                      Você já tem sermão em <strong>{passage}</strong>:{" "}
                      {previous.map((s, i) => (
                        <span key={s.id}>
                          {i > 0 && " · "}
                          <button onClick={() => open(s)} className="underline underline-offset-2 hover:text-amber-950">
                            {s.title}{s.date ? ` (${new Date(s.date).toLocaleDateString("pt-BR")})` : ""}
                          </button>
                        </span>
                      ))}
                    </p>
                  </div>
                )}

                {/* Blocos */}
                <div className="flex flex-col gap-3">
                  {blocks.map((b, i) => {
                    const n = blocks.slice(0, i + 1).filter((x) => x.type === b.type).length
                    return (
                      <div key={b.id} className="rounded-xl border border-gray-200 overflow-hidden">
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200">
                          <span className="text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full text-white" style={{ background: colorOf(b.type) }}>
                            {labelOf(b.type)}{b.type === "ponto" ? ` ${n}` : ""}
                          </span>
                          <div className="ml-auto flex items-center gap-1 no-print">
                            <button onClick={() => move(i, -1)} disabled={i === 0} className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-200 disabled:opacity-30"><ChevronUp size={14} /></button>
                            <button onClick={() => move(i, 1)} disabled={i === blocks.length - 1} className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-200 disabled:opacity-30"><ChevronDown size={14} /></button>
                            <button onClick={() => removeBlock(b.id)} className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={13} /></button>
                          </div>
                        </div>
                        <textarea value={b.text} onChange={(e) => setText(b.id, e.target.value)}
                          onFocus={() => setActiveBlock(b.id)} rows={b.type === "ponto" ? 12 : 7}
                          placeholder={
                            b.type === "introducao" ? "Como você vai abrir? Uma pergunta, um fato, o contexto do texto…"
                            : b.type === "ponto" ? "Afirmação do ponto + explicação do texto…"
                            : b.type === "ilustracao" ? "Uma história, imagem ou exemplo que torna o ponto concreto…"
                            : b.type === "aplicacao" ? "O que a congregação faz com isso durante a semana?"
                            : b.type === "conclusao" ? "Retome a ideia central e aponte para Cristo…"
                            : "Oração final…"
                          }
                          className="w-full px-5 py-4 text-[16px] leading-8 focus:outline-none resize-y" />
                      </div>
                    )
                  })}
                </div>

                <div className="flex flex-wrap items-center gap-2 no-print">
                  <span className="text-xs text-gray-400">Adicionar:</span>
                  {BLOCK_TYPES.map((t) => (
                    <button key={t.type} onClick={() => addBlock(t.type)}
                      className="text-xs px-3 py-1.5 rounded-full border border-gray-300 hover:border-teal-500 hover:text-teal-700 transition">+ {t.label}</button>
                  ))}
                </div>

                {refs.length > 0 && (
                  <div className="border-t border-gray-100 pt-3 no-print">
                    <p className="text-xs text-gray-400 mb-2">Referências citadas — clique para ler na Bíblia</p>
                    <div className="flex flex-wrap gap-1.5">
                      {refs.map((r) => (
                        <button key={r} onClick={() => abrirBiblia(r)}
                          className="text-xs px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-100 hover:bg-teal-100 hover:border-teal-300 transition">
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* ── COLUNA DA BÍBLIA (fixa à direita, não é modal) ── */}
        {bibleOpen ? (
          <div className="w-full lg:w-[420px] xl:w-[480px] flex-shrink-0 no-print">
            <BiblePanel
              initialRef={bibleRef}
              onClose={() => setBibleOpen(false)}
              onInsert={inserirCitacao}
            />
          </div>
        ) : (
          <button
            onClick={() => { setBibleOpen(true); abrirBiblia(passage) }}
            title="Abrir a Bíblia"
            className="hidden xl:flex flex-shrink-0 sticky top-4 h-fit flex-col items-center gap-2 px-3 py-4 rounded-2xl text-white transition hover:opacity-90 no-print"
            style={{ background: AC }}
          >
            <BookOpen size={20} />
            <span className="text-xs font-semibold" style={{ writingMode: "vertical-rl" }}>Bíblia</span>
          </button>
        )}
      </div>

      {/* MODO PÚLPITO */}
      {pulpit && selected && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
          <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-gray-200 px-6 py-3 flex items-center justify-between">
            <div className="min-w-0">
              <p className="font-bold text-gray-900 truncate">{title}</p>
              {passage && <p className="text-sm text-gray-500">{passage}</p>}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-sm text-gray-500 inline-flex items-center gap-1.5"><Clock size={14} /> ≈ {minutes} min</span>
              <button onClick={() => setPulpit(false)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition"><X size={22} /></button>
            </div>
          </div>
          <div className="max-w-3xl mx-auto px-6 py-10 flex flex-col gap-10">
            {blocks.filter((b) => b.text.trim()).map((b) => {
              const n = blocks.slice(0, blocks.indexOf(b) + 1).filter((x) => x.type === b.type).length
              return (
                <section key={b.id}>
                  <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: colorOf(b.type) }}>
                    {labelOf(b.type)}{b.type === "ponto" ? ` ${n}` : ""}
                  </p>
                  <p className="whitespace-pre-wrap text-gray-900" style={{ fontSize: "1.6rem", lineHeight: 1.65 }}>{b.text}</p>
                </section>
              )
            })}
            {blocks.every((b) => !b.text.trim()) && <p className="text-center text-gray-400 py-20">Sermão ainda está vazio.</p>}
          </div>
        </div>
      )}
    </>
  )
}
