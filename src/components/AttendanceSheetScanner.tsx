"use client"

// Lê a lista de presença de papel a partir de uma foto e devolve os membros
// reconhecidos. Nada é marcado sem o usuário confirmar na tela de conferência.

import { useRef, useState } from "react"
import {
  Camera, X, Check, AlertTriangle, Loader2, RotateCcw, UserPlus, Pencil, Link2, Eye, EyeOff,
} from "lucide-react"

export type ScanCandidate = { id: number; name: string }

export type CreatedMember = { id: number; name: string; email: string | null }
export type CreatedVisitor = { id: number; name: string; phone: string | null }

/** O que fazer com um nome que não bateu com ninguém. */
type Disposition = "ignore" | "member" | "visitor" | "link"

/** Alvo do vínculo, no formato "member:12" / "visitor:3". */
type LinkTarget = string

const linkValue = (kind: "member" | "visitor", id: number): LinkTarget => `${kind}:${id}`
const parseLink = (value: LinkTarget) => {
  const [kind, id] = value.split(":")
  return { kind: kind as "member" | "visitor", id: Number(id) }
}

type ScanMatch = {
  readName: string
  memberId: number
  memberName: string
  score: number
  uncertain: boolean
  /** Veio de um vínculo que o usuário já ensinou, não da semelhança. */
  viaAlias?: boolean
}

type ScanVisitorMatch = {
  readName: string
  visitorId: number
  visitorName: string
}

type ScanResult = {
  matches: ScanMatch[]
  visitorMatches?: ScanVisitorMatch[]
  unmatched: string[]
  totalRead: number
  /** Onde cada nome lido está na foto: [ymin, xmin, ymax, xmax] em 0..1000. */
  boxes?: Record<string, number[]>
  /** O usuário pode cadastrar pessoas neste grupo? */
  canCreate: boolean
}

/** Vínculo nome-da-folha → pessoa, para a leitura da próxima vez. */
type AliasInput = { readName: string; memberId?: number; visitorId?: number }

/** Opus 4.8 lê imagens até 2576px no lado maior — acima disso é só custo. */
const MAX_EDGE = 2576

/** Redimensiona e recomprime no navegador antes de enviar. */
async function prepareImage(file: File): Promise<{ base64: string; mediaType: string }> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Não foi possível processar a imagem.")
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close?.()

  const dataUrl = canvas.toDataURL("image/jpeg", 0.9)
  return { base64: dataUrl.split(",")[1], mediaType: "image/jpeg" }
}

/** Folga em volta da linha, em milésimos, para ela não sair colada na borda. */
const CROP_PAD_Y = 8
const CROP_PAD_X = 15

/** Recorte com folga, em milésimos da imagem. */
function padded(box: number[]) {
  const [ymin, xmin, ymax, xmax] = box
  const y0 = Math.max(0, ymin - CROP_PAD_Y)
  const y1 = Math.min(1000, ymax + CROP_PAD_Y)
  const x0 = Math.max(0, xmin - CROP_PAD_X)
  const x1 = Math.min(1000, xmax + CROP_PAD_X)
  return { x0, y0, w: Math.max(1, x1 - x0), h: Math.max(1, y1 - y0) }
}

/**
 * A faixa da foto onde aquele nome foi escrito. Tudo em milésimos da imagem,
 * então não precisamos saber a resolução: a foto inteira é usada como fundo,
 * ampliada até que só o recorte apareça.
 */
function SheetCrop({
  photo,
  box,
  onClick,
}: {
  photo: string
  box: number[]
  onClick?: () => void
}) {
  const { x0, y0, w, h } = padded(box)
  return (
    <button
      type="button"
      onClick={onClick}
      title="Ver na foto inteira"
      className="w-full block rounded-md border border-gray-200 bg-gray-100 bg-no-repeat hover:border-gray-400 transition"
      style={{
        backgroundImage: `url(${photo})`,
        backgroundSize: `${(1000 / w) * 100}% ${(1000 / h) * 100}%`,
        // Em porcentagem, 100% alinha a borda direita/inferior do recorte —
        // por isso a divisão é pelo espaço que sobra, não pela imagem toda.
        backgroundPosition: `${w < 1000 ? (x0 / (1000 - w)) * 100 : 0}% ${
          h < 1000 ? (y0 / (1000 - h)) * 100 : 0
        }%`,
        aspectRatio: `${w} / ${h}`,
      }}
    />
  )
}

