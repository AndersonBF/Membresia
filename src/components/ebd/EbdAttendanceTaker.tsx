"use client"

import { useState, useEffect, useMemo, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"
import { ClipboardCheck, CalendarDays } from "lucide-react"
import { saveBibleSchoolAttendance } from "@/lib/actions"
import AttendanceSheetScanner, { type CreatedMember } from "@/components/AttendanceSheetScanner"

type MemberRef = { id: number; name: string; email: string | null }
type ExistingRec = { memberId: number; isPresent: boolean }

export default function EbdAttendanceTaker({
  classId,
  className,
  date,
  members: initialMembers,
  existing,
  topic: initialTopic,
}: {
  classId: number
  className: string
  date: string // YYYY-MM-DD
  members: MemberRef[]
  existing: ExistingRec[]
  topic: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [attendance, setAttendance] = useState<Record<number, boolean>>({})
  const [topic, setTopic] = useState(initialTopic)
  // Membros cadastrados na hora pela leitura da folha entram na lista sem
  // recarregar a página — recarregar perderia a chamada em andamento.
  const [addedMembers, setAddedMembers] = useState<MemberRef[]>([])

  // useMemo mantém a identidade estável: sem isso o efeito abaixo rodaria a
  // cada renderização e zeraria a chamada.
  const members = useMemo(
    () => [...initialMembers, ...addedMembers],
    [initialMembers, addedMembers],
  )

  // Depende só dos membros vindos do servidor: incluir os cadastrados na hora
  // faria o efeito rodar de novo e apagar as marcações da leitura da folha.
  useEffect(() => {
    const map: Record<number, boolean> = {}
    if (existing.length > 0) {
      existing.forEach((r) => { map[r.memberId] = r.isPresent })
      // membros sem registro anterior entram como ausentes por padrão
      initialMembers.forEach((m) => { if (!(m.id in map)) map[m.id] = false })
    } else {
      initialMembers.forEach((m) => { map[m.id] = true })
    }
    setAttendance(map)
  }, [existing, initialMembers])

  const toggle = (id: number) => setAttendance((p) => ({ ...p, [id]: !p[id] }))
  const markAll = (val: boolean) => {
    const m: Record<number, boolean> = {}
    members.forEach((mem) => { m[mem.id] = val })
    setAttendance(m)
  }

  // Foto da folha de papel: quem foi reconhecido entra como presente, o resto
  // como ausente — a chamada da foto é a chamada do dia.
  const applyScan = (presentIds: number[]) => {
    const present = new Set(presentIds)
    const m: Record<number, boolean> = {}
    members.forEach((mem) => { m[mem.id] = present.has(mem.id) })
    // Membros criados agora ainda não estão em `members` nesta renderização.
    presentIds.forEach((id) => { m[id] = true })
    setAttendance(m)
  }

  const presentCount = members.filter((m) => attendance[m.id]).length
  const pct = members.length > 0 ? ((presentCount / members.length) * 100).toFixed(0) : "0"

  const changeDate = (newDate: string) => {
    if (newDate) router.push(`/ebd/turma/${classId}/chamada?date=${newDate}`)
  }

  const handleSave = () => {
    const records = members.map((m) => ({ memberId: m.id, isPresent: !!attendance[m.id] }))
    startTransition(async () => {
      const res = await saveBibleSchoolAttendance(
        { success: false, error: false },
        { classId, date, topic, records }
      )
      if (res.success) {
        toast.success("Chamada salva com sucesso!")
        router.push(`/ebd/turma/${classId}`)
        router.refresh()
      } else {
        toast.error("Erro ao salvar a chamada.")
      }
    })
  }

  const prettyDate = new Date(`${date}T00:00:00.000Z`).toLocaleDateString("pt-BR", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric", timeZone: "UTC",
  })

  return (
    <div className="flex flex-col gap-5">
      {/* Cabeçalho */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ClipboardCheck size={20} className="text-amber-700" /> Chamada — {className}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5 capitalize">{prettyDate}</p>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <CalendarDays size={15} className="text-amber-700" />
            <input
              type="date"
              value={date}
              onChange={(e) => changeDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            />
          </label>
        </div>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Lição / tema do dia (opcional)"
          className="mt-3 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
        />
      </div>

      {members.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-10">Nenhum membro ativo nesta turma.</p>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
            <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-3">
              <button onClick={() => markAll(true)} className="px-3 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600">
                ✓ Todos presentes
              </button>
              <button onClick={() => markAll(false)} className="px-3 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600">
                ✗ Todos ausentes
              </button>
            </div>

            <AttendanceSheetScanner
              candidates={members.map((m) => ({ id: m.id, name: m.name }))}
              onApply={applyScan}
              role="ebd"
              classId={classId}
              onMembersCreated={(created: CreatedMember[]) =>
                setAddedMembers((prev) => [
                  ...prev,
                  ...created.map((c) => ({ id: c.id, name: c.name, email: c.email })),
                ])
              }
              accentColor="#b45309"
            />

            <div className="sm:ml-auto text-sm font-semibold flex items-center gap-3 flex-wrap">
              <span className="text-2xl font-bold text-amber-700 leading-none">{pct}%</span>
              <span className="text-green-600 whitespace-nowrap">Presentes: {presentCount}</span>
              <span className="text-red-600 whitespace-nowrap">Ausentes: {members.length - presentCount}</span>
            </div>
          </div>

          <div className="border rounded-xl overflow-hidden">
            <div className="max-h-[500px] overflow-y-auto">
              {members.map((m, i) => (
                <div key={m.id} className={`flex items-center justify-between p-3.5 hover:bg-gray-50 ${i < members.length - 1 ? "border-b" : ""}`}>
                  <label className="flex items-center gap-3 flex-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={attendance[m.id] || false}
                      onChange={() => toggle(m.id)}
                      className="w-6 h-6 cursor-pointer accent-green-500"
                    />
                    <div>
                      <div className="font-medium text-gray-800">{m.name}</div>
                      {m.email && <div className="text-xs text-gray-400">{m.email}</div>}
                    </div>
                  </label>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${attendance[m.id] ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}`}>
                    {attendance[m.id] ? "✓ Presente" : "✗ Ausente"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 sticky bottom-0 bg-white pt-3 border-t">
            <button
              onClick={handleSave}
              disabled={pending}
              className="flex-1 bg-amber-600 text-white px-6 py-3 rounded-xl hover:bg-amber-700 disabled:opacity-50 font-semibold"
            >
              {pending ? "Salvando..." : "💾 Salvar chamada"}
            </button>
            <button
              onClick={() => router.push(`/ebd/turma/${classId}`)}
              className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-300"
            >
              Cancelar
            </button>
          </div>
        </>
      )}
    </div>
  )
}
