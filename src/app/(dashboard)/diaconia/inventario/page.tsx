"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, Trash2, Pencil, X, ChevronDown, Package } from "lucide-react"

type Condition = "BOM" | "REGULAR" | "RUIM"

interface Item {
  id: number
  name: string
  description: string | null
  quantity: number
  category: string | null
  condition: Condition
  location: string | null
  createdAt: string
}

const conditionLabel: Record<Condition, string> = { BOM: "Bom", REGULAR: "Regular", RUIM: "Ruim" }
const conditionColor: Record<Condition, { bg: string; text: string }> = {
  BOM:     { bg: "#f0fdf4", text: "#16a34a" },
  REGULAR: { bg: "#fffbeb", text: "#d97706" },
  RUIM:    { bg: "#fef2f2", text: "#dc2626" },
}

const AC = "#0d9488"

const CATEGORIES = ["Equipamento", "Alimentação", "Vestuário", "Mobiliário", "Limpeza", "Escritório", "Outro"]

const emptyForm = { name: "", description: "", quantity: 1, category: "", condition: "BOM" as Condition, location: "" }

export default function InventarioPage() {
  const [items, setItems]       = useState<Item[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState<Item | null>(null)
  const [filterCat, setFilterCat] = useState<string>("ALL")
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const res = await fetch("/api/diaconia/inventory")
    setItems(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openCreate() { setEditing(null); setForm(emptyForm); setShowForm(true) }
  function openEdit(item: Item) {
    setEditing(item)
    setForm({
      name: item.name,
      description: item.description ?? "",
      quantity: item.quantity,
      category: item.category ?? "",
      condition: item.condition,
      location: item.location ?? "",
    })
    setShowForm(true)
  }

  async function saveItem(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    const body = { ...form, quantity: Number(form.quantity), category: form.category || null, description: form.description || null, location: form.location || null }

    if (editing) {
      await fetch(`/api/diaconia/inventory/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
    } else {
      await fetch("/api/diaconia/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
    }
    setShowForm(false)
    setSaving(false)
    load()
  }

  async function deleteItem(id: number) {
    setItems(prev => prev.filter(i => i.id !== id))
    await fetch(`/api/diaconia/inventory/${id}`, { method: "DELETE" })
  }

  const categories = ["ALL", ...Array.from(new Set(items.map(i => i.category ?? "Sem categoria").filter(Boolean)))]
  const filtered = filterCat === "ALL" ? items : items.filter(i => (i.category ?? "Sem categoria") === filterCat)

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const countBom  = items.filter(i => i.condition === "BOM").length
  const countRuim = items.filter(i => i.condition === "RUIM").length

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');
        .ip { font-family:'DM Sans',sans-serif; }
        @keyframes ip-in { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .ip-in { animation: ip-in 0.3s ease both; }
        .item-card { transition: box-shadow .15s, transform .15s; }
        .item-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.08); transform: translateY(-1px); }
        .actions { opacity:0; transition: opacity .15s; }
        .item-card:hover .actions { opacity:1; }
      ` }} />

      <div className="ip bg-gray-50 min-h-screen p-4 md:p-6">

        {/* Header */}
        <div className="ip-in mb-6">
          <Link href="/diaconia" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-xs transition mb-4">
            <ArrowLeft size={13} /> Voltar para Diaconia
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Inventário</h1>
              <p className="text-sm text-gray-400 mt-0.5">Controle de itens e patrimônio da Diaconia</p>
            </div>
            <button onClick={openCreate} style={{ background: AC }}
              className="inline-flex items-center gap-2 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm hover:opacity-90 transition">
              <Plus size={15} /> Novo item
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3 mb-6 ip-in" style={{ animationDelay: ".05s" }}>
          {[
            { label: "Total de itens",  value: totalItems },
            { label: "Em bom estado",   value: countBom },
            { label: "Precisam atenção", value: countRuim },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Category filters */}
        <div className="flex items-center gap-2 mb-4 flex-wrap ip-in" style={{ animationDelay: ".1s" }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilterCat(cat)}
              className="text-xs px-3 py-1.5 rounded-full border font-medium transition"
              style={{
                background: filterCat === cat ? AC : "#fff",
                color: filterCat === cat ? "#fff" : "#6b7280",
                borderColor: filterCat === cat ? AC : "#e5e7eb",
              }}>
              {cat === "ALL" ? "Todos" : cat}
            </button>
          ))}
        </div>

        {/* Items grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 ip-in" style={{ animationDelay: ".15s" }}>
          {loading && (
            <div className="col-span-full bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
              Carregando…
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="col-span-full bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
              <Package size={28} className="mx-auto mb-2 opacity-30" />
              Nenhum item cadastrado.
            </div>
          )}
          {filtered.map(item => {
            const cc = conditionColor[item.condition]
            return (
              <div key={item.id} className="item-card bg-white rounded-xl border border-gray-100 p-4 relative overflow-hidden">
                {/* accent top bar */}
                <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: AC }} />

                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{item.name}</p>
                    {item.category && (
                      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">{item.category}</span>
                    )}
                  </div>
                  <div className="actions flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => openEdit(item)} className="text-gray-300 hover:text-teal-500 transition">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => deleteItem(item.id)} className="text-gray-300 hover:text-red-400 transition">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {item.description && (
                  <p className="text-xs text-gray-400 mt-1.5 line-clamp-2">{item.description}</p>
                )}

                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {/* Quantity */}
                  <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-1.5">
                    <span className="text-xs text-gray-400">Qtd</span>
                    <span className="text-sm font-bold text-gray-800">{item.quantity}</span>
                  </div>
                  {/* Condition */}
                  <span className="text-[10px] font-semibold px-2 py-1 rounded-full"
                    style={{ background: cc.bg, color: cc.text }}>
                    {conditionLabel[item.condition]}
                  </span>
                  {/* Location */}
                  {item.location && (
                    <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                      📍 {item.location}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="ip bg-white rounded-2xl shadow-2xl w-full max-w-md ip-in">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">{editing ? "Editar item" : "Novo item"}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 transition"><X size={18} /></button>
            </div>
            <form onSubmit={saveItem} className="px-6 py-5 flex flex-col gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Nome *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required placeholder="Ex: Cadeiras, Projetor…"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-teal-400 transition" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Descrição</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} placeholder="Detalhes opcionais…"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-teal-400 transition resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Quantidade</label>
                  <input type="number" min={1} value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-teal-400 transition" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Condição</label>
                  <div className="relative">
                    <select value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value as Condition }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-teal-400 transition appearance-none bg-white pr-8">
                      <option value="BOM">Bom</option>
                      <option value="REGULAR">Regular</option>
                      <option value="RUIM">Ruim</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-2.5 top-3 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Categoria</label>
                  <div className="relative">
                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-teal-400 transition appearance-none bg-white pr-8">
                      <option value="">Sem categoria</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-2.5 top-3 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Localização</label>
                  <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    placeholder="Ex: Sala 2, Armário A…"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-teal-400 transition" />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50 transition">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} style={{ background: AC }}
                  className="flex-1 text-white text-sm font-medium py-2.5 rounded-lg hover:opacity-90 transition disabled:opacity-60">
                  {saving ? "Salvando…" : editing ? "Salvar" : "Adicionar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
