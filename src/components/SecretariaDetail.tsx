"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "react-toastify"
import {
  ArrowLeft, Landmark, Users, CalendarDays, FileText, Wallet,
  Plus, Trash2, Pencil, Check, X, UserPlus, Upload, Loader2,
} from "lucide-react"
import {
  renameSecretaria, deleteSecretaria,
  addMemberToSecretaria, removeMemberFromSecretaria,
  createSecretariaDocument, deleteSecretariaDocument,
  createSecretariaEvent, deleteSecretariaEvent,
  createSecretariaOrcamento, setSecretariaOrcamentoStatus, deleteSecretariaOrcamento,
} from "@/lib/actions"
import { accentFor } from "@/lib/societyAccent"

type Member = { id: number; name: string }
type Doc = { id: number; title: string; fileUrl: string }
type EventItem = { id: number; title: string; date: string; startTime: string | null }
type OrcItem = { name: string; quantity: number; price: number }
type Orc = { id: number; title: string; urgencia: string; status: string; createdByName: string | null; total: number; items: OrcItem[] }
type SecretariaData = { id: number; name: string; members: Member[]; documents: Doc[]; events: EventItem[]; orcamentos: Orc[] }

type SectionId = "membros" | "programacoes" | "documentos" | "orcamentos"

type Props = {
  role: string
  societyName: string
  canManage: boolean
  mine: boolean
  secretaria: SecretariaData
  societyMembers: Member[]
  activeTab: SectionId
}

const money = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
const STATUS_BADGE: Record<string, string> = {
  solicitado: "bg-amber-50 text-amber-700",
  aprovado: "bg-green-50 text-green-700",
  rejeitado: "bg-red-50 text-red-600",
}
function fmtEvent(dateISO: string, startISO: string | null): string {
  const d = new Date(dateISO)
  const day = String(d.getUTCDate()).padStart(2, "0")
  const mon = d.toLocaleDateString("pt-BR", { month: "short", timeZone: "UTC" }).replace(".", "")
  const time = startISO
    ? new Date(startISO).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })
    : null
  return `${day}/${mon}${time ? ` · ${time}` : ""}`
}

