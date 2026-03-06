"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ClipboardCheck, ClipboardX, Eye } from "lucide-react"
import { toast } from "react-toastify"

type Event = {
  id: number
  title: string
  description: string | null
  date: string | Date
  startTime: string | Date | null
  requiresAttendance: boolean
  society: { name: string } | null
  attendances: { isPresent: boolean }[]
}

type Props = {
  events: Event[]
  roleContext: string | null
  societyId: string | null
  isAdmin: boolean
}

export default function AttendanceListClient({ events, roleContext, societyId, isAdmin }: Props) {
  const buildTakeUrl = (eventId: number) => {
    const params = new URLSearchParams()
    params.set("eventId", eventId.toString())
    if (roleContext) params.set("roleContext", roleContext)
    if (societyId)   params.set("societyId", societyId)
    return `/list/attendance/take?${params.toString()}`
  }
  const router = useRouter()
  const [toggling, setToggling] = useState<number | null>(null)
  // Estado local para refletir mudanças imediatamente sem reload
  const [overrides, setOverrides] = useState<Record<number, boolean>>({})

  async function handleToggle(e: React.MouseEvent, eventId: number) {
    e.preventDefault()
    e.stopPropagation()
    if (toggling) return
    setToggling(eventId)
    try {
      const res = await fetch(`/api/events/${eventId}/attendance-toggle`, { method: "PATCH" })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setOverrides(prev => ({ ...prev, [eventId]: data.requiresAttendance }))
      toast.success(
        data.requiresAttendance
          ? "Presença reativada para este evento"
          : "Presença desativada para este evento"
      )
      router.refresh()
    } catch {
      toast.error("Erro ao alterar configuração")
    } finally {
      setToggling(null)
    }
  }

  return (
    <div className="space-y-3">
      {events.map((event) => {
        const requiresAttendance = (eventId: number) => overrides[eventId] ?? event.requiresAttendance
        const req = requiresAttendance(event.id)
        const total = event.attendances.length
        const presentes = event.attendances.filter(a => a.isPresent).length
        const pct = total > 0 ? Math.round((presentes / total) * 100) : null

        return (
          <div
            key={event.id}
            className={`border rounded-xl transition-colors ${
              req ? "bg-white hover:bg-gray-50" : "bg-gray-50 border-dashed"
            }`}
          >
            <div className="flex items-center gap-3 p-4">
              {/* Conteúdo clicável → vai para o take */}
              <Link
                href={req ? buildTakeUrl(event.id) : "#"}
                className={`flex-1 min-w-0 ${!req ? "pointer-events-none" : ""}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`font-semibold text-base leading-snug ${!req ? "text-gray-400" : "text-gray-800"}`}>
                        {event.title}
                      </h3>
                      {!req && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-200 text-gray-500 uppercase tracking-wide">
                          Sem presença
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-1.5">
                      <span>📅 {new Date(event.date).toLocaleDateString("pt-BR")}</span>
                      {event.startTime && (
                        <span>
                          🕐 {new Date(event.startTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                      {event.society && <span>👥 {event.society.name}</span>}
                    </div>
                    {event.description && (
                      <p className="text-xs text-gray-400 mt-1.5 line-clamp-1">{event.description}</p>
                    )}
                  </div>

                  {/* Stats de presença */}
                  {req && (
                    <div className="flex items-center gap-3 shrink-0">
                      {pct !== null && (
                        <div className="text-right hidden sm:block">
                          <div className="text-lg font-bold text-blue-600 leading-none">{pct}%</div>
                          <div className="text-[10px] text-gray-400 mt-0.5">presença</div>
                        </div>
                      )}
                      <div className="text-right">
                        <div className="text-sm font-semibold text-blue-600">{presentes} presentes</div>
                        <div className="text-xs text-gray-400">de {total}</div>
                      </div>
                      <div className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-50">
                        <Eye size={16} className="text-blue-500" />
                      </div>
                    </div>
                  )}
                </div>
              </Link>

              {/* Toggle — só para admins */}
              {isAdmin && (
                <button
                  onClick={(e) => handleToggle(e, event.id)}
                  disabled={toggling === event.id}
                  title={req ? "Desativar presença neste evento" : "Reativar presença neste evento"}
                  className={`shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl border text-xs font-medium transition-all
                    ${toggling === event.id ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                    ${req
                      ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                      : "border-gray-200 bg-white text-gray-400 hover:bg-gray-100"
                    }`}
                >
                  {toggling === event.id ? (
                    <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : req ? (
                    <ClipboardCheck size={18} />
                  ) : (
                    <ClipboardX size={18} />
                  )}
                  <span>{req ? "Ativo" : "Inativo"}</span>
                </button>
              )}
            </div>
          </div>
        )
      })}

      {events.length === 0 && (
        <div className="text-center py-12 text-gray-400 text-sm">Nenhum evento encontrado</div>
      )}
    </div>
  )
}