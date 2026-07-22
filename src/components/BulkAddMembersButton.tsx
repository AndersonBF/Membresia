"use client"

import { useCallback, useMemo, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"
import { ChevronDown, ClipboardList, Loader2, X } from "lucide-react"
import Kbd from "@/components/Kbd"
import { useHotkey } from "@/hooks/useHotkey"

interface Item {
  id: number
  name: string
}

interface Props {
  /** Grupo de destino. Ausente = cadastro global (lista geral de membros). */
  role?: string
  label?: string
  /** Ministérios ou classes — quando o grupo tem vários destinos */
  targets?: Item[]
  /** Rótulo do destino: "Ministério" | "Classe" */
  targetLabel?: string
  /** Tecla de atalho que abre o modal */
  shortcutKey?: string
}

export type ParsedPerson = { name: string; phone: string | null; email: string | null }

/**
 * Converte o texto colado em pessoas.
 *
 * - Um registro por linha. Se não houver quebra de linha, aceita vírgula
 *   como separador (caso comum de "João, Maria, Pedro").
 * - Dentro da linha, TAB ou ";" separam campos: Nome; telefone; e-mail.
 *   Vírgula não é separador de campo — nomes costumam ter "Silva, João".
 * - Numeração de lista ("1.", "1)", "-", "•") é descartada.
 */
export function parseNames(text: string): ParsedPerson[] {
  const hasLines = /\r?\n/.test(text.trim())
  const records = hasLines ? text.split(/\r?\n/) : text.split(",")

  const out: ParsedPerson[] = []
  const seen = new Set<string>()

  for (const record of records) {
    const fields = record.split(/[\t;]/).map((f) => f.trim())
    let name = (fields[0] ?? "")
      .replace(/^\s*(?:\d+\s*[.)\-–]\s*|[-–•*]\s+)/, "") // "1." / "1)" / "- " / "• "
      .replace(/\s+/g, " ")
      .trim()

    if (!name) continue

    const key = name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)

    const rest = fields.slice(1).filter(Boolean)
    const email = rest.find((f) => f.includes("@")) ?? null
    const phone = rest.find((f) => f !== email && /\d/.test(f)) ?? null

    out.push({ name, phone, email })
  }

  return out
}

export default function BulkAddMembersButton({
  role,
  label,
  targets,
  targetLabel,
  shortcutKey = "l",
}: Props) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState("")
  const [targetId, setTargetId] = useState<number | "">("")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const areaRef = useRef<HTMLTextAreaElement>(null)

  const needsTarget = !!targets && targets.length > 0
  const people = useMemo(() => parseNames(text), [text])

  const handleOpen = useCallback(() => {
    setOpen(true)
    setText("")
    setTargetId(needsTarget && targets!.length === 1 ? targets![0].id : "")
    setTimeout(() => areaRef.current?.focus(), 50)
  }, [needsTarget, targets])

  const handleClose = useCallback(() => {
    setOpen(false)
    setText("")
    setTargetId("")
  }, [])

  useHotkey(shortcutKey, handleOpen, { enabled: !open })
  useHotkey("Escape", handleClose, { enabled: open, allowWhileTyping: true })

  function removeName(name: string) {
    setText(people.filter((p) => p.name !== name).map(fmt).join("\n"))
  }

  function fmt(p: ParsedPerson) {
    return [p.name, p.phone, p.email].filter(Boolean).join("; ")
  }

  function handleConfirm() {
    if (people.length === 0) return
    if (needsTarget && !targetId) {
      toast.error(`Selecione ${targetLabel === "Classe" ? "uma classe" : "um ministério"}`)
      return
    }

    startTransition(async () => {
      const res = await fetch("/api/members/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, targetId: needsTarget ? targetId : undefined, people }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        toast.error(data.error ?? "Erro ao cadastrar membros!")
        return
      }

      const nCreated = data.created?.length ?? 0
      const nReused = data.reused?.length ?? 0

      if (nCreated > 0) {
        toast.success(
          `${nCreated} ${nCreated === 1 ? "membro cadastrado" : "membros cadastrados"}` +
            (label ? ` — ${label}!` : "!")
        )
      }
      if (nReused > 0) {
        toast.info(
          `${nReused} já ${nReused === 1 ? "existia" : "existiam"} e ` +
            (role ? "foram apenas vinculados ao grupo" : "não foram duplicados") +
            `: ${data.reused.slice(0, 5).join(", ")}${nReused > 5 ? "…" : ""}`
        )
      }
      if (nCreated === 0 && nReused === 0) {
        toast.info("Nada a fazer — nenhum nome novo na lista.")
      }

      handleClose()
      router.refresh()
    })
  }

  return (
    <>
      <button
        onClick={handleOpen}
        title={`Adicionar lista de nomes (${shortcutKey.toUpperCase()})`}
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition"
      >
        <ClipboardList size={15} />
        Adicionar lista
        <Kbd className="text-white border-white/40 bg-white/15">{shortcutKey.toUpperCase()}</Kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden"
            style={{ maxHeight: "85vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900">
                  Adicionar lista de nomes{label ? ` — ${label}` : ""}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Um nome por linha. Nomes que já existem não são duplicados.
                </p>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Destino (ministério / classe) */}
            {needsTarget && targets!.length > 1 && (
              <div className="px-5 py-3 border-b border-gray-50">
                <label className="text-xs font-medium text-gray-500 block mb-1.5">{targetLabel}</label>
                <div className="relative">
                  <select
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value ? Number(e.target.value) : "")}
                    className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm text-gray-700 focus:outline-none focus:border-indigo-500 transition bg-white"
                  >
                    <option value="">Selecione…</option>
                    {targets!.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Área de colagem */}
            <div className="px-5 py-4 overflow-y-auto flex-1">
              <textarea
                ref={areaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={9}
                placeholder={"João da Silva\nMaria Souza\nPedro Alves; (11) 99999-0000\nAna Lima; ana@email.com"}
                className="w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-800 focus:outline-none focus:border-indigo-500 transition resize-y font-mono"
              />

              <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
                Cole direto de uma planilha ou lista. Telefone e e-mail são opcionais — separe
                do nome com <code className="bg-gray-100 px-1 rounded">;</code> ou TAB.
                Numeração (<code className="bg-gray-100 px-1 rounded">1.</code>,{" "}
                <code className="bg-gray-100 px-1 rounded">-</code>) é ignorada automaticamente.
              </p>

              {/* Pré-visualização */}
              {people.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">
                    {people.length} {people.length === 1 ? "nome reconhecido" : "nomes reconhecidos"}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {people.map((p) => (
                      <span
                        key={p.name}
                        className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 bg-indigo-50 text-indigo-800 rounded-full text-xs"
                      >
                        {p.name}
                        {(p.phone || p.email) && (
                          <span className="text-indigo-400">· {p.phone ?? p.email}</span>
                        )}
                        <button
                          onClick={() => removeName(p.name)}
                          className="hover:text-indigo-950 transition"
                          title="Remover da lista"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
              <p className="text-xs text-gray-400 truncate flex-1">
                {people.length > 0
                  ? `${people.length} para cadastrar`
                  : "Cole ou digite os nomes acima"}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:border-gray-400 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={people.length === 0 || isPending}
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  {isPending && <Loader2 size={14} className="animate-spin" />}
                  {isPending ? "Cadastrando..." : `Cadastrar${people.length > 0 ? ` (${people.length})` : ""}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
