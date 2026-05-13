"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, Trash2, AlertCircle, X, ChevronDown } from "lucide-react"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"

type Priority = "ALTA" | "MEDIA" | "BAIXA"
type Status   = "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDA"

interface Task {
  id: number
  title: string
  description: string | null
  priority: Priority
  status: Status
  dueDate: string | null
  completedAt: string | null
  createdAt: string
}

const priorityLabel: Record<Priority, string> = { ALTA: "Alta", MEDIA: "Média", BAIXA: "Baixa" }
const priorityColor: Record<Priority, { bg: string; text: string; border: string }> = {
  ALTA:  { bg: "#fef2f2", text: "#dc2626", border: "#fecaca" },
  MEDIA: { bg: "#fffbeb", text: "#d97706", border: "#fde68a" },
  BAIXA: { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" },
}

const COLUMNS: { id: Status; label: string; accent: string; light: string }[] = [
  { id: "PENDENTE",     label: "Pendente",     accent: "#6b7280", light: "#f9fafb" },
  { id: "EM_ANDAMENTO", label: "Em andamento", accent: "#d97706", light: "#fffbeb" },
  { id: "CONCLUIDA",    label: "Concluída",    accent: "#0d9488", light: "#f0fdfa" },
]

const AC = "#0d9488"

function formatDate(d: string | null) {
  if (!d) return null
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
}

function isOverdue(dueDate: string | null, status: Status) {
  if (!dueDate || status === "CONCLUIDA") return false
  return new Date(dueDate) < new Date()
}

export default function TarefasPage() {
  const [tasks, setTasks]       = useState<Task[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: "", description: "", priority: "MEDIA" as Priority, dueDate: "" })
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const res = await fetch("/api/diaconia/tasks")
    setTasks(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function createTask(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    await fetch("/api/diaconia/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, dueDate: form.dueDate || null }),
    })
    setForm({ title: "", description: "", priority: "MEDIA", dueDate: "" })
    setShowForm(false)
    setSaving(false)
    load()
  }

  async function deleteTask(id: number) {
    setTasks(prev => prev.filter(t => t.id !== id))
    await fetch(`/api/diaconia/tasks/${id}`, { method: "DELETE" })
  }

  async function onDragEnd(result: DropResult) {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const newStatus = destination.droppableId as Status
    const taskId = parseInt(draggableId)

    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))

    await fetch(`/api/diaconia/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
  }

  const byStatus = (status: Status) =>
    tasks.filter(t => t.status === status)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');
        .tp { font-family:'DM Sans',sans-serif; }
        @keyframes tp-in { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .tp-in { animation: tp-in 0.3s ease both; }
        .task-card { transition: box-shadow .15s; cursor: grab; }
        .task-card:active { cursor: grabbing; }
        .task-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.1); }
        .del-btn { opacity:0; transition: opacity .15s; }
        .task-card:hover .del-btn { opacity:1; }
        .col-drop { transition: background .15s; min-height: 120px; }
      ` }} />

      <div className="tp bg-gray-50 min-h-screen p-4 md:p-6 flex flex-col">

        {/* Header */}
        <div className="tp-in mb-6 flex items-start justify-between gap-4">
          <div>
            <Link href="/diaconia" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-xs transition mb-3">
              <ArrowLeft size={13} /> Voltar para Diaconia
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Tarefas</h1>
            <p className="text-sm text-gray-400 mt-0.5">Arraste os cards entre as colunas para atualizar o status</p>
          </div>
          <button onClick={() => setShowForm(true)} style={{ background: AC }}
            className="inline-flex items-center gap-2 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm hover:opacity-90 transition mt-7 flex-shrink-0">
            <Plus size={15} /> Nova tarefa
          </button>
        </div>

        {/* Kanban board */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Carregando…</div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 tp-in" style={{ animationDelay: ".05s" }}>
              {COLUMNS.map(col => {
                const colTasks = byStatus(col.id)
                return (
                  <div key={col.id} className="flex flex-col rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm">
                    {/* Column header */}
                    <div className="px-4 py-3.5 flex items-center gap-2.5 border-b border-gray-100"
                      style={{ background: col.light }}>
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: col.accent }} />
                      <span className="font-semibold text-gray-700 text-sm">{col.label}</span>
                      <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full text-white"
                        style={{ background: col.accent }}>
                        {colTasks.length}
                      </span>
                    </div>

                    {/* Droppable area */}
                    <Droppable droppableId={col.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="col-drop flex-1 p-3 flex flex-col gap-2.5"
                          style={{
                            background: snapshot.isDraggingOver
                              ? col.id === "PENDENTE" ? "#f3f4f6"
                              : col.id === "EM_ANDAMENTO" ? "#fef9ee"
                              : "#f0fdf9"
                              : "transparent",
                          }}
                        >
                          {colTasks.length === 0 && !snapshot.isDraggingOver && (
                            <p className="text-xs text-gray-300 text-center pt-6 select-none">
                              Nenhuma tarefa
                            </p>
                          )}

                          {colTasks.map((task, index) => {
                            const pc = priorityColor[task.priority]
                            const overdue = isOverdue(task.dueDate, task.status)
                            return (
                              <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className="task-card bg-white rounded-xl border border-gray-100 p-3.5 relative"
                                    style={{
                                      ...provided.draggableProps.style,
                                      boxShadow: snapshot.isDragging
                                        ? "0 8px 30px rgba(0,0,0,0.15)"
                                        : undefined,
                                      opacity: snapshot.isDragging ? 0.95 : 1,
                                      borderColor: snapshot.isDragging ? col.accent : undefined,
                                    }}
                                  >
                                    {/* Top bar with priority + delete */}
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                        style={{ background: pc.bg, color: pc.text, border: `1px solid ${pc.border}` }}>
                                        {priorityLabel[task.priority]}
                                      </span>
                                      <button onClick={() => deleteTask(task.id)}
                                        className="del-btn text-gray-300 hover:text-red-400 transition">
                                        <Trash2 size={13} />
                                      </button>
                                    </div>

                                    {/* Title */}
                                    <p className="text-sm font-medium text-gray-800 leading-snug mb-1">
                                      {task.title}
                                    </p>

                                    {/* Description */}
                                    {task.description && (
                                      <p className="text-xs text-gray-400 line-clamp-2 mb-2">{task.description}</p>
                                    )}

                                    {/* Due date */}
                                    {task.dueDate && (
                                      <div className={`flex items-center gap-1 text-[11px] font-medium mt-1 ${overdue ? "text-red-500" : "text-gray-400"}`}>
                                        {overdue && <AlertCircle size={10} />}
                                        <span>{overdue ? "Vencida: " : ""}{formatDate(task.dueDate)}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </Draggable>
                            )
                          })}

                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                )
              })}
            </div>
          </DragDropContext>
        )}
      </div>

      {/* Create modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="tp bg-white rounded-2xl shadow-2xl w-full max-w-md"
            style={{ animation: "tp-in 0.2s ease both" }}>
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Nova tarefa</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 transition">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={createTask} className="px-6 py-5 flex flex-col gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Título *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  required autoFocus placeholder="Descreva a tarefa…"
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
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Prioridade</label>
                  <div className="relative">
                    <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Priority }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-teal-400 transition appearance-none bg-white pr-8">
                      <option value="ALTA">Alta</option>
                      <option value="MEDIA">Média</option>
                      <option value="BAIXA">Baixa</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-2.5 top-3 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Prazo</label>
                  <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
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
                  {saving ? "Salvando…" : "Criar tarefa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
