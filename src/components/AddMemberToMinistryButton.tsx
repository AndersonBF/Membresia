"use client"

import { useState, useTransition, useRef } from "react"
import { useRouter } from "next/navigation"
import { UserPlus, X, Search, Check } from "lucide-react"
import { toast } from "react-toastify"

interface AvailableMember {
  id: number
  name: string
}

interface Props {
  ministryId: number
  availableMembers: AvailableMember[]
}

export default function AddMemberToMinistryButton({ ministryId, availableMembers }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = availableMembers.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  )

  function handleOpen() {
    setOpen(true)
    setSearch("")
    setSelected(null)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function handleClose() {
    setOpen(false)
    setSearch("")
    setSelected(null)
  }

  function handleConfirm() {
    if (!selected) return
    startTransition(async () => {
      const res = await fetch("/api/ministerio/add-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ministryId, memberId: selected }),
      })

      if (res.ok) {
        toast.success("Membro adicionado ao ministério!")
        handleClose()
        router.refresh()
      } else {
        const err = await res.json()
        toast.error(err.error ?? "Erro ao adicionar membro!")
      }
    })
  }

  const selectedMember = availableMembers.find((m) => m.id === selected)

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition"
      >
        <UserPlus size={15} />
        Adicionar membro
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
                <h3 className="font-bold text-gray-900">Adicionar ao Ministério</h3>
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

            {/* Search */}
            <div className="px-4 py-3 border-b border-gray-50">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  ref={inputRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar membro..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500 transition"
                />
              </div>
            </div>

            {/* Lista */}
            <div className="overflow-y-auto flex-1">
              {filtered.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-10">
                  {search ? "Nenhum membro encontrado" : "Todos os membros já estão neste ministério"}
                </p>
              ) : (
                filtered.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelected(m.id === selected ? null : m.id)}
                    className={`w-full flex items-center justify-between px-5 py-3 text-left text-sm transition border-b border-gray-50 last:border-0
                      ${selected === m.id
                        ? "bg-green-50 text-green-800"
                        : "hover:bg-gray-50 text-gray-700"
                      }`}
                  >
                    <span className="font-medium">{m.name}</span>
                    {selected === m.id && (
                      <Check size={15} className="text-green-600 flex-shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
              <p className="text-xs text-gray-400 truncate flex-1">
                {selectedMember ? `Selecionado: ${selectedMember.name}` : "Nenhum selecionado"}
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
                  disabled={!selected || isPending}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isPending ? "Adicionando..." : "Confirmar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}