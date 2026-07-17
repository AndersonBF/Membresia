"use client"

import { useState, useTransition, useRef } from "react"
import { useRouter } from "next/navigation"
import { UserPlus, X, Search, Check, ChevronDown } from "lucide-react"
import { toast } from "react-toastify"

interface Item {
  id: number
  name: string
}

interface Props {
  role: string
  label: string
  availableMembers: Item[]
  /** Ministérios ou classes — quando o grupo tem vários destinos */
  targets?: Item[]
  /** Rótulo do destino: "Ministério" | "Classe" */
  targetLabel?: string
}

export default function AddExistingMemberButton({
  role,
  label,
  availableMembers,
  targets,
  targetLabel,
}: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [targetId, setTargetId] = useState<number | "">("")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const needsTarget = !!targets && targets.length > 0

  const filtered = availableMembers.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  )

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAllFiltered() {
    setSelected((prev) => {
      const next = new Set(prev)
      const allSelected = filtered.every((m) => next.has(m.id))
      if (allSelected) filtered.forEach((m) => next.delete(m.id))
      else filtered.forEach((m) => next.add(m.id))
      return next
    })
  }

  function handleOpen() {
    setOpen(true)
    setSearch("")
    setSelected(new Set())
    setTargetId(needsTarget && targets!.length === 1 ? targets![0].id : "")
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function handleClose() {
    setOpen(false)
    setSearch("")
    setSelected(new Set())
    setTargetId("")
  }

  function handleConfirm() {
    if (selected.size === 0) return
    if (needsTarget && !targetId) {
      toast.error(`Selecione ${targetLabel === "Classe" ? "uma classe" : "um ministério"}`)
      return
    }
    startTransition(async () => {
      const res = await fetch("/api/members/add-to-group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          memberIds: Array.from(selected),
          targetId: needsTarget ? targetId : undefined,
        }),
      })

      if (res.ok) {
        const data = await res.json().catch(() => ({}))
        const n = data.count ?? selected.size
        toast.success(`${n} ${n === 1 ? "membro adicionado" : "membros adicionados"} — ${label}!`)
        handleClose()
        router.refresh()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error ?? "Erro ao adicionar membros!")
      }
    })
  }

  const allFilteredSelected = filtered.length > 0 && filtered.every((m) => selected.has(m.id))

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition"
      >
        <UserPlus size={15} />
        Adicionar existente
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden"
            style={{ maxHeight: "80vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900">Adicionar a {label}</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {availableMembers.length} membro{availableMembers.length !== 1 ? "s" : ""} disponíve{availableMembers.length !== 1 ? "is" : "l"}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Seleção de destino (ministério / classe) — só quando há mais de um */}
            {needsTarget && targets!.length > 1 && (
              <div className="px-4 py-3 border-b border-gray-50">
                <label className="text-xs font-medium text-gray-500 block mb-1.5">{targetLabel}</label>
                <div className="relative">
                  <select
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value ? Number(e.target.value) : "")}
                    className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm text-gray-700 focus:outline-none focus:border-teal-500 transition bg-white"
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

            {/* Search */}
            <div className="px-4 py-3 border-b border-gray-50">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  ref={inputRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar membro..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-500 transition"
                />
              </div>
            </div>

            {/* Selecionar todos (do filtro atual) */}
            {filtered.length > 0 && (
              <button
                onClick={toggleAllFiltered}
                className="px-5 py-2 text-xs font-medium text-teal-700 hover:bg-teal-50 text-left border-b border-gray-50 transition"
              >
                {allFilteredSelected ? "Desmarcar todos" : `Selecionar todos${search ? " (do filtro)" : ""}`}
              </button>
            )}

            {/* Lista */}
            <div className="overflow-y-auto flex-1">
              {filtered.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-10">
                  {search ? "Nenhum membro encontrado" : `Todos os membros já estão em ${label}`}
                </p>
              ) : (
                filtered.map((m) => {
                  const isSel = selected.has(m.id)
                  return (
                    <button
                      key={m.id}
                      onClick={() => toggle(m.id)}
                      className={`w-full flex items-center gap-3 px-5 py-3 text-left text-sm transition border-b border-gray-50 last:border-0
                        ${isSel ? "bg-teal-50 text-teal-800" : "hover:bg-gray-50 text-gray-700"}`}
                    >
                      <span
                        className={`w-5 h-5 rounded flex items-center justify-center border flex-shrink-0 transition
                          ${isSel ? "bg-teal-600 border-teal-600" : "border-gray-300 bg-white"}`}
                      >
                        {isSel && <Check size={13} className="text-white" />}
                      </span>
                      <span className="font-medium">{m.name}</span>
                    </button>
                  )
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
              <p className="text-xs text-gray-400 truncate flex-1">
                {selected.size > 0 ? `${selected.size} selecionado${selected.size !== 1 ? "s" : ""}` : "Nenhum selecionado"}
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
                  disabled={selected.size === 0 || isPending}
                  className="px-4 py-2 text-sm bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isPending ? "Adicionando..." : `Confirmar${selected.size > 0 ? ` (${selected.size})` : ""}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
