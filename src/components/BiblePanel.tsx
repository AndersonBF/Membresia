"use client"

import { useEffect, useState } from "react"
import { X, Search, Loader2, CornerDownLeft, BookOpen, Info, ChevronLeft, ChevronRight } from "lucide-react"
import { BIBLE_VERSIONS } from "@/lib/bible"

type Verse = { verse: number; text: string }
type Result = { version: string; label: string; livre: boolean; verses: Verse[]; erro?: boolean }
type Meta = {
  reference: string
  book: { id: number; name: string }
  chapter: number
  from: number | null
  to: number | null
  full: boolean
}

const AC = "#0f766e"

/**
 * Painel de Bíblia — coluna fixa à direita (não é modal).
 * Acompanha a rolagem e mantém o texto sempre à vista enquanto se escreve.
 */
export default function BiblePanel({
  initialRef,
  onClose,
  onInsert,
}: {
  initialRef?: string
  onClose?: () => void
  onInsert?: (texto: string) => void
}) {
  const [ref, setRef] = useState(initialRef ?? "")
  const [version, setVersion] = useState("almeida")
  const [compare, setCompare] = useState(false)
  const [full, setFull] = useState(true)
  const [results, setResults] = useState<Result[]>([])
  const [meta, setMeta] = useState<Meta | null>(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  // Recarrega sempre que a referência pedida mudar (ex.: clique num chip)
  useEffect(() => {
    if (initialRef?.trim()) {
      setRef(initialRef)
      buscar(initialRef, version, compare, full)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRef])

  async function buscar(r = ref, v = version, c = compare, f = full) {
    if (!r.trim()) return
    setLoading(true); setErro(null)
    try {
      const qs = new URLSearchParams({ ref: r })
      if (c) qs.set("compare", "1"); else qs.set("version", v)
      if (f) qs.set("full", "1")
      const res = await fetch(`/api/pastor/bible?${qs}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erro na busca")
      setResults(data.results ?? [])
      setMeta({ reference: data.reference, book: data.book, chapter: data.chapter, from: data.from, to: data.to, full: data.full })
    } catch (e: any) {
      setErro(e.message); setResults([]); setMeta(null)
    } finally {
      setLoading(false)
    }
  }

  function irCapitulo(delta: number) {
    if (!meta) return
    const novo = meta.chapter + delta
    if (novo < 1) return
    const r = `${meta.book.name} ${novo}`
    setRef(r)
    buscar(r, version, compare, true)
  }

  const destacado = (n: number) =>
    meta?.from != null && n >= meta.from && n <= (meta.to ?? meta.from)

  function textoParaInserir(r: Result) {
    const alvo = meta?.from != null ? r.verses.filter((v) => destacado(v.verse)) : r.verses
    const corpo = alvo.map((v) => `${v.verse}. ${v.text}`).join(" ")
    const rotulo = meta?.from != null
      ? `${meta.book.name} ${meta.chapter}:${meta.from}${meta.to && meta.to !== meta.from ? `-${meta.to}` : ""}`
      : `${meta?.book.name} ${meta?.chapter}`
    return `"${corpo}" (${rotulo}, ${r.label})`
  }

  return (
    <aside className="sticky top-14 rounded-2xl border-2 shadow-sm bg-white flex flex-col overflow-hidden"
      style={{ borderColor: "#99f6e4", height: "calc(100vh - 7rem)" }}>

      {/* Cabeçalho em destaque */}
      <header className="flex items-center gap-2.5 px-4 py-3" style={{ background: AC }}>
        <BookOpen size={19} className="text-white" />
        <h2 className="font-semibold text-white">Bíblia</h2>
        {onClose && (
          <button onClick={onClose} title="Fechar a Bíblia"
            className="ml-auto w-8 h-8 flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/15 transition">
            <X size={18} />
          </button>
        )}
      </header>

      {/* Busca */}
      <div className="px-4 py-3 border-b border-gray-100 flex flex-col gap-2.5">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && buscar()}
              placeholder="Hebreus 13:8 · 1 Co 13 · Salmos 23"
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
            />
          </div>
          <button onClick={() => buscar()} disabled={loading}
            className="px-3.5 rounded-lg text-white text-sm font-medium disabled:opacity-60" style={{ background: AC }}>
            {loading ? <Loader2 size={15} className="animate-spin" /> : "Ler"}
          </button>
        </div>

        <select
          value={version}
          onChange={(e) => { setVersion(e.target.value); setCompare(false); buscar(ref, e.target.value, false, full) }}
          disabled={compare}
          className="text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-teal-500 disabled:opacity-50"
        >
          {BIBLE_VERSIONS.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
        </select>

        <div className="flex items-center gap-3 flex-wrap">
          <label className="inline-flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
            <input type="checkbox" checked={full}
              onChange={(e) => { setFull(e.target.checked); buscar(ref, version, compare, e.target.checked) }} />
            Capítulo inteiro
          </label>
          <label className="inline-flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
            <input type="checkbox" checked={compare}
              onChange={(e) => { setCompare(e.target.checked); buscar(ref, version, e.target.checked, full) }} />
            Comparar versões
          </label>
        </div>
      </div>

      {/* Navegação de capítulo */}
      {meta && results.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 bg-gray-50">
          <button onClick={() => irCapitulo(-1)} disabled={meta.chapter <= 1}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-300 bg-white hover:border-teal-500 disabled:opacity-30 transition">
            <ChevronLeft size={15} />
          </button>
          <p className="text-sm font-semibold text-gray-900 flex-1 truncate">
            {meta.book.name} {meta.chapter}
            {meta.from != null && (
              <span className="text-gray-400 font-normal text-xs">
                {" "}· destaque {meta.from}{meta.to && meta.to !== meta.from ? `-${meta.to}` : ""}
              </span>
            )}
          </p>
          <button onClick={() => irCapitulo(1)}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-300 bg-white hover:border-teal-500 transition">
            <ChevronRight size={15} />
          </button>
        </div>
      )}

      {/* Texto */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
        {erro && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{erro}</p>}

        {!erro && results.length === 0 && !loading && (
          <p className="text-sm text-gray-400 text-center py-10">
            Digite uma referência acima para ler o texto.
          </p>
        )}

        {results.map((r) => (
          <div key={r.version} className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border-b border-gray-200">
              <span className="text-xs font-semibold text-gray-700 truncate">{r.label}</span>
              {!r.livre && (
                <span title="Versão protegida por direitos autorais — uso para estudo pessoal"
                  className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">©</span>
              )}
              {onInsert && r.verses.length > 0 && (
                <button onClick={() => onInsert(textoParaInserir(r))}
                  className="ml-auto inline-flex items-center gap-1 text-xs text-teal-700 hover:text-teal-900 transition flex-shrink-0">
                  <CornerDownLeft size={12} /> Inserir
                </button>
              )}
            </div>
            <div className="px-3 py-2.5">
              {r.erro ? (
                <p className="text-sm text-gray-400 italic">Não foi possível carregar esta versão.</p>
              ) : (
                r.verses.map((v) => (
                  <p key={v.verse}
                    className={`text-[15px] leading-7 ${
                      destacado(v.verse)
                        ? "bg-amber-50 border-l-2 border-amber-400 pl-2 -ml-1 text-gray-900 font-medium"
                        : "text-gray-700"
                    }`}>
                    <sup className="text-teal-700 font-semibold mr-1">{v.verse}</sup>
                    {v.text}
                  </p>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <footer className="px-4 py-2.5 border-t border-gray-100 flex items-start gap-2">
        <Info size={12} className="text-gray-400 mt-0.5 flex-shrink-0" />
        <p className="text-[10px] text-gray-500 leading-relaxed">
          Almeida e KJV são de uso livre. ARA, NVI e NTLH têm direitos autorais — use para estudo pessoal.
        </p>
      </footer>
    </aside>
  )
}
