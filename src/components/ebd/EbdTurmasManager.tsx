"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"
import { Plus, Trash2, Check, X, UserPlus, GraduationCap } from "lucide-react"
import {
  createBibleSchoolClass,
  updateBibleSchoolClass,
  deleteBibleSchoolClass,
  assignClassTeacher,
  removeClassTeacher,
} from "@/lib/actions"

type TeacherRef = { memberId: number; name: string }
type ClassRow = { id: number; name: string; memberCount: number; teachers: TeacherRef[] }
type MemberRef = { id: number; name: string }

const EMPTY = { success: false, error: false }

export default function EbdTurmasManager({
  classes,
  allMembers,
}: {
  classes: ClassRow[]
  allMembers: MemberRef[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [newName, setNewName] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const [teacherSel, setTeacherSel] = useState<Record<number, string>>({})

  const run = (fn: () => Promise<{ success: boolean; error: boolean }>, ok: string) => {
    startTransition(async () => {
      const res = await fn()
      if (res.success) {
        toast.success(ok)
        router.refresh()
      } else {
        toast.error("Ocorreu um erro. Verifique suas permissões e tente novamente.")
      }
    })
  }

  const handleCreate = () => {
    if (!newName.trim()) return
    run(() => createBibleSchoolClass(EMPTY, { name: newName.trim() }), "Turma criada!")
    setNewName("")
  }

  const handleRename = (id: number) => {
    if (!editName.trim()) return
    run(() => updateBibleSchoolClass(EMPTY, { id, name: editName.trim() }), "Turma renomeada!")
    setEditingId(null)
  }

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`Excluir a turma "${name}"? As chamadas dessa turma também serão removidas.`)) return
    const fd = new FormData()
    fd.append("id", String(id))
    run(() => deleteBibleSchoolClass(EMPTY, fd), "Turma excluída!")
  }

  const handleAddTeacher = (classId: number) => {
    const memberId = Number(teacherSel[classId])
    if (!memberId) return
    run(() => assignClassTeacher(EMPTY, { classId, memberId }), "Professora atribuída!")
    setTeacherSel((p) => ({ ...p, [classId]: "" }))
  }

  const handleRemoveTeacher = (classId: number, memberId: number) => {
    const fd = new FormData()
    fd.append("classId", String(classId))
    fd.append("memberId", String(memberId))
    run(() => removeClassTeacher(EMPTY, fd), "Professora removida!")
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Criar turma */}
      <div className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder="Nome da nova turma (ex.: Turma 3 — 6 a 11 anos)"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
        />
        <button
          onClick={handleCreate}
          disabled={pending || !newName.trim()}
          className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium flex items-center gap-1.5 hover:bg-amber-700 disabled:opacity-50"
        >
          <Plus size={15} /> Criar
        </button>
      </div>

      {/* Lista de turmas */}
      {classes.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-8">Nenhuma turma cadastrada ainda.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {classes.map((c) => {
            const teacherIds = new Set(c.teachers.map((t) => t.memberId))
            const available = allMembers.filter((m) => !teacherIds.has(m.id))
            return (
              <div key={c.id} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                      <GraduationCap size={18} className="text-amber-700" />
                    </div>
                    {editingId === c.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleRename(c.id)}
                          className="flex-1 border border-gray-300 rounded-lg px-2 py-1 text-sm"
                          autoFocus
                        />
                        <button onClick={() => handleRename(c.id)} className="p-1.5 rounded-md bg-green-100 text-green-700 hover:bg-green-200">
                          <Check size={15} />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-1.5 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200">
                          <X size={15} />
                        </button>
                      </div>
                    ) : (
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{c.name}</h3>
                        <p className="text-xs text-gray-400">{c.memberCount} {c.memberCount === 1 ? "membro" : "membros"}</p>
                      </div>
                    )}
                  </div>

                  {editingId !== c.id && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => { setEditingId(c.id); setEditName(c.name) }}
                        className="text-xs px-2.5 py-1.5 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200"
                      >
                        Renomear
                      </button>
                      <button
                        onClick={() => handleDelete(c.id, c.name)}
                        className="p-1.5 rounded-md bg-red-50 text-red-600 hover:bg-red-100"
                        title="Excluir turma"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Professoras */}
                <div className="mt-3 pl-12">
                  <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1.5">Professoras</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {c.teachers.length === 0 && (
                      <span className="text-xs text-gray-400 italic">Nenhuma professora atribuída</span>
                    )}
                    {c.teachers.map((t) => (
                      <span key={t.memberId} className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 text-xs px-2.5 py-1 rounded-full">
                        {t.name}
                        <button onClick={() => handleRemoveTeacher(c.id, t.memberId)} className="hover:text-red-600" title="Remover">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 mt-2.5">
                    <select
                      value={teacherSel[c.id] ?? ""}
                      onChange={(e) => setTeacherSel((p) => ({ ...p, [c.id]: e.target.value }))}
                      className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm max-w-xs"
                    >
                      <option value="">Selecionar membro…</option>
                      {available.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleAddTeacher(c.id)}
                      disabled={pending || !teacherSel[c.id]}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-medium flex items-center gap-1 hover:bg-amber-700 disabled:opacity-50"
                    >
                      <UserPlus size={13} /> Atribuir
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
