"use client"

import { useEffect, useRef, useState } from "react"
import { Bell, X, Gift, Calendar, UserPlus } from "lucide-react"

interface Notif {
  id: string
  type: string
  title: string
  message: string
  time: string
}

const icons: Record<string, React.ElementType> = {
  birthday: Gift,
  event: Calendar,
  new_member: UserPlus,
}

const colors: Record<string, string> = {
  birthday:   "bg-pink-50 text-pink-600",
  event:      "bg-blue-50 text-blue-600",
  new_member: "bg-green-50 text-green-600",
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (h < 1)  return "agora"
  if (h < 24) return `${h}h atrás`
  return `${d}d atrás`
}

export default function NotificationBell() {
  const [items, setItems]   = useState<Notif[]>([])
  const [read, setRead]     = useState<Set<string>>(new Set())
  const [open, setOpen]     = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("/api/notifications").then(r => r.json()).then(setItems).catch(() => {})
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const unread = items.filter(n => !read.has(n.id)).length

  function handleOpen() {
    setOpen(v => !v)
    if (!open) setRead(new Set(items.map(n => n.id)))
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative bg-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-50 transition shadow-sm"
      >
        <Bell size={17} className={unread > 0 ? "text-green-600" : "text-gray-500"} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-bold text-gray-800">Notificações</span>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {items.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">Nenhuma notificação</div>
            ) : items.map((n) => {
              const Icon = icons[n.type] ?? Bell
              const color = colors[n.type] ?? "bg-gray-50 text-gray-500"
              return (
                <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition">
                  <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${color}`}>
                    <Icon size={13} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-700">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.time)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}