"use client"

import { useState } from "react"
import { useFormState } from "react-dom"
import { createFinance, deleteFinance, updateFinance } from "@/lib/actions"
import { TrendingUp, TrendingDown, Wallet, Plus, Trash2, X, Download, Pencil } from "lucide-react"

type Finance = {
  id: number
  description: string
  type: "ENTRADA" | "SAIDA"
  value: number
  date: Date
  month: number
  year: number
  societyId: number | null
  society?: { name: string } | null
}

type Society = {
  id: number
  name: string
}

type Props = {
  finances: Finance[]
  societies: Society[]
  societyId: number | null
  roleContext: string | null
  isAdmin: boolean
}

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

export default function FinancePage({ finances, societies, societyId, roleContext, isAdmin }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [showSaldoForm, setShowSaldoForm] = useState(false)
  const [editingFinance, setEditingFinance] = useState<Finance | null>(null)
  const [saldoInicial, setSaldoInicial] = useState(0)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())

  const [createState, createAction] = useFormState(createFinance, { success: false, error: false })
  const [deleteState, deleteAction] = useFormState(deleteFinance, { success: false, error: false })
  const [updateState, updateAction] = useFormState(updateFinance, { success: false, error: false })

  const filtered = finances.filter((f) => {
    const matchMonth = selectedMonth ? f.month === selectedMonth : true
    const matchYear = f.year === selectedYear
    return matchMonth && matchYear
  })

  const totalEntradas = finances.filter(f => f.type === "ENTRADA").reduce((s, f) => s + f.value, 0)
  const totalSaidas = finances.filter(f => f.type === "SAIDA").reduce((s, f) => s + f.value, 0)
  const saldoGeral = saldoInicial + totalEntradas - totalSaidas

  const entradasFiltradas = filtered.filter(f => f.type === "ENTRADA").reduce((s, f) => s + f.value, 0)
  const saidasFiltradas = filtered.filter(f => f.type === "SAIDA").reduce((s, f) => s + f.value, 0)
  const saldoFiltrado = entradasFiltradas - saidasFiltradas

  const resumoPorMes = Array.from({ length: 12 }, (_, i) => {
    const mes = i + 1
    const doMes = finances.filter(f => f.month === mes && f.year === selectedYear)
    const entradas = doMes.filter(f => f.type === "ENTRADA").reduce((s, f) => s + f.value, 0)
    const saidas = doMes.filter(f => f.type === "SAIDA").reduce((s, f) => s + f.value, 0)
    return { mes, entradas, saidas, saldo: entradas - saidas }
  })

  const years = [...new Set(finances.map(f => f.year))].sort((a, b) => b - a)
  if (!years.includes(new Date().getFullYear())) years.unshift(new Date().getFullYear())

  const exportToExcel = () => {
    const rows = [
      ["Data", "Descrição", "Tipo", "Valor (R$)", "Sociedade"],
      ...finances.map(f => [
        new Date(f.date).toLocaleDateString("pt-BR"),
        f.description,
        f.type === "ENTRADA" ? "Entrada" : "Saída",
        f.value.toFixed(2).replace(".", ","),
        f.society?.name ?? "Geral",
      ]),
      [],
      ["", "", "Total Entradas", totalEntradas.toFixed(2).replace(".", ","), ""],
      ["", "", "Total Saídas", totalSaidas.toFixed(2).replace(".", ","), ""],
      ["", "", "Saldo Inicial", saldoInicial.toFixed(2).replace(".", ","), ""],
      ["", "", "Saldo Final", saldoGeral.toFixed(2).replace(".", ","), ""],
    ]
    const csv = rows.map(r => r.join(";")).join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `financeiro_${roleContext ?? "geral"}_${selectedYear}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-700">
          Financeiro {roleContext ? `— ${roleContext.toUpperCase()}` : ""}
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 border border-gray-200 text-gray-600 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
          >
            <Download size={16} />
            Exportar
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition"
          >
            <Plus size={16} />
            Novo Lançamento
          </button>
        </div>
      </div>

      {/* CARDS TOTAIS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4">
          <div className="bg-green-100 p-3 rounded-xl">
            <TrendingUp size={24} className="text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Entradas</p>
            <p className="text-base font-bold text-green-600">
              R$ {totalEntradas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4">
          <div className="bg-red-100 p-3 rounded-xl">
            <TrendingDown size={24} className="text-red-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Saídas</p>
            <p className="text-base font-bold text-red-500">
              R$ {totalSaidas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
        <div
          onClick={() => setShowSaldoForm(true)}
          className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition group"
        >
          <div className="bg-purple-100 p-3 rounded-xl">
            <Pencil size={24} className="text-purple-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Saldo Inicial</p>
            <p className="text-base font-bold text-purple-500">
              R$ {saldoInicial.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-400 group-hover:text-purple-400 transition">clique para editar</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4">
          <div className={`p-3 rounded-xl ${saldoGeral >= 0 ? "bg-blue-100" : "bg-orange-100"}`}>
            <Wallet size={24} className={saldoGeral >= 0 ? "text-blue-600" : "text-orange-500"} />
          </div>
          <div>
            <p className="text-xs text-gray-400">Saldo Total</p>
            <p className={`text-base font-bold ${saldoGeral >= 0 ? "text-blue-600" : "text-orange-500"}`}>
              R$ {saldoGeral.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* RESUMO POR MÊS */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-600">Resumo por Mês</h2>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-100">
                <th className="text-left py-2 font-medium">Mês</th>
                <th className="text-right py-2 font-medium text-green-600">Entradas</th>
                <th className="text-right py-2 font-medium text-red-500">Saídas</th>
                <th className="text-right py-2 font-medium text-blue-600">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {resumoPorMes.map(({ mes, entradas, saidas, saldo }) => (
                <tr
                  key={mes}
                  onClick={() => setSelectedMonth(selectedMonth === mes ? null : mes)}
                  className={`border-b border-gray-50 cursor-pointer transition hover:bg-gray-50 ${selectedMonth === mes ? "bg-green-50" : ""}`}
                >
                  <td className="py-2 text-gray-600">{MONTHS[mes - 1]}</td>
                  <td className="py-2 text-right text-green-600">
                    {entradas > 0 ? `R$ ${entradas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}
                  </td>
                  <td className="py-2 text-right text-red-500">
                    {saidas > 0 ? `R$ ${saidas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}
                  </td>
                  <td className={`py-2 text-right font-medium ${saldo >= 0 ? "text-blue-600" : "text-orange-500"}`}>
                    {(entradas > 0 || saidas > 0) ? `R$ ${saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* LANÇAMENTOS */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-600">
            Lançamentos {selectedMonth ? `— ${MONTHS[selectedMonth - 1]} ${selectedYear}` : `— ${selectedYear}`}
          </h2>
          {selectedMonth && (
            <div className="flex items-center gap-4 text-sm">
              <span className="text-green-600 font-medium">
                + R$ {entradasFiltradas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
              <span className="text-red-500 font-medium">
                - R$ {saidasFiltradas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
              <span className={`font-bold ${saldoFiltrado >= 0 ? "text-blue-600" : "text-orange-500"}`}>
                = R$ {saldoFiltrado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>

        {filtered.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">Nenhum lançamento encontrado.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((f) => (
              <div key={f.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${f.type === "ENTRADA" ? "bg-green-100" : "bg-red-100"}`}>
                    {f.type === "ENTRADA"
                      ? <TrendingUp size={16} className="text-green-600" />
                      : <TrendingDown size={16} className="text-red-500" />
                    }
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">{f.description}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(f.date).toLocaleDateString("pt-BR")}
                      {f.society && ` • ${f.society.name}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-semibold text-sm ${f.type === "ENTRADA" ? "text-green-600" : "text-red-500"}`}>
                    {f.type === "ENTRADA" ? "+" : "-"} R$ {f.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                  {/* BOTÃO EDITAR */}
                  <button
                    onClick={() => setEditingFinance(f)}
                    className="text-gray-300 hover:text-blue-400 transition"
                  >
                    <Pencil size={16} />
                  </button>
                  {/* BOTÃO DELETAR */}
                  <form action={deleteAction}>
                    <input type="hidden" name="id" value={f.id} />
                    <input type="hidden" name="societyId" value={societyId ?? ""} />
                    <input type="hidden" name="roleContext" value={roleContext ?? ""} />
                    <button type="submit" className="text-gray-300 hover:text-red-400 transition">
                      <Trash2 size={16} />
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL SALDO INICIAL */}
      {showSaldoForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-700">Saldo Inicial do Caixa</h2>
              <button onClick={() => setShowSaldoForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <p className="text-sm text-gray-500">
                Informe o valor que já estava em caixa antes dos lançamentos registrados aqui.
              </p>
              <input
                type="number"
                min="0"
                step="0.01"
                value={saldoInicial}
                onChange={(e) => setSaldoInicial(parseFloat(e.target.value) || 0)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-500"
              />
              <button
                onClick={() => setShowSaldoForm(false)}
                className="w-full bg-green-600 text-white rounded-xl py-2 text-sm font-medium hover:bg-green-700 transition"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NOVO LANÇAMENTO */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-700">Novo Lançamento</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form
              action={async (formData) => {
                if (societyId) formData.set("societyId", String(societyId))
                if (roleContext) formData.set("roleContext", roleContext)
                await createAction(formData)
                setShowForm(false)
              }}
              className="flex flex-col gap-4"
            >
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Tipo</label>
                <div className="flex gap-3">
                  <label className="flex-1 flex items-center gap-2 border-2 border-gray-200 rounded-xl p-3 cursor-pointer has-[:checked]:border-green-500 has-[:checked]:bg-green-50">
                    <input type="radio" name="type" value="ENTRADA" defaultChecked className="accent-green-600" />
                    <TrendingUp size={16} className="text-green-600" />
                    <span className="text-sm font-medium text-gray-700">Entrada</span>
                  </label>
                  <label className="flex-1 flex items-center gap-2 border-2 border-gray-200 rounded-xl p-3 cursor-pointer has-[:checked]:border-red-500 has-[:checked]:bg-red-50">
                    <input type="radio" name="type" value="SAIDA" className="accent-red-500" />
                    <TrendingDown size={16} className="text-red-500" />
                    <span className="text-sm font-medium text-gray-700">Saída</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Descrição</label>
                <input
                  type="text"
                  name="description"
                  required
                  placeholder="Ex: Oferta do culto"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Valor (R$)</label>
                <input
                  type="number"
                  name="value"
                  required
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Data</label>
                <input
                  type="date"
                  name="date"
                  required
                  defaultValue={new Date().toISOString().split("T")[0]}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                />
              </div>
              {isAdmin && !societyId && societies.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Sociedade (opcional)</label>
                  <select
                    name="societyId"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                  >
                    <option value="">Geral (Igreja)</option>
                    {societies.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {createState.error && (
                <p className="text-red-500 text-xs">Erro ao salvar. Tente novamente.</p>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-2 text-sm hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white rounded-xl py-2 text-sm font-medium hover:bg-green-700 transition"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR LANÇAMENTO */}
      {editingFinance && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-700">Editar Lançamento</h2>
              <button onClick={() => setEditingFinance(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form
              action={async (formData) => {
                formData.set("id", String(editingFinance.id))
                if (societyId) formData.set("societyId", String(societyId))
                if (roleContext) formData.set("roleContext", roleContext)
                await updateAction(formData)
                setEditingFinance(null)
              }}
              className="flex flex-col gap-4"
            >
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Tipo</label>
                <div className="flex gap-3">
                  <label className="flex-1 flex items-center gap-2 border-2 border-gray-200 rounded-xl p-3 cursor-pointer has-[:checked]:border-green-500 has-[:checked]:bg-green-50">
                    <input
                      type="radio"
                      name="type"
                      value="ENTRADA"
                      defaultChecked={editingFinance.type === "ENTRADA"}
                      className="accent-green-600"
                    />
                    <TrendingUp size={16} className="text-green-600" />
                    <span className="text-sm font-medium text-gray-700">Entrada</span>
                  </label>
                  <label className="flex-1 flex items-center gap-2 border-2 border-gray-200 rounded-xl p-3 cursor-pointer has-[:checked]:border-red-500 has-[:checked]:bg-red-50">
                    <input
                      type="radio"
                      name="type"
                      value="SAIDA"
                      defaultChecked={editingFinance.type === "SAIDA"}
                      className="accent-red-500"
                    />
                    <TrendingDown size={16} className="text-red-500" />
                    <span className="text-sm font-medium text-gray-700">Saída</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Descrição</label>
                <input
                  type="text"
                  name="description"
                  required
                  defaultValue={editingFinance.description}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Valor (R$)</label>
                <input
                  type="number"
                  name="value"
                  required
                  min="0"
                  step="0.01"
                  defaultValue={editingFinance.value}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Data</label>
                <input
                  type="date"
                  name="date"
                  required
                  defaultValue={new Date(editingFinance.date).toISOString().split("T")[0]}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                />
              </div>
              {updateState.error && (
                <p className="text-red-500 text-xs">Erro ao atualizar. Tente novamente.</p>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingFinance(null)}
                  className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-2 text-sm hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white rounded-xl py-2 text-sm font-medium hover:bg-blue-700 transition"
                >
                  Atualizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}