export default function SecretariaDetail({ role, societyName, canManage, mine, secretaria, societyMembers, activeTab }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const section = activeTab
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(secretaria.name)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const s = secretaria
  const ac = accentFor(role)
  const canContribute = canManage || mine

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, okMsg?: string) =>
    startTransition(async () => {
      try {
        const res = await fn()
        if (res.ok) {
          if (okMsg) toast.success(okMsg)
          router.refresh()
        } else {
          toast.error(res.error ?? "Falha na operação")
        }
      } catch (e: any) {
        console.error("Secretaria action error:", e)
        toast.error(e?.message ? `Erro: ${e.message}` : "Erro inesperado")
      }
    })

  const saveRename = () => {
    if (!editName.trim()) return
    run(() => renameSecretaria(s.id, editName.trim()), "Renomeada")
    setEditing(false)
  }

  const remove = () => {
    if (!window.confirm(`Excluir "${s.name}"? Isso remove seus vínculos, documentos, programações e orçamentos.`)) return
    startTransition(async () => {
      const res = await deleteSecretaria(s.id).catch((e) => ({ ok: false, error: e?.message }))
      if (res.ok) {
        toast.success("Secretaria excluída")
        router.push(`/${role}/secretarias`)
      } else {
        toast.error(res.error ?? "Falha ao excluir")
      }
    })
  }

  async function uploadDoc(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/gallery/upload", { method: "POST", body: fd })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.url) {
        toast.error(data?.error ?? "Falha no upload")
        return
      }
      const r = await createSecretariaDocument(s.id, file.name.replace(/\.[^.]+$/, ""), data.url)
      if (r.ok) {
        toast.success("Documento anexado")
        router.refresh()
      } else toast.error(r.error ?? "Falha ao salvar")
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* HERO */}
      <div style={{ background: ac.dark }}>
        <div className="px-6 md:px-10 pt-6 pb-8">
          <Link href={`/${role}/secretarias`} className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs transition">
            <ArrowLeft size={13} /> Secretarias · {societyName}
          </Link>
          <div className="flex items-center gap-4 mt-4">
            <div className="rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.08)" }}>
              <Landmark size={30} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="flex items-center gap-2">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveRename()}
                    autoFocus
                    className="bg-white/10 text-white rounded-lg px-3 py-1.5 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-white/30"
                  />
                  <button onClick={saveRename} className="text-white/70 hover:text-white"><Check size={18} /></button>
                  <button onClick={() => { setEditing(false); setEditName(s.name) }} className="text-white/40 hover:text-white/70"><X size={18} /></button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <h1 className="text-white font-bold truncate" style={{ fontSize: "clamp(1.6rem,5vw,2.3rem)" }}>{s.name}</h1>
                  {canManage && (
                    <>
                      <button onClick={() => { setEditing(true); setEditName(s.name) }} className="text-white/40 hover:text-white/80"><Pencil size={16} /></button>
                      <button onClick={remove} className="text-white/40 hover:text-red-400"><Trash2 size={16} /></button>
                    </>
                  )}
                </div>
              )}
              {mine && !canManage && <p className="text-white/50 text-sm mt-1 font-light">Você participa desta secretaria</p>}
            </div>
          </div>
        </div>
        <div style={{ height: 2, background: `linear-gradient(90deg, ${ac.color}, ${ac.color}55, transparent)` }} />
      </div>

      {/* BODY: a navegação entre seções fica na sidebar global (Menu). Aqui só o conteúdo da seção ativa. */}
      <div className="p-4 md:p-6 max-w-4xl">
        <main className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6 min-h-[300px]">
          {/* MEMBROS */}
          {section === "membros" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2.5">
                <span className="w-0.5 h-5 rounded-full block" style={{ background: ac.color }} />
                <h2 className="text-lg font-semibold text-gray-900">Membros</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {s.members.length === 0 && <span className="text-sm text-gray-400">Nenhum membro vinculado.</span>}
                {s.members.map((m) => (
                  <span key={m.id} className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-full pl-3 pr-1.5 py-1 text-sm text-gray-700">
                    {m.name}
                    {canManage && (
                      <button onClick={() => run(() => removeMemberFromSecretaria(s.id, m.id))} className="text-gray-300 hover:text-red-600" aria-label={`Remover ${m.name}`}>
                        <X size={14} />
                      </button>
                    )}
                  </span>
                ))}
              </div>
              {canManage && (() => {
                const available = societyMembers.filter((m) => !s.members.some((x) => x.id === m.id))
                return available.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <UserPlus size={15} className="text-gray-400" />
                    <select
                      defaultValue=""
                      onChange={(e) => { const id = Number(e.target.value); if (id) run(() => addMemberToSecretaria(s.id, id)); e.target.value = "" }}
                      className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/30"
                    >
                      <option value="">Adicionar membro…</option>
                      {available.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                ) : <p className="text-xs text-gray-400">Todos os membros da sociedade já estão vinculados.</p>
              })()}
            </div>
          )}

          {/* PROGRAMAÇÕES */}
          {section === "programacoes" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2.5">
                <span className="w-0.5 h-5 rounded-full block" style={{ background: ac.color }} />
                <h2 className="text-lg font-semibold text-gray-900">Programações</h2>
              </div>
              <div className="flex flex-col gap-1.5">
                {s.events.length === 0 && <span className="text-sm text-gray-400">Nenhuma programação.</span>}
                {s.events.map((ev) => (
                  <div key={ev.id} className="flex items-center gap-2 text-sm py-1 border-b border-gray-50 last:border-0">
                    <span className="text-[11px] font-semibold text-teal-700 w-24 shrink-0">{fmtEvent(ev.date, ev.startTime)}</span>
                    <span className="flex-1 text-gray-700 truncate">{ev.title}</span>
                    {canContribute && (
                      <button onClick={() => run(() => deleteSecretariaEvent(ev.id))} className="text-gray-300 hover:text-red-600" aria-label="Remover programação"><Trash2 size={13} /></button>
                    )}
                  </div>
                ))}
              </div>
              {canContribute && <ProgramForm secretariaId={s.id} accentColor={ac.color} onDone={() => router.refresh()} />}
            </div>
          )}

          {/* DOCUMENTOS */}
          {section === "documentos" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2.5">
                <span className="w-0.5 h-5 rounded-full block" style={{ background: ac.color }} />
                <h2 className="text-lg font-semibold text-gray-900">Documentos</h2>
              </div>
              <div className="flex flex-col gap-1.5">
                {s.documents.length === 0 && <span className="text-sm text-gray-400">Nenhum documento.</span>}
                {s.documents.map((d) => (
                  <div key={d.id} className="flex items-center gap-2 text-sm py-1 border-b border-gray-50 last:border-0">
                    <a href={d.fileUrl} target="_blank" rel="noreferrer" className="flex-1 text-teal-700 hover:underline truncate">{d.title}</a>
                    {canContribute && (
                      <button onClick={() => run(() => deleteSecretariaDocument(d.id))} className="text-gray-300 hover:text-red-600" aria-label="Remover documento"><Trash2 size={13} /></button>
                    )}
                  </div>
                ))}
              </div>
              {canContribute && (
                <div>
                  <button onClick={() => fileRef.current?.click()} disabled={uploading}
                    style={{ color: ac.color, borderColor: `${ac.color}55` }}
                    className="inline-flex items-center gap-1.5 text-sm font-medium border rounded-lg px-3 py-1.5 hover:bg-gray-50 transition disabled:opacity-50">
                    {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    {uploading ? "Enviando…" : "Anexar documento"}
                  </button>
                  <input ref={fileRef} type="file" className="hidden" onChange={(e) => uploadDoc(e.target.files)} />
                </div>
              )}
            </div>
          )}

          {/* ORÇAMENTOS */}
          {section === "orcamentos" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2.5">
                <span className="w-0.5 h-5 rounded-full block" style={{ background: ac.color }} />
                <h2 className="text-lg font-semibold text-gray-900">Orçamentos</h2>
              </div>
              <div className="flex flex-col gap-2">
                {s.orcamentos.length === 0 && <span className="text-sm text-gray-400">Nenhum orçamento.</span>}
                {s.orcamentos.map((o) => (
                  <div key={o.id} className="rounded-lg border border-gray-100 p-3">
                    <div className="flex items-center gap-2">
                      <span className="flex-1 text-sm font-medium text-gray-800 truncate">{o.title}</span>
                      <span className="text-sm font-semibold text-gray-700">{money(o.total)}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_BADGE[o.status] ?? "bg-gray-100 text-gray-500"}`}>{o.status}</span>
                    </div>
                    {o.items.length > 0 && (
                      <p className="text-[11px] text-gray-400 mt-1">{o.items.map((it) => `${it.quantity}× ${it.name}`).join(", ")}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {o.createdByName && <span className="text-[11px] text-gray-400">por {o.createdByName}</span>}
                      <span className="flex-1" />
                      {canManage && o.status === "solicitado" && (
                        <>
                          <button onClick={() => run(() => setSecretariaOrcamentoStatus(o.id, "aprovado"), "Aprovado")} className="inline-flex items-center gap-1 text-[11px] font-medium text-green-700 border border-green-200 rounded-md px-2 py-1 hover:bg-green-50"><Check size={12} /> Aprovar</button>
                          <button onClick={() => run(() => setSecretariaOrcamentoStatus(o.id, "rejeitado"), "Rejeitado")} className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600 border border-red-200 rounded-md px-2 py-1 hover:bg-red-50"><X size={12} /> Rejeitar</button>
                        </>
                      )}
                      {canContribute && (
                        <button onClick={() => run(() => deleteSecretariaOrcamento(o.id))} className="text-gray-300 hover:text-red-600" aria-label="Excluir orçamento"><Trash2 size={12} /></button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {canContribute && <OrcamentoRequestForm secretariaId={s.id} accentColor={ac.color} onDone={() => router.refresh()} />}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

// Formulário compacto para criar uma programação.
function ProgramForm({ secretariaId, accentColor, onDone }: { secretariaId: number; accentColor: string; onDone: () => void }) {
  const [title, setTitle] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [pending, start] = useTransition()

  const submit = () => {
    if (!title.trim() || !date) { toast.error("Título e data são obrigatórios"); return }
    start(async () => {
      const res = await createSecretariaEvent(secretariaId, { title: title.trim(), date, startTime: time ? `${date}T${time}` : undefined })
      if (res.ok) { toast.success("Programação criada"); setTitle(""); setDate(""); setTime(""); onDone() }
      else toast.error(res.error ?? "Falha ao criar")
    })
  }

  return (
    <div className="mt-1 flex flex-wrap items-center gap-2">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nova programação"
        className="flex-1 min-w-[160px] border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/30" />
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-700" />
      <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-700" />
      <button onClick={submit} disabled={pending} style={{ background: accentColor }} className="inline-flex items-center gap-1 rounded-lg text-white px-3 py-1.5 text-sm font-medium hover:opacity-90 transition disabled:opacity-50">
        {pending ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Add
      </button>
    </div>
  )
}

// Formulário de solicitação de orçamento (título + urgência + itens).
function OrcamentoRequestForm({ secretariaId, accentColor, onDone }: { secretariaId: number; accentColor: string; onDone: () => void }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [urgencia, setUrgencia] = useState("MEDIA")
  const [items, setItems] = useState<{ name: string; quantity: string; price: string }[]>([{ name: "", quantity: "1", price: "" }])
  const [pending, start] = useTransition()

  const setItem = (i: number, patch: Partial<{ name: string; quantity: string; price: string }>) =>
    setItems((arr) => arr.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
  const addRow = () => setItems((arr) => [...arr, { name: "", quantity: "1", price: "" }])
  const removeRow = (i: number) => setItems((arr) => (arr.length > 1 ? arr.filter((_, idx) => idx !== i) : arr))
  const total = items.reduce((s, it) => s + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0)

  const submit = () => {
    if (!title.trim()) { toast.error("Informe um título"); return }
    const its = items.filter((it) => it.name.trim())
    if (its.length === 0) { toast.error("Adicione ao menos um item"); return }
    start(async () => {
      const res = await createSecretariaOrcamento(secretariaId, {
        title: title.trim(), urgencia,
        items: its.map((it) => ({ name: it.name.trim(), quantity: Number(it.quantity) || 1, price: Number(it.price) || 0 })),
      })
      if (res.ok) { toast.success("Orçamento solicitado"); setTitle(""); setUrgencia("MEDIA"); setItems([{ name: "", quantity: "1", price: "" }]); setOpen(false); onDone() }
      else toast.error(res.error ?? "Falha ao solicitar")
    })
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{ color: accentColor, borderColor: `${accentColor}55` }} className="inline-flex w-fit items-center gap-1.5 text-sm font-medium border rounded-lg px-3 py-1.5 hover:bg-gray-50 transition">
        <Plus size={14} /> Solicitar orçamento
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título (ex.: Materiais do acampamento)"
          className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/30" />
        <select value={urgencia} onChange={(e) => setUrgencia(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white">
          <option value="ALTA">Alta</option>
          <option value="MEDIA">Média</option>
          <option value="BAIXA">Baixa</option>
        </select>
      </div>
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-2">
          <input value={it.name} onChange={(e) => setItem(i, { name: e.target.value })} placeholder="Item" className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm bg-white" />
          <input value={it.quantity} onChange={(e) => setItem(i, { quantity: e.target.value })} type="number" min={1} placeholder="Qtd" className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white" />
          <input value={it.price} onChange={(e) => setItem(i, { price: e.target.value })} type="number" min={0} step="0.01" placeholder="R$" className="w-24 border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white" />
          <button onClick={() => removeRow(i)} className="text-gray-300 hover:text-red-600" aria-label="Remover item"><X size={14} /></button>
        </div>
      ))}
      <div className="flex items-center justify-between">
        <button onClick={addRow} style={{ color: accentColor }} className="text-xs inline-flex items-center gap-1"><Plus size={12} /> Item</button>
        <span className="text-sm font-semibold text-gray-700">Total: {money(total)}</span>
      </div>
      <div className="flex items-center gap-2 justify-end">
        <button onClick={() => setOpen(false)} className="text-xs text-gray-500 px-3 py-1.5">Cancelar</button>
        <button onClick={submit} disabled={pending} style={{ background: accentColor }} className="inline-flex items-center gap-1 rounded-lg text-white px-3 py-1.5 text-sm font-medium hover:opacity-90 transition disabled:opacity-50">
          {pending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Solicitar
        </button>
      </div>
    </div>
  )
}
