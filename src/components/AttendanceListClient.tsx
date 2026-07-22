"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CalendarDays, ClipboardCheck, ClipboardList, ClipboardX, Clock, Pencil, UserRound, Users } from "lucide-react"
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
  /** Visitantes presentes neste evento */
  visitors?: number
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
        const req = overrides[event.id] ?? event.requiresAttendance
        const total = event.attendances.length
        const presentes = event.attendances.filter(a => a.isPresent).length
        const visitantes = event.visitors ?? 0
        // total === 0 significa que a chamada ainda não foi feita — diferente de
        // "chamada feita com todo mundo ausente" (aí total > 0 e presentes === 0).
        const registrada = total > 0
        const pct = registrada ? Math.round((presentes / total) * 100) : null

        return (
          <div
            key={event.id}
            className={`border rounded-xl transition-colors ${
              req ? "bg-white hover:bg-gray-50" : "bg-gray-50 border-dashed"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4">
              {/* ── Identificação do evento ─────────────────────────────────── */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {req ? (
                    <Link
                      href={buildTakeUrl(event.id)}
                      className="font-semibold text-base leading-snug text-gray-800 hover:underline underline-offset-2"
                    >
                      {event.title}
                    </Link>
                  ) : (
                    <h3 className="font-semibold text-base leading-snug text-gray-400">{event.title}</h3>
                  )}

                  {!req && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-200 text-gray-500 uppercase tracking-wide">
                      Sem presença
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-1.5">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays size={12} /> {new Date(event.date).toLocaleDateString("pt-BR")}
                  </span>
                  {event.startTime && (
                    <span className="inline-flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(event.startTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                  {event.society && (
                    <span className="inline-flex items-center gap-1">
                      <Users size={12} /> {event.society.name}
                    </span>
                  )}
                </div>

                {event.description && (
                  <p className="text-xs text-gray-400 mt-1.5 line-clamp-1">{event.description}</p>
                )}
              </div>

              {/* ── Resultado + ações ───────────────────────────────────────── */}
              {req && (
                <div className="flex items-center gap-3 shrink-0 flex-wrap">
                  {registrada ? (
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-800 leading-tight">
                          {presentes}<span className="text-gray-400 font-normal"> / {total}</span>
                        </div>
                        <div className="text-[11px] text-gray-400">presentes</div>
                      </div>

                      {pct !== null && (
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded-lg ${
                            pct >= 70
                              ? "bg-green-600 text-white"
                              : pct >= 40
                              ? "bg-amber-500 text-white"
                              : "bg-red-500 text-white"
                          }`}
                        >
                          {pct}%
                        </span>
                      )}

                      {visitantes > 0 && (
                        <span
                          title={`${visitantes} visitante(s) presente(s)`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg px-2 py-1"
                        >
                          <UserRound size={12} /> {visitantes}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 italic">Chamada não registrada</span>
                  )}

                  {/* Ação principal — explícita */}
                  <Link
                    href={buildTakeUrl(event.id)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition ${
                      registrada
                        ? "border border-gray-300 text-gray-700 hover:bg-gray-100"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {registrada ? <Pencil size={14} /> : <ClipboardList size={14} />}
                    {registrada ? "Editar chamada" : "Fazer chamada"}
                  </Link>

                  {/* Toggle — secundário, só ícone */}
                  {isAdmin && (
                    <button
                      onClick={(e) => handleToggle(e, event.id)}
                      disabled={toggling === event.id}
                      title="Desativar a presença neste evento"
                      className={`shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 transition
                        hover:bg-gray-100 hover:text-gray-600
                        ${toggling === event.id ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {toggling === event.id ? (
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <ClipboardX size={17} />
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Evento com presença desativada — só a ação de reativar */}
              {!req && isAdmin && (
                <button
                  onClick={(e) => handleToggle(e, event.id)}
                  disabled={toggling === event.id}
                  className={`shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-gray-300
                    text-sm font-medium text-gray-600 transition hover:bg-gray-100
                    ${toggling === event.id ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {toggling === event.id ? (
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ClipboardCheck size={15} />
                  )}
                  Reativar presença
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
