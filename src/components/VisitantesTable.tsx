"use client"

import { useState } from "react"
import { toast } from "react-toastify"
import { Check, Clock, Phone, Trash2, MessageCircle, Loader2 } from "lucide-react"

type Visitor = {
  id: number
  name: string
  phone: string | null
  message: string | null
  handled: boolean
  createdAt: string
}

export default function VisitantesTable({ initial }: { initial: Visitor[] }) {
  const [list, setList] = useState<Visitor[]>(initial)
  const [busy, setBusy] = useState<number | null>(null)

  async function toggle(v: Visitor) {
    setBusy(v.id)
    try {
      const res = await fetch(`/api/visitantes/${v.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handled: !v.handled }),
      })
      if (!res.ok) throw new Error()
      setList((prev) => prev.map((x) => (x.id === v.id ? { ...x, handled: !x.handled } : x)))
    } catch {
      toast.error("Erro ao atualizar")
    } finally {
      setBusy(null)
    }
  }

  async function remove(v: Visitor) {
    if (!confirm(`Excluir o contato de ${v.name}?`)) return
    setBusy(v.id)
    try {
      const res = await fetch(`/api/visitantes/${v.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setList((prev) => prev.filter((x) => x.id !== v.id))
      toast.success("Contato excluído")
    } catch {
      toast.error("Erro ao excluir")
    } finally {
      setBusy(null)
    }
  }

  function waLink(phone: string) {
    const digits = phone.replace(/\D/g, "")
    const wa = digits.startsWith("55") && digits.length >= 12 ? digits : `55${digits}`
    return `https://wa.me/${wa}`
  }

  if (list.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center text-gray-400 text-sm">
        Nenhum contato de visitante ainda.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {list.map((v) => {
        const d = new Date(v.createdAt)
        return (
          <div
            key={v.id}
            className={`bg-white rounded-xl border shadow-sm p-4 ${v.handled ? "border-green-200 opacity-70" : "border-gray-100"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-800 text-sm">{v.name}</p>
                  {v.handled ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700 inline-flex items-center gap-1">
                      <Check size={9} /> Tratado
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700 inline-flex items-center gap-1">
                      <Clock size={9} /> Novo
                    </span>
                  )}
                </div>
                {v.phone && (
                  <a href={waLink(v.phone)} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-gray-500 hover:text-green-700 transition inline-flex items-center gap-1 mt-1">
                    <Phone size={11} /> {v.phone}
                  </a>
                )}
                {v.message && <p className="text-sm text-gray-600 mt-1.5 whitespace-pre-wrap">{v.message}</p>}
                <p className="text-[11px] text-gray-400 mt-1.5">
                  {d.toLocaleDateString("pt-BR")} às {d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {v.phone && (
                  <a href={waLink(v.phone)} target="_blank" rel="noopener noreferrer"
                    className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-green-50 hover:text-green-600 transition">
                    <MessageCircle size={15} />
                  </a>
                )}
                <button
                  onClick={() => toggle(v)}
                  disabled={busy === v.id}
                  title={v.handled ? "Marcar como novo" : "Marcar como tratado"}
                  className={`w-8 h-8 flex items-center justify-center rounded-full transition disabled:opacity-50 ${
                    v.handled ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  }`}
                >
                  {busy === v.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={16} />}
                </button>
                <button
                  onClick={() => remove(v)}
                  disabled={busy === v.id}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-50"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
