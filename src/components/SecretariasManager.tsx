"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"
import {
  Plus, Trash2, Pencil, Check, X, UserPlus, FileText, Upload, Loader2, Users, Landmark, CalendarDays, Wallet,
} from "lucide-react"
import {
  createSecretaria, renameSecretaria, deleteSecretaria,
  addMemberToSecretaria, removeMemberFromSecretaria,
  createSecretariaDocument, deleteSecretariaDocument,
  createSecretariaEvent, deleteSecretariaEvent,
  createSecretariaOrcamento, setSecretariaOrcamentoStatus, deleteSecretariaOrcamento,
} from "@/lib/actions"

type Member = { id: number; name: string }
type Doc = { id: number; title: string; fileUrl: string }
type EventItem = { id: number; title: string; date: string; startTime: string | null }
type OrcItem = { name: string; quantity: number; price: number }
type Orc = { id: number; title: string; urgencia: string; status: string; createdByName: string | null; total: number; items: OrcItem[] }
type Secretaria = { id: number; name: string; members: Member[]; documents: Doc[]; events: EventItem[]; orcamentos: Orc[]; mine: boolean }

const money = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

const STATUS_BADGE: Record<string, string> = {
  solicitado: "bg-amber-50 text-amber-700",
  aprovado: "bg-green-50 text-green-700",
  rejeitado: "bg-red-50 text-red-600",
}

// Datas de evento são "hora de parede em UTC" — formatar sempre em UTC.

// Datas de evento são "hora de parede em UTC" — formatar sempre em UTC.
function fmtEvent(dateISO: string, startISO: string | null): string {
  const d = new Date(dateISO)
  const day = String(d.getUTCDate()).padStart(2, "0")
  const mon = d.toLocaleDateString("pt-BR", { month: "short", timeZone: "UTC" }).replace(".", "")
  const time = startISO
    ? new Date(startISO).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })
    : null
  return `${day}/${mon}${time ? ` · ${time}` : ""}`
}

type Props = {
  role: string
  societyId: number
  canManage: boolean
  secretarias: Secretaria[]
  societyMembers: Member[]
}

