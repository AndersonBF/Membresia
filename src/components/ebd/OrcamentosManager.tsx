"use client"

import { useState } from "react"
import {
  Plus, X, Trash2, Pencil, ExternalLink, Package,
  Truck, CalendarClock, Loader2, ShoppingCart,
} from "lucide-react"

const AC = "#b45309"

type Item = {
  id?: number
  name: string
  price: number
  quantity: number
  link: string | null
  imageUrl: string | null
}
type Orcamento = {
  id: number
  title: string
  description: string | null
  urgencia: "ALTA" | "MEDIA" | "BAIXA"
  neededBy: string | null
  shippingCost: number
  freeShipping: boolean
  createdByName: string | null
  createdAt: string
  items: Item[]
}

const money = (v: number) =>
  (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

const urgLabel: Record<string, string> = { ALTA: "Urgente", MEDIA: "Normal", BAIXA: "Sem pressa" }
const urgClass: Record<string, string> = {
  ALTA: "bg-red-100 text-red-700",
  MEDIA: "bg-amber-100 text-amber-700",
  BAIXA: "bg-emerald-100 text-emerald-700",
}

const itemsTotal = (o: Orcamento) => o.items.reduce((s, it) => s + it.price * it.quantity, 0)
const grandTotal = (o: Orcamento) => itemsTotal(o) + (o.freeShipping ? 0 : o.shippingCost)

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("pt-BR", {
        day: "2-digit", month: "long", year: "numeric", timeZone: "UTC",
      })
    : null

export default function OrcamentosManager({ initial }: { initial: Orcamento[] }) {
  const [list, setList] = useState<Orcamento[]>(initial)
  const [detail, setDetail] = useState<Orcamento | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Orcamento | null>(null)

  const openCreate = () => { setEditing(null); setFormOpen(true) }
  const openEdit = (o: Orcamento) => { setEditing(o); setDetail(null); setFormOpen(true) }

  const handleSaved = (saved: Orcamento) => {
    setList((prev) =>
      prev.some((o) => o.id === saved.id)
        ? prev.map((o) => (o.id === saved.id ? saved : o))
        : [saved, ...prev],
    )
    setFormOpen(false)
    setEditing(null)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Apagar este orçamento? Esta ação não pode ser desfeita.")) return
    const res = await fetch(`/api/ebd/orcamentos/${id}`, { method: "DELETE" })
    if (res.ok) {
      setList((prev) => prev.filter((o) => o.id !== id))
      setDetail(null)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
        <button
          onClick={openCreate}
          className="flex items-center gap-2 text-sm text-white px-4 py-2.5 rounded-lg font-medium transition hover:opacity-90"
          style={{ background: AC }}
        >
          <Plus size={16} /> Novo orçamento
        </button>
      </div>

      {list.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <ShoppingCart size={40} className="mx-auto text-gray-200" />
          <p className="text-gray-400 text-sm mt-3">
            Nenhum orçamento ainda. Clique em “Novo orçamento” para criar o primeiro.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((o) => {
            const thumb = o.items.find((it) => it.imageUrl)?.imageUrl ?? null
            return (
              <button
                key={o.id}
                onClick={() => setDetail(o)}
                className="text-left bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition flex flex-col"
              >
                <div className="h-32 bg-gray-50 flex items-center justify-center overflow-hidden">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumb}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none" }}
                    />
                  ) : (
                    <Package size={30} className="text-gray-200" />
                  )}
                </div>
                <div className="p-4 flex flex-col gap-2 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900 leading-tight">{o.title}</h3>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${urgClass[o.urgencia]}`}>
                      {urgLabel[o.urgencia]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {o.items.length} {o.items.length === 1 ? "item" : "itens"}
                  </p>
                  {o.neededBy && (
                    <p className="text-[11px] text-gray-400 flex items-center gap-1">
                      <CalendarClock size={12} /> Para {fmtDate(o.neededBy)}
                    </p>
                  )}
                  <p className="text-lg font-bold mt-auto pt-1" style={{ color: AC }}>
                    {money(grandTotal(o))}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {detail && (
        <DetailModal
          orcamento={detail}
          onClose={() => setDetail(null)}
          onEdit={() => openEdit(detail)}
          onDelete={() => handleDelete(detail.id)}
        />
      )}

      {formOpen && (
        <FormModal
          editing={editing}
          onClose={() => { setFormOpen(false); setEditing(null) }}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}

/* ---------------- Detalhe ---------------- */

function DetailModal({
  orcamento, onClose, onEdit, onDelete,
}: {
  orcamento: Orcamento
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const o = orcamento
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-3 sticky top-0 bg-white rounded-t-2xl">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-gray-900">{o.title}</h2>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${urgClass[o.urgencia]}`}>
                {urgLabel[o.urgencia]}
              </span>
            </div>
            {o.neededBy && (
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                <CalendarClock size={14} /> Necessário para {fmtDate(o.neededBy)}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 shrink-0">
            <X size={22} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-5">
          {o.description && (
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{o.description}</p>
          )}

          {/* Itens */}
          <div className="flex flex-col gap-3">
            {o.items.map((it, i) => (
              <div key={it.id ?? i} className="flex gap-3 border border-gray-100 rounded-xl p-3">
                <div className="w-16 h-16 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                  {it.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={it.imageUrl}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none" }}
                    />
                  ) : (
                    <Package size={22} className="text-gray-200" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800">{it.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {it.quantity} × {money(it.price)}
                  </p>
                  {it.link && (
                    <a
                      href={it.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs inline-flex items-center gap-1 mt-1 font-medium hover:underline"
                      style={{ color: AC }}
                    >
                      <ExternalLink size={12} /> Ver produto
                    </a>
                  )}
                </div>
                <p className="font-semibold text-gray-800 whitespace-nowrap">
                  {money(it.price * it.quantity)}
                </p>
              </div>
            ))}
          </div>

          {/* Totais */}
          <div className="border-t border-gray-100 pt-4 flex flex-col gap-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal dos itens</span>
              <span>{money(itemsTotal(o))}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span className="flex items-center gap-1.5"><Truck size={14} /> Frete</span>
              <span>{o.freeShipping ? "Grátis" : money(o.shippingCost)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-1" style={{ color: AC }}>
              <span>Total</span>
              <span>{money(grandTotal(o))}</span>
            </div>
          </div>

          {o.createdByName && (
            <p className="text-xs text-gray-400">Criado por {o.createdByName}</p>
          )}

          {/* Ações */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onEdit}
              className="flex-1 flex items-center justify-center gap-2 text-sm font-medium py-2.5 rounded-lg text-white transition hover:opacity-90"
              style={{ background: AC }}
            >
              <Pencil size={15} /> Editar
            </button>
            <button
              onClick={onDelete}
              className="flex items-center justify-center gap-2 text-sm font-medium py-2.5 px-4 rounded-lg text-red-600 border border-red-200 hover:bg-red-50 transition"
            >
              <Trash2 size={15} /> Apagar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------------- Formulário (criar/editar) ---------------- */

type FormItem = { name: string; price: string; quantity: string; link: string }

const emptyItem = (): FormItem => ({ name: "", price: "", quantity: "1", link: "" })

function FormModal({
  editing, onClose, onSaved,
}: {
  editing: Orcamento | null
  onClose: () => void
  onSaved: (o: Orcamento) => void
}) {
  const [title, setTitle] = useState(editing?.title ?? "")
  const [description, setDescription] = useState(editing?.description ?? "")
  const [urgencia, setUrgencia] = useState<"ALTA" | "MEDIA" | "BAIXA">(editing?.urgencia ?? "MEDIA")
  const [neededBy, setNeededBy] = useState(editing?.neededBy ? editing.neededBy.slice(0, 10) : "")
  const [freeShipping, setFreeShipping] = useState(editing?.freeShipping ?? false)
  const [shippingCost, setShippingCost] = useState(
    editing && !editing.freeShipping ? String(editing.shippingCost) : "",
  )
  const [items, setItems] = useState<FormItem[]>(
    editing && editing.items.length > 0
      ? editing.items.map((it) => ({
          name: it.name,
          price: String(it.price),
          quantity: String(it.quantity),
          link: it.link ?? "",
        }))
      : [emptyItem()],
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const updateItem = (i: number, patch: Partial<FormItem>) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
  const addItem = () => setItems((prev) => [...prev, emptyItem()])
  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i))

  const previewTotal =
    items.reduce((s, it) => s + (Number(it.price) || 0) * (Math.max(1, parseInt(it.quantity) || 1)), 0) +
    (freeShipping ? 0 : Number(shippingCost) || 0)

  const submit = async () => {
    setError("")
    if (!title.trim()) { setError("Dê um título ao orçamento."); return }
    const validItems = items.filter((it) => it.name.trim())
    if (validItems.length === 0) { setError("Adicione ao menos um item."); return }

    setSaving(true)
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        urgencia,
        neededBy: neededBy || null,
        freeShipping,
        shippingCost: freeShipping ? 0 : Number(shippingCost) || 0,
        items: validItems.map((it) => ({
          name: it.name.trim(),
          price: Number(it.price) || 0,
          quantity: Math.max(1, parseInt(it.quantity) || 1),
          link: it.link.trim() || null,
        })),
      }
      const res = await fetch(
        editing ? `/api/ebd/orcamentos/${editing.id}` : "/api/ebd/orcamentos",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar.")
      onSaved(data as Orcamento)
    } catch (err: any) {
      setError(err.message ?? "Erro ao salvar.")
      setSaving(false)
    }
  }

  const field = "w-full p-2.5 rounded-lg ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
  const label = "text-xs font-semibold text-gray-500 uppercase tracking-wide"

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-900">
            {editing ? "Editar orçamento" : "Novo orçamento"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={22} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className={label}>Título</label>
            <input className={field} value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Livros do 2º semestre" autoFocus />
          </div>

          <div className="flex flex-col gap-1">
            <label className={label}>Descrição (opcional)</label>
            <textarea className={field} rows={2} value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Observações, para quem entregar, etc." />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className={label}>Urgência</label>
              <select className={field} value={urgencia} onChange={(e) => setUrgencia(e.target.value as any)}>
                <option value="ALTA">Urgente</option>
                <option value="MEDIA">Normal</option>
                <option value="BAIXA">Sem pressa</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className={label}>Preciso para (aprox.)</label>
              <input type="date" className={field} value={neededBy}
                onChange={(e) => setNeededBy(e.target.value)} />
            </div>
          </div>

          {/* Frete */}
          <div className="flex flex-col gap-2 border border-gray-100 rounded-xl p-3">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={freeShipping}
                onChange={(e) => setFreeShipping(e.target.checked)} />
              <Truck size={15} /> Frete grátis
            </label>
            {!freeShipping && (
              <div className="flex flex-col gap-1">
                <label className={label}>Valor do frete (R$)</label>
                <input type="number" step="0.01" min="0" className={field} value={shippingCost}
                  onChange={(e) => setShippingCost(e.target.value)} placeholder="0,00" />
              </div>
            )}
          </div>

          {/* Itens */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className={label}>Produtos</label>
              <button onClick={addItem} className="text-xs flex items-center gap-1 font-medium" style={{ color: AC }}>
                <Plus size={13} /> Adicionar produto
              </button>
            </div>

            {items.map((it, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-3 flex flex-col gap-2 relative">
                {items.length > 1 && (
                  <button onClick={() => removeItem(i)}
                    className="absolute top-2 right-2 text-gray-300 hover:text-red-500">
                    <Trash2 size={15} />
                  </button>
                )}
                <input className={field} value={it.name} placeholder="Nome do produto"
                  onChange={(e) => updateItem(i, { name: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 uppercase">Valor (R$)</label>
                    <input type="number" step="0.01" min="0" className={field} value={it.price}
                      placeholder="0,00" onChange={(e) => updateItem(i, { price: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 uppercase">Qtd.</label>
                    <input type="number" min="1" className={field} value={it.quantity}
                      onChange={(e) => updateItem(i, { quantity: e.target.value })} />
                  </div>
                </div>
                <input className={field} value={it.link} placeholder="Link do produto (opcional)"
                  onChange={(e) => updateItem(i, { link: e.target.value })} />
                <p className="text-[11px] text-gray-400">
                  Se houver link, tentamos puxar a foto do produto automaticamente.
                </p>
              </div>
            ))}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex items-center justify-between border-t border-gray-100 pt-4">
            <span className="text-sm text-gray-500">Total estimado</span>
            <span className="text-lg font-bold" style={{ color: AC }}>{money(previewTotal)}</span>
          </div>

          <div className="flex gap-2">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition">
              Cancelar
            </button>
            <button onClick={submit} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
              style={{ background: AC }}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              {editing ? "Salvar alterações" : "Criar orçamento"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
