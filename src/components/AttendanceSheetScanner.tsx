"use client"

// Lê a lista de presença de papel a partir de uma foto e devolve os membros
// reconhecidos. Nada é marcado sem o usuário confirmar na tela de conferência.

import { useRef, useState } from "react"
import { Camera, X, Check, AlertTriangle, Loader2, RotateCcw, UserPlus } from "lucide-react"

export type ScanCandidate = { id: number; name: string }

export type CreatedMember = { id: number; name: string; email: string | null }
export type CreatedVisitor = { id: number; name: string; phone: string | null }

/** O que fazer com um nome que não bateu com ninguém. */
type Disposition = "ignore" | "member" | "visitor"

type ScanMatch = {
  readName: string
  memberId: number
  memberName: string
  score: number
  uncertain: boolean
}

type ScanResult = {
  matches: ScanMatch[]
  unmatched: string[]
  totalRead: number
  /** O usuário pode cadastrar pessoas neste grupo? */
  canCreate: boolean
}

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

export default function AttendanceSheetScanner({
  candidates,
  onApply,
  role,
  classId,
  allowVisitors = true,
  onMembersCreated,
  onVisitorsCreated,
  accentColor = "#b45309",
}: {
  /** Membros da turma/evento com quem os nomes lidos serão comparados */
  candidates: ScanCandidate[]
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
  accentColor?: string
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())

  // Destino de cada nome sem correspondência, por índice.
  const [disposition, setDisposition] = useState<Record<number, Disposition>>({})
  const [saving, setSaving] = useState(false)

  const reset = () => {
    setResult(null)
    setError(null)
    setPreview(null)
    setSelected(new Set())
    setDisposition({})
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
        body: JSON.stringify({ imageBase64: base64, mediaType, candidates, role }),
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
      // Nada é cadastrado sem escolha explícita.
      setDisposition(
        Object.fromEntries((data.unmatched as string[]).map((_, i) => [i, "ignore" as Disposition])),
      )
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

  const pickedFor = (kind: Disposition) =>
    (result?.unmatched ?? []).filter((_, i) => disposition[i] === kind)

  const toCreateAsMember = pickedFor("member")
  const toCreateAsVisitor = pickedFor("visitor")

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

  const apply = async () => {
    setError(null)
    setSaving(true)
    try {
      const presentIds = Array.from(selected)

      if (toCreateAsMember.length > 0) {
        const created = (await createPeople("member", toCreateAsMember)) as CreatedMember[]
        onMembersCreated?.(created)
        // Quem acabou de ser cadastrado estava na folha, então entra presente.
        presentIds.push(...created.map((m) => m.id))
      }

      if (toCreateAsVisitor.length > 0) {
        const created = (await createPeople("visitor", toCreateAsVisitor)) as CreatedVisitor[]
        onVisitorsCreated?.(created)
      }

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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-4 sm:px-6 pt-5 pb-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Camera size={17} style={{ color: accentColor }} /> Ler folha por foto
              </h2>
              <button onClick={close} className="text-gray-400 hover:text-gray-600 transition p-1">
                <X size={18} />
              </button>
            </div>

            <div className="px-4 sm:px-6 py-5 flex flex-col gap-4 overflow-y-auto">
              {!result && (
                <p className="text-sm text-gray-500">
                  Fotografe a lista de presença preenchida. Os nomes reconhecidos
                  serão comparados com os membros e mostrados aqui para você
                  conferir antes de marcar.
                </p>
              )}

              {preview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview}
                  alt="Foto da lista de presença"
                  className="w-full max-h-52 object-contain rounded-lg border border-gray-200 bg-gray-50"
                />
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />

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

              {!loading && !result && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-semibold transition hover:opacity-90"
                  style={{ background: accentColor }}
                >
                  <Camera size={16} /> {preview ? "Escolher outra foto" : "Tirar foto / escolher imagem"}
                </button>
              )}

              {result && (
                <>
                  <div className="text-xs text-gray-500">
                    {result.totalRead} nome{result.totalRead !== 1 ? "s" : ""} lido
                    {result.totalRead !== 1 ? "s" : ""} · {result.matches.length} reconhecido
                    {result.matches.length !== 1 ? "s" : ""} · {selected.size} selecionado
                    {selected.size !== 1 ? "s" : ""}
                  </div>

                  {result.matches.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">
                      Nenhum nome da folha bateu com os membros desta lista.
                    </p>
                  ) : (
                    <div className="border border-gray-200 rounded-xl divide-y divide-gray-50 max-h-64 overflow-y-auto">
                      {result.matches.map((m) => {
                        const checked = selected.has(m.memberId)
                        return (
                          <button
                            key={m.memberId}
                            type="button"
                            onClick={() => toggle(m.memberId)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 transition"
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
                            {m.uncertain && (
                              <span className="flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                <AlertTriangle size={10} /> confira
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {result.unmatched.length > 0 && (
                    <div>
                      <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">
                        Não encontrados no cadastro
                      </div>
                      <p className="text-xs text-gray-400 mb-2">
                        {result.canCreate
                          ? "Quer cadastrar alguém desta lista? Confira a grafia — o nome entra exatamente como está escrito aqui."
                          : "Podem ser visitantes, pessoas de outro grupo ou letra que não deu para ler."}
                      </p>

                      {!result.canCreate ? (
                        <div className="flex flex-wrap gap-1.5">
                          {result.unmatched.map((name, i) => (
                            <span
                              key={`${name}-${i}`}
                              className="text-xs bg-gray-50 border border-gray-200 text-gray-600 rounded-full px-2.5 py-1"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      ) : (
                      <div className="border border-gray-200 rounded-xl divide-y divide-gray-50 max-h-56 overflow-y-auto">
                        {result.unmatched.map((name, i) => {
                          const current = disposition[i] ?? "ignore"
                          const options: { key: Disposition; label: string }[] = [
                            { key: "ignore", label: "Ignorar" },
                            { key: "member", label: "Membro" },
                            ...(allowVisitors ? [{ key: "visitor" as Disposition, label: "Visitante" }] : []),
                          ]
                          return (
                            <div key={`${name}-${i}`} className="px-3 py-2.5">
                              <p className="text-sm text-gray-800 break-words mb-1.5">{name}</p>
                              <div className="flex flex-wrap gap-1.5">
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
                            </div>
                          )
                        })}
                      </div>
                      )}

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
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={reset}
                      disabled={saving}
                      className="flex-1 inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-600 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                    >
                      <RotateCcw size={14} /> Outra foto
                    </button>
                    <button
                      type="button"
                      onClick={apply}
                      disabled={
                        saving ||
                        (selected.size === 0 &&
                          toCreateAsMember.length === 0 &&
                          toCreateAsVisitor.length === 0)
                      }
                      style={{ background: accentColor }}
                      className="flex-1 inline-flex items-center justify-center gap-2 text-white text-sm font-medium py-2.5 rounded-lg hover:opacity-90 transition disabled:opacity-50"
                    >
                      {saving && <Loader2 size={14} className="animate-spin" />}
                      {saving
                        ? "Salvando…"
                        : `Confirmar (${selected.size + toCreateAsMember.length} presente${
                            selected.size + toCreateAsMember.length !== 1 ? "s" : ""
                          })`}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
