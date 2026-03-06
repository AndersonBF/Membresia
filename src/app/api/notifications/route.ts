// src/app/api/notifications/route.ts
import { currentUser } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json([], { status: 401 })

  const roles = (user.publicMetadata?.roles as string[]) ?? []
  const isAdmin = roles.includes("admin") || roles.includes("superadmin")
  if (!isAdmin) return NextResponse.json([])

  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(23, 59, 59, 999)

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)

  const [members, events, newMembers] = await Promise.all([
    prisma.member.findMany({
      where: { birthDate: { not: null }, isActive: true },
      select: { id: true, name: true, birthDate: true },
    }),
    prisma.event.findMany({
      where: { date: { gte: now, lte: tomorrow } },
      select: { id: true, title: true, date: true, startTime: true },
      orderBy: { date: "asc" },
      take: 5,
    }),
    prisma.member.findMany({
      where: { createdAt: { gte: yesterday } },
      select: { id: true, name: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ])

  const notifications: { id: string; type: string; title: string; message: string; time: string }[] = []

  members.forEach((m) => {
    const bd = new Date(m.birthDate!)
    if (bd.getDate() === now.getDate() && bd.getMonth() === now.getMonth()) {
      notifications.push({
        id: `bday-${m.id}`,
        type: "birthday",
        title: "🎂 Aniversário hoje",
        message: `${m.name} faz aniversário hoje!`,
        time: now.toISOString(),
      })
    }
  })

  events.forEach((ev) => {
    const hora = ev.startTime
      ? new Date(ev.startTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      : null
    notifications.push({
      id: `event-${ev.id}`,
      type: "event",
      title: "📅 Evento em breve",
      message: `"${ev.title}"${hora ? ` às ${hora}` : ""}`,
      time: ev.date.toISOString(),
    })
  })

  newMembers.forEach((m) => {
    notifications.push({
      id: `member-${m.id}`,
      type: "new_member",
      title: "👤 Novo membro",
      message: `${m.name} foi cadastrado(a).`,
      time: m.createdAt.toISOString(),
    })
  })

  return NextResponse.json(notifications)
}