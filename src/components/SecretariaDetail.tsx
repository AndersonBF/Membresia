"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "react-toastify"
import {
  ArrowLeft, Landmark, Plus, Trash2, Pencil, Check, X, UserPlus, Loader2,
  Eye, Download, Package, ShoppingCart,
} from "lucide-react"
import {
  renameSecretaria, deleteSecretaria,
  addMemberToSecretaria, removeMemberFromSecretaria,
  createSecretariaDocument, deleteSecretariaDocument,
  createSecretariaEvent, deleteSecretariaEvent,
  createSecretariaOrcamento, setSecretariaOrcamentoStatus, deleteSecretariaOrcamento,
} from "@/lib/actions"
import { accentFor } from "@/lib/societyAccent"
import Table from "@/components/Table"

type Member = { id: number; name: string }
type Doc = { id: number; title: string; fileUrl: string }
type EventItem = { id: number; title: string; description: string | null; date: string; startTime: string | null; endTime: string | null; isPublic: boolean }
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
  solicitado: "bg-amber-100 text-amber-700",
  aprovado: "bg-green-100 text-green-700",
  rejeitado: "bg-red-100 text-red-600",
}
const STATUS_LABEL: Record<string, string> = {
  solicitado: "Solicitado",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
}
const URG_LABEL: Record<string, string> = { ALTA: "Urgente", MEDIA: "Normal", BAIXA: "Sem pressa" }
const URG_CLASS: Record<string, string> = {
  ALTA: "bg-red-100 text-red-700",
  MEDIA: "bg-amber-100 text-amber-700",
  BAIXA: "bg-emerald-100 text-emerald-700",
}
const isImage = (url: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(url)

export default function SecretariaDetail({ role, societyName, canManage, mine, secretaria, societyMembers, activeTab }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const section = activeTab
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(secretaria.name)
  const [uploading, setUploading] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null)
  const [detailOrc, setDetailOrc] = useState<Orc | null>(null)
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
      // PDFs e outros arquivos não-imagem precisam ir como "raw" para o Cloudinary
      // entregá-los corretamente (como "image" o PDF fica bloqueado / não abre).
      fd.append("resourceType", file.type.startsWith("image/") ? "image" : "raw")
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
      <div className="p-4 md:p-6">
        <main className="min-h-[300px]">
          {/* MEMBROS */}
          {section === "membros" && (
            <div className="flex flex-col gap-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6 max-w-4xl">
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

          {/* PROGRAMAÇÕES — mesma tabela da tela de Eventos do site */}
          {section === "programacoes" && (() => {
            const columns = [
              { header: "Título", accessor: "title" },
              { header: "Descrição", accessor: "description", className: "hidden lg:table-cell" },
              { header: "Data", accessor: "date", className: "hidden md:table-cell" },
              { header: "Início", accessor: "startTime", className: "hidden md:table-cell" },
              { header: "Fim", accessor: "endTime", className: "hidden md:table-cell" },
              { header: "Sociedade", accessor: "society", className: "hidden lg:table-cell" },
              { header: "Público", accessor: "isPublic", className: "hidden md:table-cell" },
              ...(canContribute ? [{ header: "Ações", accessor: "action" }] : []),
            ]
            const fmtTime = (iso: string | null) =>
              iso ? new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" }) : "-"
            const renderRow = (ev: EventItem) => (
              <tr key={ev.id} className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight">
                <td className="flex items-center gap-4 p-4">{ev.title}</td>
                <td className="hidden lg:table-cell">
                  {ev.description ? <span className="truncate max-w-xs block">{ev.description}</span> : <span className="text-gray-400">-</span>}
                </td>
                <td className="hidden md:table-cell">{new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(ev.date))}</td>
                <td className="hidden md:table-cell">{fmtTime(ev.startTime)}</td>
                <td className="hidden md:table-cell">{fmtTime(ev.endTime)}</td>
                <td className="hidden lg:table-cell">{societyName}</td>
                <td className="hidden md:table-cell">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${ev.isPublic ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                    {ev.isPublic ? "Público" : "Privado"}
                  </span>
                </td>
                {canContribute && (
                  <td>
                    <button
                      onClick={() => run(() => deleteSecretariaEvent(ev.id))}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-700 text-white transition"
                      aria-label="Excluir programação">
                      <Trash2 size={16} />
                    </button>
                  </td>
                )}
              </tr>
            )
            return (
              <div className="bg-white p-4 rounded-md">
                <div className="flex items-center justify-between">
                  <h1 className="text-lg font-semibold">Eventos</h1>
                  {canContribute && <ProgramForm secretariaId={s.id} accentColor={ac.color} onDone={() => router.refresh()} />}
                </div>
                {s.events.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-10">Nenhuma programação cadastrada.</p>
                ) : (
                  <Table columns={columns} renderRow={renderRow} data={s.events} />
                )}
              </div>
            )
          })()}

          {/* DOCUMENTOS — mesmo layout da tela "Documentos e Arquivos" do site */}
          {section === "documentos" && (
            <div className="bg-white p-4 rounded-md">
              <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold">Documentos e Arquivos</h1>
                {canContribute && (
                  <>
                    <button onClick={() => fileRef.current?.click()} disabled={uploading}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition bg-yellow-400 hover:bg-yellow-500 text-black disabled:opacity-60">
                      {uploading ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                      {uploading ? "Enviando…" : "Adicionar documento"}
                    </button>
                    <input ref={fileRef} type="file" className="hidden" onChange={(e) => uploadDoc(e.target.files)} />
                  </>
                )}
              </div>

              {s.documents.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-10">Nenhum documento cadastrado.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {s.documents.map((d) => (
                    <div key={d.id} className="p-4 rounded-md border border-gray-200 bg-lamaSkyLight hover:shadow-lg transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex flex-col min-w-0">
                            <h2 className="font-bold text-gray-800 text-md truncate pr-2">{d.title}</h2>
                            <span className="text-[10px] uppercase font-bold text-gray-500 bg-white px-2 py-0.5 rounded-full w-max border border-gray-200 mt-1">
                              {societyName}
                            </span>
                          </div>
                          {canContribute && (
                            <button
                              onClick={() => run(() => deleteSecretariaDocument(d.id))}
                              className="w-8 h-8 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-700 text-white transition shrink-0"
                              aria-label="Excluir documento">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mb-4 line-clamp-3 min-h-[3em]">Sem descrição disponível.</p>
                      </div>

                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => setSelectedDoc(d.fileUrl)}
                          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md font-medium text-xs transition-all border border-blue-500 bg-blue-500 text-white hover:bg-white hover:text-blue-500">
                          <Eye size={16} /> Ler Agora
                        </button>
                        <a
                          href={d.fileUrl}
                          download
                          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md font-medium text-xs transition-all border border-green-700 bg-green-700 text-white hover:bg-white hover:text-green-700">
                          <Download size={16} /> Baixar
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ORÇAMENTOS — mesmo layout da tela de Orçamentos (Diaconia/EBD) */}
          {section === "orcamentos" && (
            <div className="flex flex-col gap-5">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Orçamentos</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Listas de materiais para compra, com valores e itens.
                </p>
              </div>

              {canContribute && (
                <div className="flex justify-end">
                  <OrcamentoRequestForm secretariaId={s.id} accentColor={ac.color} onDone={() => router.refresh()} />
                </div>
              )}

              {s.orcamentos.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
                  <ShoppingCart size={40} className="mx-auto text-gray-200" />
                  <p className="text-gray-400 text-sm mt-3">
                    Nenhum orçamento ainda. Clique em “Solicitar orçamento” para criar o primeiro.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {s.orcamentos.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => setDetailOrc(o)}
                      className="text-left bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition flex flex-col">
                      <div className="h-32 bg-gray-50 flex items-center justify-center overflow-hidden">
                        <Package size={30} className="text-gray-200" />
                      </div>
                      <div className="p-4 flex flex-col gap-2 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-gray-900 leading-tight">{o.title}</h3>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${URG_CLASS[o.urgencia] ?? "bg-gray-100 text-gray-500"}`}>
                            {URG_LABEL[o.urgencia] ?? o.urgencia}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-gray-400">
                            {o.items.length} {o.items.length === 1 ? "item" : "itens"}
                          </p>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[o.status] ?? "bg-gray-100 text-gray-500"}`}>
                            {STATUS_LABEL[o.status] ?? o.status}
                          </span>
                        </div>
                        <p className="text-lg font-bold mt-auto pt-1" style={{ color: ac.color }}>
                          {money(o.total)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* VISUALIZADOR DE DOCUMENTO */}
      {selectedDoc && (
        <div className="fixed inset-0 z-[999] bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white w-full h-[90vh] md:w-[80%] rounded-lg overflow-hidden relative flex flex-col">
            <div className="flex justify-between items-center p-3 border-b bg-gray-100">
              <h3 className="font-semibold text-gray-700">Visualização de Arquivo</h3>
              <div className="flex items-center gap-3">
                <a href={selectedDoc} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-600 hover:underline">
                  Abrir em nova aba
                </a>
                <button onClick={() => setSelectedDoc(null)} className="text-gray-500 hover:text-red-600 font-bold text-xl px-2">✕</button>
              </div>
            </div>
            <div className="flex-1 bg-gray-200 overflow-auto flex items-center justify-center">
              {isImage(selectedDoc) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selectedDoc} alt="Documento" className="max-w-full max-h-full object-contain" />
              ) : (
                <iframe src={selectedDoc} className="w-full h-full border-none" title="Visualizador de PDF" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* DETALHE DO ORÇAMENTO */}
      {detailOrc && (
        <OrcamentoDetailModal
          orcamento={detailOrc}
          accent={ac.color}
          canManage={canManage}
          canContribute={canContribute}
          onClose={() => setDetailOrc(null)}
          onApprove={() => { run(() => setSecretariaOrcamentoStatus(detailOrc.id, "aprovado"), "Aprovado"); setDetailOrc(null) }}
          onReject={() => { run(() => setSecretariaOrcamentoStatus(detailOrc.id, "rejeitado"), "Rejeitado"); setDetailOrc(null) }}
          onDelete={() => { run(() => deleteSecretariaOrcamento(detailOrc.id)); setDetailOrc(null) }}
        />
      )}
    </div>
  )
}

// Modal de detalhe de um orçamento — espelha o visual da tela de Orçamentos das sociedades.
function OrcamentoDetailModal({
  orcamento, accent, canManage, canContribute, onClose, onApprove, onReject, onDelete,
}: {
  orcamento: Orc
  accent: string
  canManage: boolean
  canContribute: boolean
  onClose: () => void
  onApprove: () => void
  onReject: () => void
  onDelete: () => void
}) {
  const o = orcamento
  return (
    <div className="fixed inset-0 z-[999] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-3 sticky top-0 bg-white rounded-t-2xl">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-gray-900">{o.title}</h2>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[o.status] ?? "bg-gray-100 text-gray-500"}`}>
                {STATUS_LABEL[o.status] ?? o.status}
              </span>
              {o.urgencia && (
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${URG_CLASS[o.urgencia] ?? ""}`}>
                  {URG_LABEL[o.urgencia] ?? o.urgencia}
                </span>
              )}
            </div>
            {o.createdByName && <p className="text-sm text-gray-500 mt-1">Solicitado por {o.createdByName}</p>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 shrink-0"><X size={22} /></button>
        </div>

        <div className="p-5 flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            {o.items.map((it, i) => (
              <div key={i} className="flex gap-3 border border-gray-100 rounded-xl p-3 items-center">
                <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                  <Package size={20} className="text-gray-200" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{it.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{it.quantity} × {money(it.price)}</p>
                </div>
                <p className="font-semibold text-gray-800 whitespace-nowrap">{money(it.price * it.quantity)}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-4 flex justify-between text-lg font-bold" style={{ color: accent }}>
            <span>Total</span>
            <span>{money(o.total)}</span>
          </div>

          <div className="flex gap-2 pt-1">
            {canManage && o.status === "solicitado" && (
              <>
                <button onClick={onApprove}
                  className="flex-1 flex items-center justify-center gap-2 text-sm font-medium py-2.5 rounded-lg text-white bg-green-600 hover:bg-green-700 transition">
                  <Check size={15} /> Aprovar
                </button>
                <button onClick={onReject}
                  className="flex-1 flex items-center justify-center gap-2 text-sm font-medium py-2.5 rounded-lg text-red-600 border border-red-200 hover:bg-red-50 transition">
                  <X size={15} /> Rejeitar
                </button>
              </>
            )}
            {canContribute && (
              <button onClick={onDelete}
                className="flex items-center justify-center gap-2 text-sm font-medium py-2.5 px-4 rounded-lg text-red-600 border border-red-200 hover:bg-red-50 transition">
                <Trash2 size={15} /> Apagar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Botão amarelo "Adicionar evento" + modal — mesmo padrão do FormModal do site.
function ProgramForm({ secretariaId, accentColor, onDone }: { secretariaId: number; accentColor: string; onDone: () => void }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [pending, start] = useTransition()

  const submit = () => {
    if (!title.trim() || !date) { toast.error("Título e data são obrigatórios"); return }
    start(async () => {
      const res = await createSecretariaEvent(secretariaId, { title: title.trim(), date, startTime: time ? `${date}T${time}` : undefined })
      if (res.ok) { toast.success("Programação criada"); setTitle(""); setDate(""); setTime(""); setOpen(false); onDone() }
      else toast.error(res.error ?? "Falha ao criar")
    })
  }

  const ringStyle = { ["--tw-ring-color" as any]: `${accentColor}55` }
  const field = "w-full p-2.5 rounded-lg ring-1 ring-gray-200 focus:outline-none focus:ring-2 text-sm bg-white"
  const label = "text-xs font-semibold text-gray-500 uppercase tracking-wide"

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition bg-yellow-400 hover:bg-yellow-500 text-black">
        <Plus size={15} /> Adicionar evento
      </button>

      {open && (
        <div className="fixed inset-0 z-[999] bg-black/60 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white p-6 rounded-md relative w-[90%] max-w-lg" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setOpen(false)} className="absolute top-3 right-3 text-gray-600 hover:text-black transition"><X size={20} /></button>
            <h1 className="text-xl font-semibold mb-5">Nova Programação</h1>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className={label}>Título</label>
                <input className={field} style={ringStyle} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título do evento" autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className={label}>Data</label>
                  <input type="date" className={field} style={ringStyle} value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className={label}>Início</label>
                  <input type="time" className={field} style={ringStyle} value={time} onChange={(e) => setTime(e.target.value)} />
                </div>
              </div>
              <button onClick={submit} disabled={pending}
                className="bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2 mt-1">
                {pending ? <Loader2 size={16} className="animate-spin" /> : null}
                {pending ? "Salvando..." : "Salvar Programação"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
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

  const field = "w-full p-2.5 rounded-lg ring-1 ring-gray-200 focus:outline-none focus:ring-2 text-sm bg-white"
  const label = "text-xs font-semibold text-gray-500 uppercase tracking-wide"
  const ringStyle = { ["--tw-ring-color" as any]: `${accentColor}55` }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{ background: accentColor }}
        className="flex w-fit items-center gap-2 text-sm text-white px-4 py-2.5 rounded-lg font-medium transition hover:opacity-90">
        <Plus size={16} /> Solicitar orçamento
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-[999] bg-black/50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-900">Solicitar orçamento</h2>
          <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={22} /></button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className={label}>Título</label>
              <input className={field} style={ringStyle} value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: Materiais do acampamento" autoFocus />
            </div>
            <div className="flex flex-col gap-1">
              <label className={label}>Urgência</label>
              <select className={field} style={ringStyle} value={urgencia} onChange={(e) => setUrgencia(e.target.value)}>
                <option value="ALTA">Urgente</option>
                <option value="MEDIA">Normal</option>
                <option value="BAIXA">Sem pressa</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className={label}>Itens</label>
              <button onClick={addRow} className="text-xs flex items-center gap-1 font-medium" style={{ color: accentColor }}>
                <Plus size={13} /> Adicionar item
              </button>
            </div>
            {items.map((it, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-3 flex flex-col gap-2 relative">
                {items.length > 1 && (
                  <button onClick={() => removeRow(i)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500" aria-label="Remover item">
                    <Trash2 size={15} />
                  </button>
                )}
                <input className={field} style={ringStyle} value={it.name} placeholder="Nome do item"
                  onChange={(e) => setItem(i, { name: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 uppercase">Qtd.</label>
                    <input type="number" min={1} className={field} style={ringStyle} value={it.quantity}
                      onChange={(e) => setItem(i, { quantity: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 uppercase">Valor (R$)</label>
                    <input type="number" min={0} step="0.01" className={field} style={ringStyle} value={it.price}
                      placeholder="0,00" onChange={(e) => setItem(i, { price: e.target.value })} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 pt-4">
            <span className="text-sm text-gray-500">Total estimado</span>
            <span className="text-lg font-bold" style={{ color: accentColor }}>{money(total)}</span>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setOpen(false)}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition">
              Cancelar
            </button>
            <button onClick={submit} disabled={pending} style={{ background: accentColor }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60">
              {pending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Solicitar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
