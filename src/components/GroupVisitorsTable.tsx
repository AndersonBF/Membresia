"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import { toast } from "react-toastify"
import { Loader2, Pencil, Plus, Search, Trash2, UserPlus, X } from "lucide-react"
import MemberAvatar from "@/components/MemberAvatar"
import Kbd from "@/components/Kbd"
import { useHotkey } from "@/hooks/useHotkey"

export type GroupVisitor = {
  id: number
  name: string
  phone: string | null
  email: string | null
  gender: "MASCULINO" | "FEMININO" | null
  birthDate: string | null
  notes: string | null
  isActive: boolean
  createdAt: string
  /** Nº de presenças registradas */
  visits: number
  /** Data da última presença registrada */
  lastVisit: string | null
}

type FormState = {
  name: string
  phone: string
  email: string
  gender: "" | "MASCULINO" | "FEMININO"
  birthDate: string
  notes: string
}

const emptyForm: FormState = { name: "", phone: "", email: "", gender: "", birthDate: "", notes: "" }

function waLink(phone: string) {
  const digits = phone.replace(/\D/g, "")
  const wa = digits.startsWith("55") && digits.length >= 12 ? digits : `55${digits}`
  return `https://wa.me/${wa}`
}

export default function GroupVisitorsTable({
  initial,
  role,
  canManage,
  accent = "#3b82f6",
}: {
  initial: GroupVisitor[]
  role: string
  canManage: boolean
  accent?: string
}) {
  const [list, setList] = useState<GroupVisitor[]>(initial)
  const [search, setSearch] = useState("")
  const [modal, setModal] = useState<{ open: boolean; editing: GroupVisitor | null }>({
    open: false,
    editing: null,
  })
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [busy, setBusy] = useState<number | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        (v.phone ?? "").toLowerCase().includes(q) ||
        (v.email ?? "").toLowerCase().includes(q)
    )
  }, [list, search])

  const searchRef = useRef<HTMLInputElement>(null)

  const openCreate = useCallback(() => {
    setForm(emptyForm)
    setModal({ open: true, editing: null })
  }, [])

  const closeModal = useCallback(() => setModal({ open: false, editing: null }), [])

  // ── Atalhos de teclado ──────────────────────────────────────────────────────
  // N → novo visitante | / → busca | Esc → fecha o modal
  useHotkey("n", openCreate, { enabled: canManage && !modal.open })
  useHotkey("/", () => searchRef.current?.focus(), { enabled: !modal.open })
  useHotkey("Escape", closeModal, { enabled: modal.open, allowWhileTyping: true })

  function openEdit(v: GroupVisitor) {
    setForm({
      name: v.name,
      phone: v.phone ?? "",
      email: v.email ?? "",
      gender: v.gender ?? "",
      birthDate: v.birthDate ? v.birthDate.slice(0, 10) : "",
      notes: v.notes ?? "",
    })
    setModal({ open: true, editing: v })
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return toast.error("Informe o nome do visitante")

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone,
        email: form.email,
        gender: form.gender || null,
        birthDate: form.birthDate || null,
        notes: form.notes,
      }

      const editing = modal.editing
      const res = await fetch(
        editing ? `/api/group/visitors/${editing.id}` : "/api/group/visitors",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editing ? payload : { ...payload, role }),
        }
      )
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error || "Erro")

      const saved = json.visitor
      if (editing) {
        setList((prev) =>
          prev.map((x) =>
            x.id === editing.id
              ? {
                  ...x,
                  ...saved,
                  birthDate: saved.birthDate ?? null,
                  createdAt: x.createdAt,
                }
              : x
          )
        )
        toast.success("Visitante atualizado")
      } else {
        setList((prev) => [
          { ...saved, birthDate: saved.birthDate ?? null, visits: 0, lastVisit: null },
          ...prev,
        ])
        toast.success("Visitante cadastrado")
      }
      setModal({ open: false, editing: null })
    } catch (err: any) {
      toast.error(err?.message || "Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  async function remove(v: GroupVisitor) {
    if (!confirm(`Excluir o visitante ${v.name}? As presenças dele também serão removidas.`)) return
    setBusy(v.id)
    try {
      const res = await fetch(`/api/group/visitors/${v.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setList((prev) => prev.filter((x) => x.id !== v.id))
      toast.success("Visitante excluído")
    } catch {
      toast.error("Erro ao excluir")
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      {/* Barra de ações */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
        <div className="flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-3 py-1 w-full md:w-auto">
          <Search size={14} className="text-gray-400" />
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") e.currentTarget.blur() }}
            placeholder="Buscar visitante..."
            className="w-full md:w-[220px] p-2 bg-transparent outline-none"
          />
          <Kbd className="text-gray-400 border-gray-300">/</Kbd>
        </div>

        {canManage && (
          <button
            onClick={openCreate}
            title="Novo visitante (N)"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium transition hover:opacity-90"
            style={{ background: accent }}
          >
            <UserPlus size={15} /> Novo visitante
            <Kbd className="text-white border-white/40 bg-white/15">N</Kbd>
          </button>
        )}
      </div>

      {/* Tabela */}
      {filtered.length === 0 ? (
        <div className="mt-6 rounded-xl border border-gray-100 bg-white p-10 text-center text-sm text-gray-400">
          {list.length === 0
            ? "Nenhum visitante cadastrado ainda."
            : "Nenhum visitante encontrado para essa busca."}
        </div>
      ) : (
        <table className="w-full mt-4">
          <thead>
            <tr className="text-left text-gray-500 text-sm">
              <th>Info</th>
              <th className="hidden md:table-cell">Gênero</th>
              <th className="hidden lg:table-cell">Telefone</th>
              <th className="hidden md:table-cell">Presenças</th>
              <th className="hidden xl:table-cell">Última visita</th>
              {canManage && <th>Ações</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((v) => (
              <tr
                key={v.id}
                className="border-b border-gray-200 text-sm even:bg-slate-50 hover:bg-lamaPurpleLight transition-colors"
              >
                <td className="flex items-center gap-4 p-4">
                  <MemberAvatar name={v.name} profileImageUrl={null} size={40} />
                  <div className="flex flex-col">
                    <h3 className="font-semibold">{v.name}</h3>
                    <p className="text-xs text-gray-500">
                      {v.email || `Desde ${new Date(v.createdAt).toLocaleDateString("pt-BR")}`}
                    </p>
                  </div>
                </td>

                <td className="hidden md:table-cell">
                  {v.gender === "MASCULINO" ? (
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">M</span>
                  ) : v.gender === "FEMININO" ? (
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-pink-100 text-pink-800">F</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>

                <td className="hidden lg:table-cell">
                  {v.phone ? (
                    <a
                      href={waLink(v.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-green-700 transition"
                    >
                      {v.phone}
                    </a>
                  ) : (
                    "-"
                  )}
                </td>

                <td className="hidden md:table-cell">
                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                    {v.visits}
                  </span>
                </td>

                <td className="hidden xl:table-cell text-gray-600">
                  {v.lastVisit ? new Date(v.lastVisit).toLocaleDateString("pt-BR") : "—"}
                </td>

                {canManage && (
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(v)}
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky hover:opacity-80 transition"
                        title="Editar"
                      >
                        <Pencil size={13} className="text-white" />
                      </button>
                      <button
                        onClick={() => remove(v)}
                        disabled={busy === v.id}
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaPurple hover:opacity-80 transition disabled:opacity-50"
                        title="Excluir"
                      >
                        {busy === v.id ? (
                          <Loader2 size={13} className="text-white animate-spin" />
                        ) : (
                          <Trash2 size={13} className="text-white" />
                        )}
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal criar/editar */}
      {modal.open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form
            onSubmit={save}
            className="bg-white rounded-2xl w-full max-w-md p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {modal.editing ? "Editar visitante" : "Novo visitante"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            <label className="flex flex-col gap-1 text-xs text-gray-500">
              Nome *
              <input
                autoFocus
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm text-gray-900"
              />
            </label>

            <div className="flex gap-3">
              <label className="flex-1 flex flex-col gap-1 text-xs text-gray-500">
                Telefone
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm text-gray-900"
                />
              </label>
              <label className="flex-1 flex flex-col gap-1 text-xs text-gray-500">
                Gênero
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value as FormState["gender"] })}
                  className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm text-gray-900"
                >
                  <option value="">—</option>
                  <option value="MASCULINO">Masculino</option>
                  <option value="FEMININO">Feminino</option>
                </select>
              </label>
            </div>

            <div className="flex gap-3">
              <label className="flex-1 flex flex-col gap-1 text-xs text-gray-500">
                E-mail
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm text-gray-900"
                />
              </label>
              <label className="flex-1 flex flex-col gap-1 text-xs text-gray-500">
                Nascimento
                <input
                  type="date"
                  value={form.birthDate}
                  onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                  className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm text-gray-900"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1 text-xs text-gray-500">
              Observações
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm text-gray-900 resize-none"
              />
            </label>

            <button
              type="submit"
              disabled={saving}
              className="mt-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium transition hover:opacity-90 disabled:opacity-50"
              style={{ background: accent }}
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
              {saving ? "Salvando..." : modal.editing ? "Salvar alterações" : "Cadastrar"}
            </button>
          </form>
        </div>
      )}
    </>
  )
}