export default function SecretariasManager({ canManage, societyId, secretarias, societyMembers }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [newName, setNewName] = useState("")
  const [editing, setEditing] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const [uploading, setUploading] = useState<number | null>(null)
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({})

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, okMsg?: string) =>
    startTransition(async () => {
      const res = await fn()
      if (res.ok) {
        if (okMsg) toast.success(okMsg)
        router.refresh()
      } else {
        toast.error(res.error ?? "Falha na operação")
      }
    })

  const create = () => {
    if (!newName.trim()) return
    run(() => createSecretaria(societyId, newName.trim()), "Secretaria criada")
    setNewName("")
  }

  const saveRename = (id: number) => {
    if (!editName.trim()) return
    run(() => renameSecretaria(id, editName.trim()), "Renomeada")
    setEditing(null)
  }

  const remove = (s: Secretaria) => {
    if (!window.confirm(`Excluir "${s.name}"? Isso remove seus vínculos e documentos.`)) return
    run(() => deleteSecretaria(s.id), "Excluída")
  }

  async function uploadDoc(secretariaId: number, files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    setUploading(secretariaId)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/gallery/upload", { method: "POST", body: fd })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.url) {
        toast.error(data?.error ?? "Falha no upload")
        return
      }
      const title = file.name.replace(/\.[^.]+$/, "")
      const r = await createSecretariaDocument(secretariaId, title, data.url)
      if (r.ok) {
        toast.success("Documento anexado")
        router.refresh()
      } else {
        toast.error(r.error ?? "Falha ao salvar")
      }
    } finally {
      setUploading(null)
      const input = fileRefs.current[secretariaId]
      if (input) input.value = ""
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Nova secretaria (diretoria) */}
      {canManage && (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 flex items-center gap-3">
          <Landmark size={17} className="text-teal-700 shrink-0" />
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()}
            placeholder="Nova secretaria (ex.: Secretaria de Música)"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/30"
          />
          <button
            onClick={create}
            disabled={isPending || !newName.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 text-white px-3.5 py-2 text-sm font-medium hover:bg-teal-800 transition disabled:opacity-50"
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
        secretarias.map((s) => {
          const canDocs = canManage || s.mine
          const available = societyMembers.filter((m) => !s.members.some((x) => x.id === m.id))
          return (
            <div key={s.id} className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              {/* Header */}
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
                {editing === s.id ? (
                  <>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveRename(s.id)}
                      autoFocus
                      className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/30"
                    />
                    <button onClick={() => saveRename(s.id)} className="text-teal-700 hover:text-teal-900"><Check size={16} /></button>
                    <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-700"><X size={16} /></button>
                  </>
                ) : (
                  <>
                    <h3 className="font-semibold text-gray-900 flex-1">{s.name}</h3>
                    {s.mine && !canManage && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-700">Você participa</span>
                    )}
                    {canManage && (
                      <>
                        <button onClick={() => { setEditing(s.id); setEditName(s.name) }} className="text-gray-400 hover:text-gray-700"><Pencil size={14} /></button>
                        <button onClick={() => remove(s)} className="text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                      </>
                    )}
                  </>
                )}
              </div>

              <div className="p-5 flex flex-col gap-5">
                {/* Membros */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5 mb-2">
                    <Users size={12} /> Membros
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {s.members.length === 0 && <span className="text-xs text-gray-400">Nenhum membro vinculado.</span>}
                    {s.members.map((m) => (
                      <span key={m.id} className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-full pl-3 pr-1.5 py-1 text-xs text-gray-700">
                        {m.name}
                        {canManage && (
                          <button
                            onClick={() => run(() => removeMemberFromSecretaria(s.id, m.id))}
                            className="text-gray-300 hover:text-red-600"
                            aria-label={`Remover ${m.name}`}
                          >
                            <X size={13} />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                  {canManage && available.length > 0 && (
                    <div className="mt-3 flex items-center gap-2">
                      <UserPlus size={14} className="text-gray-400" />
                      <select
                        defaultValue=""
                        onChange={(e) => {
                          const id = Number(e.target.value)
                          if (id) run(() => addMemberToSecretaria(s.id, id))
                          e.target.value = ""
                        }}
                        className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/30"
                      >
                        <option value="">Adicionar membro…</option>
                        {available.map((m) => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Programações */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5 mb-2">
                    <CalendarDays size={12} /> Programações
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {s.events.length === 0 && <span className="text-xs text-gray-400">Nenhuma programação.</span>}
                    {s.events.map((ev) => (
                      <div key={ev.id} className="flex items-center gap-2 text-sm">
                        <span className="text-[11px] font-semibold text-teal-700 w-24 shrink-0">{fmtEvent(ev.date, ev.startTime)}</span>
                        <span className="flex-1 text-gray-700 truncate">{ev.title}</span>
                        {canDocs && (
                          <button
                            onClick={() => run(() => deleteSecretariaEvent(ev.id))}
                            className="text-gray-300 hover:text-red-600"
                            aria-label="Remover programação"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {canDocs && <ProgramForm secretariaId={s.id} onDone={() => router.refresh()} />}
                </div>

                {/* Documentos */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5 mb-2">
                    <FileText size={12} /> Documentos
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {s.documents.length === 0 && <span className="text-xs text-gray-400">Nenhum documento.</span>}
                    {s.documents.map((d) => (
                      <div key={d.id} className="flex items-center gap-2 text-sm">
                        <a href={d.fileUrl} target="_blank" rel="noreferrer" className="flex-1 text-teal-700 hover:underline truncate">
                          {d.title}
                        </a>
                        {canDocs && (
                          <button
                            onClick={() => run(() => deleteSecretariaDocument(d.id))}
                            className="text-gray-300 hover:text-red-600"
                            aria-label="Remover documento"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {canDocs && (
                    <div className="mt-3">
                      <button
                        onClick={() => fileRefs.current[s.id]?.click()}
                        disabled={uploading === s.id}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700 border border-teal-200 rounded-lg px-3 py-1.5 hover:bg-teal-50 transition disabled:opacity-50"
                      >
                        {uploading === s.id ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                        {uploading === s.id ? "Enviando…" : "Anexar documento"}
                      </button>
                      <input
                        ref={(el) => { fileRefs.current[s.id] = el }}
                        type="file"
                        className="hidden"
                        onChange={(e) => uploadDoc(s.id, e.target.files)}
                      />
                    </div>
                  )}
                </div>

                {/* Orçamentos */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5 mb-2">
                    <Wallet size={12} /> Orçamentos
                  </p>
                  <div className="flex flex-col gap-2">
                    {s.orcamentos.length === 0 && <span className="text-xs text-gray-400">Nenhum orçamento.</span>}
                    {s.orcamentos.map((o) => (
                      <div key={o.id} className="rounded-lg border border-gray-100 p-2.5">
                        <div className="flex items-center gap-2">
                          <span className="flex-1 text-sm font-medium text-gray-800 truncate">{o.title}</span>
                          <span className="text-sm font-semibold text-gray-700">{money(o.total)}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_BADGE[o.status] ?? "bg-gray-100 text-gray-500"}`}>
                            {o.status}
                          </span>
                        </div>
                        {o.items.length > 0 && (
                          <p className="text-[11px] text-gray-400 mt-1 truncate">
                            {o.items.map((it) => `${it.quantity}× ${it.name}`).join(", ")}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5">
                          {o.createdByName && <span className="text-[11px] text-gray-400">por {o.createdByName}</span>}
                          <span className="flex-1" />
                          {canManage && o.status === "solicitado" && (
                            <>
                              <button
                                onClick={() => run(() => setSecretariaOrcamentoStatus(o.id, "aprovado"), "Aprovado")}
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-green-700 border border-green-200 rounded-md px-2 py-1 hover:bg-green-50"
                              >
                                <Check size={12} /> Aprovar
                              </button>
                              <button
                                onClick={() => run(() => setSecretariaOrcamentoStatus(o.id, "rejeitado"), "Rejeitado")}
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600 border border-red-200 rounded-md px-2 py-1 hover:bg-red-50"
                              >
                                <X size={12} /> Rejeitar
                              </button>
                            </>
                          )}
                          {canDocs && (
                            <button
                              onClick={() => run(() => deleteSecretariaOrcamento(o.id))}
                              className="text-gray-300 hover:text-red-600"
                              aria-label="Excluir orçamento"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {canDocs && <OrcamentoRequestForm secretariaId={s.id} onDone={() => router.refresh()} />}
                </div>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

// Formulário compacto para criar uma programação (evento) da secretaria.
function ProgramForm({ secretariaId, onDone }: { secretariaId: number; onDone: () => void }) {
  const [title, setTitle] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [pending, start] = useTransition()

  const submit = () => {
    if (!title.trim() || !date) {
      toast.error("Título e data são obrigatórios")
      return
    }
    start(async () => {
      const res = await createSecretariaEvent(secretariaId, {
        title: title.trim(),
        date,
        startTime: time ? `${date}T${time}` : undefined,
      })
      if (res.ok) {
        toast.success("Programação criada")
        setTitle("")
        setDate("")
        setTime("")
        onDone()
      } else {
        toast.error(res.error ?? "Falha ao criar")
      }
    })
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Nova programação"
        className="flex-1 min-w-[140px] border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/30"
      />
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-700"
      />
      <input
        type="time"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-700"
      />
      <button
        onClick={submit}
        disabled={pending}
        className="inline-flex items-center gap-1 rounded-lg bg-teal-700 text-white px-3 py-1.5 text-sm font-medium hover:bg-teal-800 transition disabled:opacity-50"
      >
        {pending ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Add
      </button>
    </div>
  )
}

// Formulário de solicitação de orçamento (título + urgência + itens).
function OrcamentoRequestForm({ secretariaId, onDone }: { secretariaId: number; onDone: () => void }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [urgencia, setUrgencia] = useState("MEDIA")
  const [items, setItems] = useState<{ name: string; quantity: string; price: string }[]>([
    { name: "", quantity: "1", price: "" },
  ])
  const [pending, start] = useTransition()

  const setItem = (i: number, patch: Partial<{ name: string; quantity: string; price: string }>) =>
    setItems((arr) => arr.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
  const addRow = () => setItems((arr) => [...arr, { name: "", quantity: "1", price: "" }])
  const removeRow = (i: number) => setItems((arr) => (arr.length > 1 ? arr.filter((_, idx) => idx !== i) : arr))

  const total = items.reduce((s, it) => s + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0)

  const submit = () => {
    if (!title.trim()) {
      toast.error("Informe um título")
      return
    }
    const its = items.filter((it) => it.name.trim())
    if (its.length === 0) {
      toast.error("Adicione ao menos um item")
      return
    }
    start(async () => {
      const res = await createSecretariaOrcamento(secretariaId, {
        title: title.trim(),
        urgencia,
        items: its.map((it) => ({
          name: it.name.trim(),
          quantity: Number(it.quantity) || 1,
          price: Number(it.price) || 0,
        })),
      })
      if (res.ok) {
        toast.success("Orçamento solicitado")
        setTitle("")
        setUrgencia("MEDIA")
        setItems([{ name: "", quantity: "1", price: "" }])
        setOpen(false)
        onDone()
      } else {
        toast.error(res.error ?? "Falha ao solicitar")
      }
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-teal-700 border border-teal-200 rounded-lg px-3 py-1.5 hover:bg-teal-50 transition"
      >
        <Plus size={13} /> Solicitar orçamento
      </button>
    )
  }

  return (
    <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50/60 p-3 flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título (ex.: Materiais do acampamento)"
          className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/30"
        />
        <select
          value={urgencia}
          onChange={(e) => setUrgencia(e.target.value)}
          className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white"
        >
          <option value="ALTA">Alta</option>
          <option value="MEDIA">Média</option>
          <option value="BAIXA">Baixa</option>
        </select>
      </div>
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={it.name}
            onChange={(e) => setItem(i, { name: e.target.value })}
            placeholder="Item"
            className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm bg-white"
          />
          <input
            value={it.quantity}
            onChange={(e) => setItem(i, { quantity: e.target.value })}
            type="number"
            min={1}
            placeholder="Qtd"
            className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white"
          />
          <input
            value={it.price}
            onChange={(e) => setItem(i, { price: e.target.value })}
            type="number"
            min={0}
            step="0.01"
            placeholder="R$"
            className="w-24 border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white"
          />
          <button onClick={() => removeRow(i)} className="text-gray-300 hover:text-red-600" aria-label="Remover item">
            <X size={14} />
          </button>
        </div>
      ))}
      <div className="flex items-center justify-between">
        <button onClick={addRow} className="text-xs text-teal-700 inline-flex items-center gap-1">
          <Plus size={12} /> Item
        </button>
        <span className="text-sm font-semibold text-gray-700">Total: {money(total)}</span>
      </div>
      <div className="flex items-center gap-2 justify-end">
        <button onClick={() => setOpen(false)} className="text-xs text-gray-500 px-3 py-1.5">
          Cancelar
        </button>
        <button
          onClick={submit}
          disabled={pending}
          className="inline-flex items-center gap-1 rounded-lg bg-teal-700 text-white px-3 py-1.5 text-sm font-medium hover:bg-teal-800 transition disabled:opacity-50"
        >
          {pending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Solicitar
        </button>
      </div>
    </div>
  )
}