export default function AttendanceSheetScanner({
  candidates,
  visitorCandidates = [],
  onApply,
  role,
  classId,
  allowVisitors = true,
  onMembersCreated,
  onVisitorsCreated,
  onVisitorsLinked,
  accentColor = "#b45309",
}: {
  /** Membros da turma/evento com quem os nomes lidos serão comparados */
  candidates: ScanCandidate[]
  /** Visitantes já cadastrados no grupo, para vincular um nome da folha */
  visitorCandidates?: ScanCandidate[]
  /** Recebe os ids confirmados para marcar como presentes */
  onApply: (memberIds: number[]) => void
  /** Grupo de onde partiu a chamada — define onde os novos cadastros entram */
  role: string
  /** Turma da EBD, quando a chamada é de uma turma */
  classId?: number
  /** Grupos sem visitantes (diaconia) só oferecem "membro" */
  allowVisitors?: boolean
  /** Novos membros criados — já entram na chamada como presentes */
  onMembersCreated?: (members: CreatedMember[]) => void
  /** Novos visitantes criados */
  onVisitorsCreated?: (visitors: CreatedVisitor[]) => void
  /** Visitantes já cadastrados que o usuário vinculou a nomes da folha */
  onVisitorsLinked?: (visitorIds: number[]) => void
  accentColor?: string
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  // Visitantes reconhecidos por vínculo já ensinado.
  const [selectedVisitors, setSelectedVisitors] = useState<Set<number>>(new Set())
  // No celular, a faixa da folha aparece dentro de cada linha da lista.
  const [compare, setCompare] = useState(true)
  // Linha em foco: destacada na foto grande da coluna da esquerda.
  const [focus, setFocus] = useState<{ box: number[]; label: string } | null>(null)
  // Foto em tela cheia.
  const [lightbox, setLightbox] = useState(false)

  // Destino de cada nome sem correspondência, por índice.
  const [disposition, setDisposition] = useState<Record<number, Disposition>>({})
  // Nome corrigido pelo usuário — é ele que vai para o cadastro.
  const [editedNames, setEditedNames] = useState<Record<number, string>>({})
  // Quais linhas estão com o campo de edição aberto.
  const [editing, setEditing] = useState<Record<number, boolean>>({})
  // Pessoa já cadastrada escolhida para o vínculo, por índice.
  const [linkTarget, setLinkTarget] = useState<Record<number, LinkTarget>>({})
  const [saving, setSaving] = useState(false)

  const reset = () => {
    setResult(null)
    setError(null)
    setPreview(null)
    setSelected(new Set())
    setSelectedVisitors(new Set())
    setFocus(null)
    setLightbox(false)
    setDisposition({})
    setEditedNames({})
    setEditing({})
    setLinkTarget({})
    if (fileRef.current) fileRef.current.value = ""
  }

  const close = () => {
    setOpen(false)
    reset()
  }

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setError(null)
    setResult(null)
    setLoading(true)
    try {
      const { base64, mediaType } = await prepareImage(file)
      setPreview(`data:${mediaType};base64,${base64}`)

      const res = await fetch("/api/attendance/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          mediaType,
          candidates,
          visitorCandidates,
          role,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Não foi possível ler a lista.")
        return
      }
      setResult(data)
      // Sugestões confiantes já vêm marcadas; as duvidosas ficam para o usuário.
      setSelected(
        new Set(
          (data.matches as ScanMatch[])
            .filter((m) => !m.uncertain)
            .map((m) => m.memberId),
        ),
      )
      // Visitante reconhecido por vínculo já foi confirmado um dia — entra marcado.
      setSelectedVisitors(
        new Set(((data.visitorMatches ?? []) as ScanVisitorMatch[]).map((v) => v.visitorId)),
      )
      // Nada é cadastrado sem escolha explícita.
      setDisposition(
        Object.fromEntries((data.unmatched as string[]).map((_, i) => [i, "ignore" as Disposition])),
      )
      // O nome começa exatamente como veio da folha; o usuário pode corrigir.
      setEditedNames(Object.fromEntries((data.unmatched as string[]).map((n, i) => [i, n])))
      setEditing({})
      setLinkTarget({})
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao processar a imagem.")
    } finally {
      setLoading(false)
    }
  }

  const toggle = (memberId: number) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(memberId)) next.delete(memberId)
      else next.add(memberId)
      return next
    })

  const toggleVisitor = (visitorId: number) =>
    setSelectedVisitors((prev) => {
      const next = new Set(prev)
      if (next.has(visitorId)) next.delete(visitorId)
      else next.add(visitorId)
      return next
    })

  /** Nome que será usado — o corrigido, quando houver. */
  const nameAt = (i: number) => (editedNames[i] ?? result?.unmatched[i] ?? "").trim()

  /** Grafia da folha que originou um cadastro — o usuário pode ter corrigido. */
  const rawNameFor = (finalName: string) =>
    (result?.unmatched ?? []).find((_, i) => nameAt(i) === finalName.trim())

  const pickedFor = (kind: Disposition) =>
    (result?.unmatched ?? [])
      .map((_, i) => i)
      .filter((i) => disposition[i] === kind && nameAt(i).length >= 2)
      .map(nameAt)

  const toCreateAsMember = pickedFor("member")
  const toCreateAsVisitor = pickedFor("visitor")

  // Vínculos com quem já está cadastrado: nada é criado, só marcado.
  const links = (result?.unmatched ?? [])
    .map((_, i) => (disposition[i] === "link" ? linkTarget[i] : undefined))
    .filter((v): v is LinkTarget => !!v)
    .map(parseLink)

  const linkedMemberIds = Array.from(
    new Set(links.filter((l) => l.kind === "member").map((l) => l.id)),
  )
  const linkedVisitorIds = Array.from(
    new Set(links.filter((l) => l.kind === "visitor").map((l) => l.id)),
  )

  const boxes = result?.boxes ?? {}
  const boxFor = (readName: string) => boxes[readName.trim()]
  // Sem coordenadas do modelo não há o que comparar linha a linha.
  const hasBoxes = Object.keys(boxes).length > 0

  /**
   * Passar o mouse (ou tocar) numa linha destaca o trecho dela na foto grande.
   * Sem coordenadas não há o que destacar — o foco fica onde estava.
   */
  const focusProps = (readName: string) => {
    const box = boxFor(readName)
    if (!box) return {}
    return {
      onMouseEnter: () => setFocus({ box, label: readName }),
      onFocus: () => setFocus({ box, label: readName }),
    }
  }

  /**
   * A faixa da folha dentro da própria linha. Serve para telas estreitas, onde
   * a foto fica no topo e longe da lista; no desktop a coluna da esquerda já
   * mostra o destaque, então a faixa some.
   */
  const crop = (readName: string) => {
    const box = boxFor(readName)
    if (!compare || !box || !preview) return null
    return (
      <div className="mt-1.5 lg:hidden">
        <SheetCrop
          photo={preview}
          box={box}
          onClick={() => {
            setFocus({ box, label: readName })
            setLightbox(true)
          }}
        />
      </div>
    )
  }

  const visitorMatches = result?.visitorMatches ?? []
  // Visitantes que vão para a chamada: os reconhecidos por vínculo antigo mais
  // os que o usuário vinculou agora.
  const visitorsToMark = Array.from(new Set([...selectedVisitors, ...linkedVisitorIds]))

  // Um membro vinculado que já estava selecionado não conta duas vezes.
  const presentCount =
    new Set([...selected, ...linkedMemberIds]).size + toCreateAsMember.length

  /** Cadastra os nomes escolhidos e devolve os ids dos novos membros. */
  const createPeople = async (kind: "member" | "visitor", names: string[]) => {
    const res = await fetch("/api/attendance/people", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, names, role, classId }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "Não foi possível cadastrar.")
    return data.created as { id: number; name: string }[]
  }

  /**
   * Guarda o que o usuário acabou de ensinar. É complementar: se falhar, a
   * chamada continua valendo — só a próxima leitura não virá adiantada.
   */
  const rememberAliases = async (aliases: AliasInput[]) => {
    if (aliases.length === 0) return
    try {
      await fetch("/api/attendance/aliases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, aliases }),
      })
    } catch {
      // silencioso de propósito
    }
  }

  const apply = async () => {
    setError(null)
    setSaving(true)
    try {
      const present = new Set(selected)
      linkedMemberIds.forEach((id) => present.add(id))
      const presentIds = Array.from(present)

      // Tudo que o usuário identificou nesta folha vira memória para a próxima.
      const aliases: AliasInput[] = []

      // 1. Vínculos explícitos com quem já está cadastrado.
      ;(result?.unmatched ?? []).forEach((raw, i) => {
        const target = disposition[i] === "link" ? linkTarget[i] : undefined
        if (!target) return
        const { kind, id } = parseLink(target)
        aliases.push({ readName: raw, ...(kind === "member" ? { memberId: id } : { visitorId: id }) })
      })

      // 2. Sugestões duvidosas que ele conferiu e deixou marcadas.
      ;(result?.matches ?? []).forEach((m) => {
        if (m.uncertain && selected.has(m.memberId)) {
          aliases.push({ readName: m.readName, memberId: m.memberId })
        }
      })

      if (visitorsToMark.length > 0) onVisitorsLinked?.(visitorsToMark)

      if (toCreateAsMember.length > 0) {
        const created = (await createPeople("member", toCreateAsMember)) as CreatedMember[]
        onMembersCreated?.(created)
        // Quem acabou de ser cadastrado estava na folha, então entra presente.
        presentIds.push(...created.map((m) => m.id))
        // 3. Cadastro novo: a grafia da folha aponta para o registro criado,
        //    mesmo quando o nome foi corrigido na tela.
        created.forEach((m) => {
          const raw = rawNameFor(m.name)
          if (raw) aliases.push({ readName: raw, memberId: m.id })
        })
      }

      if (toCreateAsVisitor.length > 0) {
        const created = (await createPeople("visitor", toCreateAsVisitor)) as CreatedVisitor[]
        onVisitorsCreated?.(created)
        created.forEach((v) => {
          const raw = rawNameFor(v.name)
          if (raw) aliases.push({ readName: raw, visitorId: v.id })
        })
      }

      if (result?.canCreate) await rememberAliases(aliases)

      onApply(presentIds)
      close()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível cadastrar.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white transition hover:opacity-90"
        style={{ background: accentColor }}
      >
        <Camera size={15} className="flex-shrink-0" />
        <span className="whitespace-nowrap">Ler folha por foto</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 sm:px-6 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Camera size={17} style={{ color: accentColor }} /> Ler folha por foto
              </h2>
              <button onClick={close} className="text-gray-400 hover:text-gray-600 transition p-1">
                <X size={18} />
              </button>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />

            {/* Antes da leitura o modal não precisa da largura toda. */}
            {!result && (
              <div className="px-4 sm:px-6 py-6 flex flex-col gap-4 overflow-y-auto w-full max-w-md mx-auto">
                <p className="text-sm text-gray-500">
                  Fotografe a lista de presença preenchida. Os nomes reconhecidos
                  serão comparados com os membros e mostrados ao lado da foto,
                  para você conferir antes de marcar.
                </p>

                {preview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={preview}
                    alt="Foto da lista de presença"
                    className="w-full max-h-52 object-contain rounded-lg border border-gray-200 bg-gray-50"
                  />
                )}

                {loading && (
                  <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
                    <Loader2 size={16} className="animate-spin" /> Lendo a folha…
                  </div>
                )}

                {error && (
                  <p className="text-sm rounded-lg px-3 py-2.5 bg-red-50 text-red-700 border border-red-100">
                    {error}
                  </p>
                )}

                {!loading && (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-semibold transition hover:opacity-90"
                    style={{ background: accentColor }}
                  >
                    <Camera size={16} />{" "}
                    {preview ? "Escolher outra foto" : "Tirar foto / escolher imagem"}
                  </button>
                )}
              </div>
            )}

            {result && (
              <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
                {/* ── Coluna da folha ─────────────────────────────────── */}
                <div className="flex-shrink-0 lg:w-[40%] lg:max-w-[440px] bg-gray-50 border-b lg:border-b-0 lg:border-r border-gray-100 px-4 py-4 flex flex-col gap-3 lg:overflow-y-auto">
                  {preview && (
                    <button
                      type="button"
                      onClick={() => setLightbox(true)}
                      title="Abrir a foto em tela cheia"
                      className="relative block self-center max-w-full rounded-lg overflow-hidden border border-gray-200 bg-white"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={preview}
                        alt="Foto da lista de presença"
                        className="block max-h-[26vh] lg:max-h-[52vh] w-auto max-w-full"
                      />
                      {focus && (
                        <span
                          className="absolute border-2 rounded-sm pointer-events-none transition-all"
                          style={{
                            borderColor: accentColor,
                            boxShadow: "0 0 0 9999px rgba(15,23,42,0.42)",
                            left: `${focus.box[1] / 10}%`,
                            top: `${focus.box[0] / 10}%`,
                            width: `${(focus.box[3] - focus.box[1]) / 10}%`,
                            height: `${(focus.box[2] - focus.box[0]) / 10}%`,
                          }}
                        />
                      )}
                    </button>
                  )}

                  {/* A linha em foco, ampliada, logo abaixo da folha. */}
                  {preview && hasBoxes && (
                    <div className="hidden lg:block">
                      {focus ? (
                        <>
                          <SheetCrop
                            photo={preview}
                            box={focus.box}
                            onClick={() => setLightbox(true)}
                          />
                          <p className="text-xs text-gray-500 mt-1.5 truncate">
                            folha: “{focus.label}”
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-gray-400 leading-relaxed">
                          Passe o mouse por um nome ao lado para ver, aqui, o trecho
                          exato da folha em que ele foi lido.
                        </p>
                      )}
                    </div>
                  )}

                  <div className="text-xs text-gray-500 lg:mt-auto">
                    {result.totalRead} nome{result.totalRead !== 1 ? "s" : ""} lido
                    {result.totalRead !== 1 ? "s" : ""} ·{" "}
                    {result.matches.length + visitorMatches.length} reconhecido
                    {result.matches.length + visitorMatches.length !== 1 ? "s" : ""} ·{" "}
                    {selected.size + selectedVisitors.size} selecionado
                    {selected.size + selectedVisitors.size !== 1 ? "s" : ""}
                  </div>

                  {hasBoxes && (
                    <button
                      type="button"
                      onClick={() => setCompare((v) => !v)}
                      className="lg:hidden self-start inline-flex items-center gap-1.5 text-xs font-medium border border-gray-200 bg-white rounded-full px-2.5 py-1 text-gray-600 hover:bg-gray-50 transition"
                    >
                      {compare ? <EyeOff size={12} /> : <Eye size={12} />}
                      {compare ? "Ocultar trecho da folha" : "Comparar com a folha"}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={reset}
                    disabled={saving}
                    className="hidden lg:inline-flex items-center justify-center gap-2 border border-gray-200 bg-white text-gray-600 text-sm font-medium py-2 rounded-lg hover:bg-gray-100 transition disabled:opacity-50 flex-shrink-0"
                  >
                    <RotateCcw size={14} /> Outra foto
                  </button>
                </div>

                {/* ── Coluna da conferência ───────────────────────────── */}
                <div className="flex-1 min-h-0 flex flex-col">
                  <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-5 py-4 flex flex-col gap-4">
                  {result.matches.length === 0 && visitorMatches.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-6">
                      Nenhum nome da folha bateu com os membros desta lista.
                    </p>
                  )}

                  {result.matches.length > 0 && (
                    <div>
                      <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">
                        Reconhecidos
                      </div>
                      <div className="border border-gray-200 rounded-xl divide-y divide-gray-50">
                      {result.matches.map((m) => {
                        const checked = selected.has(m.memberId)
                        return (
                          <div
                            key={m.memberId}
                            className="px-3 py-2.5 hover:bg-gray-50 transition"
                            {...focusProps(m.readName)}
                          >
                          <button
                            type="button"
                            onClick={() => toggle(m.memberId)}
                            className="w-full flex items-center gap-3 text-left transition"
                          >
                            <span
                              className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border transition"
                              style={
                                checked
                                  ? { background: accentColor, borderColor: accentColor }
                                  : { background: "#fff", borderColor: "#d1d5db" }
                              }
                            >
                              {checked && <Check size={12} className="text-white" strokeWidth={3} />}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-medium text-gray-800 truncate">
                                {m.memberName}
                              </span>
                              <span className="block text-xs text-gray-400 truncate">
                                folha: “{m.readName}”
                              </span>
                            </span>
                            {m.viaAlias && (
                              <span className="flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                <Link2 size={10} /> vínculo salvo
                              </span>
                            )}
                            {m.uncertain && (
                              <span className="flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                <AlertTriangle size={10} /> confira
                              </span>
                            )}
                          </button>
                          {crop(m.readName)}
                          </div>
                        )
                      })}
                      </div>
                    </div>
                  )}

                  {visitorMatches.length > 0 && (
                    <div>
                      <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">
                        Visitantes reconhecidos
                      </div>
                      <div className="border border-gray-200 rounded-xl divide-y divide-gray-50">
                        {visitorMatches.map((v) => {
                          const checked = selectedVisitors.has(v.visitorId)
                          return (
                            <div
                              key={v.visitorId}
                              className="px-3 py-2.5 hover:bg-gray-50 transition"
                              {...focusProps(v.readName)}
                            >
                            <button
                              type="button"
                              onClick={() => toggleVisitor(v.visitorId)}
                              className="w-full flex items-center gap-3 text-left transition"
                            >
                              <span
                                className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border transition"
                                style={
                                  checked
                                    ? { background: accentColor, borderColor: accentColor }
                                    : { background: "#fff", borderColor: "#d1d5db" }
                                }
                              >
                                {checked && <Check size={12} className="text-white" strokeWidth={3} />}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-sm font-medium text-gray-800 truncate">
                                  {v.visitorName}
                                </span>
                                <span className="block text-xs text-gray-400 truncate">
                                  folha: “{v.readName}”
                                </span>
                              </span>
                              <span className="flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                                visitante
                              </span>
                            </button>
                            {crop(v.readName)}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {result.unmatched.length > 0 && (
                    <div>
                      <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">
                        Não encontrados no cadastro
                      </div>
                      <p className="text-xs text-gray-400 mb-2">
                        {result.canCreate
                          ? "Cadastre como novo (use “Alterar” para corrigir a grafia — o nome entra exatamente como está escrito aqui) ou vincule a quem já está cadastrado."
                          : "Vincule a quem já está cadastrado, ou deixe de lado: podem ser pessoas de outro grupo ou letra que não deu para ler."}
                      </p>

                      <div className="border border-gray-200 rounded-xl divide-y divide-gray-50">
                        {result.unmatched.map((name, i) => {
                          const current = disposition[i] ?? "ignore"
                          const value = editedNames[i] ?? name
                          const edited = value.trim() !== name.trim()
                          const canLink = candidates.length > 0 || visitorCandidates.length > 0
                          const options: { key: Disposition; label: string }[] = [
                            { key: "ignore", label: "Ignorar" },
                            ...(result.canCreate
                              ? [
                                  { key: "member" as Disposition, label: "Novo membro" },
                                  ...(allowVisitors
                                    ? [{ key: "visitor" as Disposition, label: "Novo visitante" }]
                                    : []),
                                ]
                              : []),
                            ...(canLink ? [{ key: "link" as Disposition, label: "Já cadastrado" }] : []),
                          ]
                          const creating = current === "member" || current === "visitor"
                          return (
                            <div
                              key={`${name}-${i}`}
                              className="px-3 py-2.5 hover:bg-gray-50 transition"
                              {...focusProps(name)}
                            >
                              {editing[i] ? (
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <input
                                    autoFocus
                                    value={value}
                                    onChange={(e) =>
                                      setEditedNames((prev) => ({ ...prev, [i]: e.target.value }))
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === "Escape") {
                                        e.preventDefault()
                                        if (e.key === "Escape") {
                                          setEditedNames((prev) => ({ ...prev, [i]: name }))
                                        }
                                        setEditing((prev) => ({ ...prev, [i]: false }))
                                      }
                                    }}
                                    className="min-w-0 flex-1 text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2"
                                    style={{ borderColor: accentColor }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setEditing((prev) => ({ ...prev, [i]: false }))}
                                    className="flex-shrink-0 text-xs font-medium px-2.5 py-1.5 rounded-lg text-white"
                                    style={{ background: accentColor }}
                                  >
                                    Pronto
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-start gap-2 mb-1.5">
                                  <span className="min-w-0 flex-1">
                                    <span className="block text-sm text-gray-800 break-words">
                                      {value.trim() || name}
                                    </span>
                                    {edited && (
                                      <span className="block text-xs text-gray-400 truncate">
                                        folha: “{name}”
                                      </span>
                                    )}
                                  </span>
                                  {result.canCreate && (
                                    <button
                                      type="button"
                                      onClick={() => setEditing((prev) => ({ ...prev, [i]: true }))}
                                      className="flex-shrink-0 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded-full px-2 py-0.5 transition"
                                    >
                                      <Pencil size={11} /> Alterar
                                    </button>
                                  )}
                                </div>
                              )}

                              {crop(name)}

                              <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {options.map((opt) => {
                                  const active = current === opt.key
                                  return (
                                    <button
                                      key={opt.key}
                                      type="button"
                                      onClick={() =>
                                        setDisposition((prev) => ({ ...prev, [i]: opt.key }))
                                      }
                                      className="text-xs font-medium px-2.5 py-1 rounded-full border transition"
                                      style={
                                        active
                                          ? { background: accentColor, borderColor: accentColor, color: "#fff" }
                                          : { background: "#fff", borderColor: "#e5e7eb", color: "#6b7280" }
                                      }
                                    >
                                      {opt.label}
                                    </button>
                                  )
                                })}
                              </div>

                              {current === "link" && (
                                <div className="mt-2 flex items-center gap-1.5">
                                  <Link2 size={13} className="flex-shrink-0 text-gray-400" />
                                  <select
                                    value={linkTarget[i] ?? ""}
                                    onChange={(e) =>
                                      setLinkTarget((prev) => ({ ...prev, [i]: e.target.value }))
                                    }
                                    className="min-w-0 flex-1 text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2"
                                  >
                                    <option value="">Escolha quem é…</option>
                                    {candidates.length > 0 && (
                                      <optgroup label="Membros">
                                        {candidates.map((c) => (
                                          <option key={`m-${c.id}`} value={linkValue("member", c.id)}>
                                            {c.name}
                                          </option>
                                        ))}
                                      </optgroup>
                                    )}
                                    {visitorCandidates.length > 0 && (
                                      <optgroup label="Visitantes">
                                        {visitorCandidates.map((v) => (
                                          <option key={`v-${v.id}`} value={linkValue("visitor", v.id)}>
                                            {v.name}
                                          </option>
                                        ))}
                                      </optgroup>
                                    )}
                                  </select>
                                </div>
                              )}

                              {creating && nameAt(i).length < 2 && (
                                <p className="mt-1.5 text-xs text-red-600">
                                  Escreva o nome para cadastrar.
                                </p>
                              )}
                            </div>
                          )
                        })}
                      </div>

                      {(toCreateAsMember.length > 0 || toCreateAsVisitor.length > 0) && (
                        <p className="text-xs text-gray-500 mt-2 flex items-start gap-1.5">
                          <UserPlus size={13} className="mt-0.5 flex-shrink-0" style={{ color: accentColor }} />
                          <span>
                            Ao confirmar, {toCreateAsMember.length > 0 && (
                              <>
                                <strong>{toCreateAsMember.length}</strong> {toCreateAsMember.length === 1 ? "novo membro" : "novos membros"}
                                {" "}será{toCreateAsMember.length === 1 ? "" : "ão"} cadastrado
                                {toCreateAsMember.length === 1 ? "" : "s"} e marcado
                                {toCreateAsMember.length === 1 ? "" : "s"} como presente
                                {toCreateAsMember.length === 1 ? "" : "s"}
                              </>
                            )}
                            {toCreateAsMember.length > 0 && toCreateAsVisitor.length > 0 && "; "}
                            {toCreateAsVisitor.length > 0 && (
                              <>
                                <strong>{toCreateAsVisitor.length}</strong>{" "}
                                {toCreateAsVisitor.length === 1 ? "visitante" : "visitantes"} entrará
                                {toCreateAsVisitor.length === 1 ? "" : "ão"} na lista de visitantes do grupo
                              </>
                            )}
                            .
                          </span>
                        </p>
                      )}

                      {(linkedMemberIds.length > 0 || linkedVisitorIds.length > 0) && (
                        <p className="text-xs text-gray-500 mt-2 flex items-start gap-1.5">
                          <Link2 size={13} className="mt-0.5 flex-shrink-0" style={{ color: accentColor }} />
                          <span>
                            <strong>{linkedMemberIds.length + linkedVisitorIds.length}</strong>{" "}
                            {linkedMemberIds.length + linkedVisitorIds.length === 1
                              ? "pessoa já cadastrada será marcada"
                              : "pessoas já cadastradas serão marcadas"}{" "}
                            como presente
                            {linkedMemberIds.length + linkedVisitorIds.length === 1 ? "" : "s"} — nada
                            novo é cadastrado. O vínculo fica salvo: na próxima folha esse nome já
                            vem reconhecido.
                          </span>
                        </p>
                      )}
                    </div>
                  )}

                  </div>

                  {/* Barra de ação fixa no pé da coluna. */}
                  <div className="flex-shrink-0 border-t border-gray-100 px-4 sm:px-5 py-3 flex flex-col gap-2">
                    {error && (
                      <p className="text-sm rounded-lg px-3 py-2.5 bg-red-50 text-red-700 border border-red-100">
                        {error}
                      </p>
                    )}
                    <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={reset}
                      disabled={saving}
                      className="lg:hidden flex-1 inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-600 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                    >
                      <RotateCcw size={14} /> Outra foto
                    </button>
                    <button
                      type="button"
                      onClick={apply}
                      disabled={
                        saving ||
                        (presentCount === 0 &&
                          toCreateAsVisitor.length === 0 &&
                          visitorsToMark.length === 0)
                      }
                      style={{ background: accentColor }}
                      className="flex-1 inline-flex items-center justify-center gap-2 text-white text-sm font-medium py-2.5 rounded-lg hover:opacity-90 transition disabled:opacity-50"
                    >
                      {saving && <Loader2 size={14} className="animate-spin" />}
                      {saving
                        ? "Salvando…"
                        : `Confirmar (${presentCount} presente${presentCount !== 1 ? "s" : ""})`}
                    </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Foto inteira com a linha destacada, para conferir no contexto da folha. */}
          {lightbox && preview && (
            <div
              className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-3 p-4"
              style={{ background: "rgba(0,0,0,0.82)" }}
              onClick={() => setLightbox(false)}
            >
              <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Foto da lista de presença"
                  className="max-h-[78vh] max-w-full rounded-lg block"
                />
                {focus && (
                  <span
                    className="absolute border-2 rounded-sm pointer-events-none"
                    style={{
                      borderColor: accentColor,
                      boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)",
                      left: `${focus.box[1] / 10}%`,
                      top: `${focus.box[0] / 10}%`,
                      width: `${(focus.box[3] - focus.box[1]) / 10}%`,
                      height: `${(focus.box[2] - focus.box[0]) / 10}%`,
                    }}
                  />
                )}
              </div>
              <p className="text-white text-sm text-center max-w-md">
                {focus ? `folha: “${focus.label}”` : "Foto da lista"}
                <span className="block text-white/60 text-xs mt-1">Toque para fechar</span>
              </p>
            </div>
          )}
        </div>
      )}
    </>
  )
}
