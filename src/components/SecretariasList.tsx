"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"
import { Plus, Landmark, Users, CalendarDays, FileText, Wallet, ChevronRight } from "lucide-react"
import { createSecretaria } from "@/lib/actions"
import { accentFor } from "@/lib/societyAccent"

type Item = {
  id: number
  name: string
  members: number
  events: number
  documents: number
  orcamentos: number
  mine: boolean
}

export default function SecretariasList({
  role,
  societyId,
  canManage,
  secretarias,
}: {
  role: string
  societyId: number
  canManage: boolean
  secretarias: Item[]
}) {
  const router = useRouter()
  const ac = accentFor(role)
  const [newName, setNewName] = useState("")
  const [pending, start] = useTransition()

  const create = () => {
    if (!newName.trim()) return
    start(async () => {
      try {
        const res = await createSecretaria(societyId, newName.trim())
        if (res.ok) {
          toast.success("Secretaria criada")
          setNewName("")
          if (res.id) router.push(`/${role}/secretarias/${res.id}`)
          else router.refresh()
        } else {
          toast.error(res.error ?? "Falha ao criar")
        }
      } catch (e: any) {
        toast.error(e?.message ? `Erro: ${e.message}` : "Erro inesperado")
      }
    })
  }

  return (
    <div className="flex flex-col gap-5">
      {canManage && (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 flex items-center gap-3">
          <Landmark size={17} className="shrink-0" style={{ color: ac.color }} />
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()}
            placeholder="Nova secretaria (ex.: Secretaria de Música)"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
          />
          <button
            onClick={create}
            disabled={pending || !newName.trim()}
            style={{ background: ac.color }}
            className="inline-flex items-center gap-1.5 rounded-lg text-white px-3.5 py-2 text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            <Plus size={15} /> Criar
          </button>
        </div>
      )}

      {secretarias.length === 0 ? (
        <p className="p-8 text-center text-sm text-gray-400 bg-white rounded-2xl border border-gray-100">
          Nenhuma secretaria ainda{canManage ? " — crie a primeira acima." : "."}
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {secretarias.map((s) => (
            <Link
              key={s.id}
              href={`/${role}/secretarias/${s.id}`}
              className="group rounded-2xl border border-gray-100 bg-white shadow-sm p-4 hover:-translate-y-0.5 hover:shadow-md transition flex flex-col gap-3"
            >
              <div className="flex items-center gap-2">
                <div className="rounded-xl p-2" style={{ background: ac.light }}>
                  <Landmark size={16} style={{ color: ac.color }} />
                </div>
                <span className="font-semibold text-gray-900 flex-1 truncate">{s.name}</span>
                {s.mine && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: ac.light, color: ac.color }}>você participa</span>}
                <ChevronRight size={16} className="text-gray-300 transition" />
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span className="inline-flex items-center gap-1"><Users size={12} /> {s.members}</span>
                <span className="inline-flex items-center gap-1"><CalendarDays size={12} /> {s.events}</span>
                <span className="inline-flex items-center gap-1"><FileText size={12} /> {s.documents}</span>
                <span className="inline-flex items-center gap-1"><Wallet size={12} /> {s.orcamentos}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
