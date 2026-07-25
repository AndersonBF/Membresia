// src/app/api/notifications/route.ts
import { currentUser } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { startOfDaySP, addDays, spParts } from "@/lib/tz"

export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json([], { status: 401 })

  const roles = (user.publicMetadata?.roles as string[]) ?? []
  const isAdmin = roles.includes("admin") || roles.includes("superadmin")
  if (!isAdmin) return NextResponse.json([])

  // Preferências de notificação (definidas em Configurações → Notificações).
  const settings = await prisma.churchSettings.findFirst({ select: { preferences: true } })
  const notif = ((settings?.preferences as any)?.notificacoes ?? {}) as Record<string, boolean>
  const wantBirthdays = notif.aniversarios ?? true
  const wantNewMembers = notif.novos_membros ?? true
  const wantEvents = notif.eventos_proximos ?? true

  const now = new Date()
  const hojeSP = spParts(now)                             // dia-calendário no fuso do Brasil

  // Eventos: o campo `date` é um marcador de dia em UTC (00:00Z), então a janela
  // "hoje..amanhã" precisa ser alinhada em UTC-midnight a partir do dia do Brasil.
  const eventStart = new Date(Date.UTC(hojeSP.year, hojeSP.month - 1, hojeSP.day))
  const eventEnd = new Date(Date.UTC(hojeSP.year, hojeSP.month - 1, hojeSP.day + 2) - 1)

  // Novos membros: createdAt é instante real → desde o início de ontem (Brasil).
  const yesterday = addDays(startOfDaySP(now), -1)

  const [members, events, newMembers] = await Promise.all([
    wantBirthdays
      ? prisma.member.findMany({
          where: { birthDate: { not: null }, isActive: true },
          select: { id: true, name: true, birthDate: true },
        })
      : Promise.resolve([]),
    wantEvents
      ? prisma.event.findMany({
          where: { date: { gte: eventStart, lte: eventEnd } },
          select: { id: true, title: true, date: true, startTime: true },
          orderBy: { date: "asc" },
          take: 5,
        })
      : Promise.resolve([]),
    wantNewMembers
      ? prisma.member.findMany({
          where: { createdAt: { gte: yesterday } },
          select: { id: true, name: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 5,
        })
      : Promise.resolve([]),
  ])

  const notifications: { id: string; type: string; title: string; message: string; time: string }[] = []

  members.forEach((m) => {
    const bd = new Date(m.birthDate!)
    // birthDate é uma data-only (meia-noite UTC); usar getUTC* preserva o dia
    // do calendário e comparamos com o dia/mês de hoje no fuso do Brasil.
    if (bd.getUTCDate() === hojeSP.day && bd.getUTCMonth() + 1 === hojeSP.month) {
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
      ? new Date(ev.startTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })
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