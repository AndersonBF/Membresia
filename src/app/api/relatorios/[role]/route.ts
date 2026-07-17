// src/app/api/relatorios/[role]/route.ts
import { currentUser } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getEbdAccess } from "@/lib/ebdAccess"

const societyMap: Record<string, number> = {
  saf: 3, uph: 4, ump: 5, upa: 6, ucp: 7,
}

const AGE_BRACKETS = [
  { label: "0–4",   min: 0,  max: 4  },
  { label: "5–9",   min: 5,  max: 9  },
  { label: "10–14", min: 10, max: 14 },
  { label: "15–19", min: 15, max: 19 },
  { label: "20–24", min: 20, max: 24 },
  { label: "25–29", min: 25, max: 29 },
  { label: "30–34", min: 30, max: 34 },
  { label: "35–39", min: 35, max: 39 },
  { label: "40–44", min: 40, max: 44 },
  { label: "45–49", min: 45, max: 49 },
  { label: "50–54", min: 50, max: 54 },
  { label: "55–59", min: 55, max: 59 },
  { label: "60–64", min: 60, max: 64 },
  { label: "65–69", min: 65, max: 69 },
  { label: "70–74", min: 70, max: 74 },
  { label: "75–79", min: 75, max: 79 },
  { label: "80+",   min: 80, max: Infinity },
]

export async function GET(req: NextRequest, { params }: { params: { role: string } }) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const roles = (user.publicMetadata?.roles as string[]) ?? []
  const isSuperAdmin = roles.includes("superadmin")
  const isAdmin = isSuperAdmin || roles.includes("admin")

  const { role } = params
  const isEbdSuperintendent = role === "ebd" && roles.includes("superintendente")
  if (!isSuperAdmin && !isAdmin && !isEbdSuperintendent && !roles.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // ── EBD: relatório baseado nas chamadas por turma (BibleSchoolLesson) ─────────
  if (role === "ebd") {
    return NextResponse.json(await buildEbdReport())
  }

  const societyId = societyMap[role]

  let memberWhere: any = {}
  let eventWhere: any = {}
  let financeWhere: any = {}

  if (societyId) {
    memberWhere  = { societies: { some: { societyId } } }
    eventWhere   = { societyId }
    financeWhere = { societyId }
  } else if (role === "conselho") {
    memberWhere  = { council: { isNot: null } }
    financeWhere = { councilId: 1 }
  } else if (role === "diaconia") {
    memberWhere  = { diaconate: { isNot: null } }
  } else if (role === "ministerio") {
    memberWhere  = { ministries: { some: {} } }
  } else if (role === "ebd") {
    memberWhere  = { bibleSchoolClass: { isNot: null } }
  }

  const [members, events, finances, directory] = await Promise.all([
    prisma.member.findMany({
      where: memberWhere,
      select: {
        id: true,
        name: true,
        gender: true,
        isActive: true,
        birthDate: true,
        createdAt: true,
        societies: societyId ? { where: { societyId }, select: { cargo: true } } : false,
      },
    }),

    prisma.event.findMany({
      where: eventWhere,
      orderBy: { date: "asc" },
      include: {
        attendances: { select: { isPresent: true, memberId: true } },
      },
    }),

    prisma.finance.findMany({
      where: financeWhere,
      orderBy: [{ year: "asc" }, { month: "asc" }],
    }),

    societyId ? prisma.memberSociety.findMany({
      where: { societyId, cargo: { not: null } },
      include: {
        member: { select: { id: true, name: true, phone: true, gender: true } },
      },
    }) : Promise.resolve([]),
  ])

  // ── Membros ──────────────────────────────────────────────────────────────
  const now = new Date()
  const totalMembers  = members.length
  const activeMembers = members.filter(m => m.isActive).length
  const genderDist    = {
    masculino:     members.filter(m => m.gender === "MASCULINO").length,
    feminino:      members.filter(m => m.gender === "FEMININO").length,
    nao_informado: members.filter(m => !m.gender).length,
  }

  const ageMap: Record<string, number> = {}
  let naoInformadoAge = 0

  members.forEach(m => {
    if (!m.birthDate) { naoInformadoAge++; return }
    const age = Math.floor(
      (now.getTime() - new Date(m.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    )
    const bracket = AGE_BRACKETS.find(b => age >= b.min && age <= b.max)
    if (bracket) ageMap[bracket.label] = (ageMap[bracket.label] ?? 0) + 1
  })

  const ageDist = [
    ...AGE_BRACKETS
      .filter(b => (ageMap[b.label] ?? 0) > 0)
      .map(b => ({ faixa: b.label, total: ageMap[b.label] })),
    ...(naoInformadoAge > 0 ? [{ faixa: "N/A", total: naoInformadoAge }] : []),
  ]

  const monthlyGrowth = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
    const count = members.filter(m => new Date(m.createdAt) <= d).length
    return {
      mes: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
      total: count,
    }
  })

  // ── Presença ─────────────────────────────────────────────────────────────
  const attendanceByEvent = events.map(e => {
    const present = e.attendances.filter(a => a.isPresent).length
    // Se ninguém foi marcado como presente, considera total = 0 (evento sem chamada feita)
    const total   = present === 0 ? 0 : e.attendances.length
    const absent  = total - present
    const rate    = total > 0 ? Math.round((present / total) * 100) : 0
    return { id: e.id, title: e.title, date: e.date.toISOString(), total, present, absent, rate }
  })

  const monthlyAttendance = Array.from({ length: 12 }, (_, i) => {
    const d    = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
    const dEnd = new Date(now.getFullYear(), now.getMonth() - (11 - i) + 1, 0)
    const evs  = events.filter(e => e.date >= d && e.date <= dEnd)
    const totalPresent = evs.reduce((s, e) => s + e.attendances.filter(a => a.isPresent).length, 0)
    // Usa o mesmo critério: só conta total de eventos que tiveram ao menos 1 presente
    const totalAll = evs.reduce((s, e) => {
      const p = e.attendances.filter(a => a.isPresent).length
      return s + (p === 0 ? 0 : e.attendances.length)
    }, 0)
    return {
      mes: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
      eventos: evs.length,
      presentes: totalPresent,
      total: totalAll,
      taxa: totalAll > 0 ? Math.round((totalPresent / totalAll) * 100) : 0,
    }
  })

  const memberPresence: Record<number, { present: number; total: number }> = {}
  events.forEach(e => {
    const hasPresent = e.attendances.some(a => a.isPresent)
    if (!hasPresent) return // ignora eventos sem nenhuma presença marcada
    e.attendances.forEach(a => {
      if (!memberPresence[a.memberId]) memberPresence[a.memberId] = { present: 0, total: 0 }
      memberPresence[a.memberId].total++
      if (a.isPresent) memberPresence[a.memberId].present++
    })
  })

  const presenceRanking = members
    .map(m => {
      const p = memberPresence[m.id] ?? { present: 0, total: 0 }
      return {
        id: m.id,
        name: m.name,
        present: p.present,
        total: p.total,
        rate: p.total > 0 ? Math.round((p.present / p.total) * 100) : null,
      }
    })
    .filter(m => m.total > 0)
    .sort((a, b) => (b.rate ?? 0) - (a.rate ?? 0))

  // ── Finanças ─────────────────────────────────────────────────────────────
  const totalEntradas = finances.filter(f => f.type === "ENTRADA").reduce((s, f) => s + f.value, 0)
  const totalSaidas   = finances.filter(f => f.type === "SAIDA").reduce((s, f) => s + f.value, 0)
  const saldo         = totalEntradas - totalSaidas

  const financeByMonth = Array.from({ length: 12 }, (_, i) => {
    const d     = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
    const month = d.getMonth() + 1
    const year  = d.getFullYear()
    const mf    = finances.filter(f => f.month === month && f.year === year)
    const entradas = mf.filter(f => f.type === "ENTRADA").reduce((s, f) => s + f.value, 0)
    const saidas   = mf.filter(f => f.type === "SAIDA").reduce((s, f) => s + f.value, 0)
    return {
      mes: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
      entradas,
      saidas,
      saldo: entradas - saidas,
    }
  })

  // ── Diretoria ─────────────────────────────────────────────────────────────
  const directoryCargos = [
    "Presidente", "Vice-Presidente",
    "1º Secretário", "2º Secretário",
    "Tesoureiro", "1º Tesoureiro", "2º Tesoureiro",
  ]
  const directoryData = (directory as any[])
    .filter(d => d.cargo && directoryCargos.includes(d.cargo))
    .sort((a, b) => directoryCargos.indexOf(a.cargo) - directoryCargos.indexOf(b.cargo))
    .map(d => ({ cargo: d.cargo, member: d.member }))

  return NextResponse.json({
    members: {
      total: totalMembers,
      active: activeMembers,
      inactive: totalMembers - activeMembers,
      genderDist,
      ageDist,
      monthlyGrowth,
    },
    attendance: {
      totalEvents: events.length,
      byEvent: attendanceByEvent,
      monthly: monthlyAttendance,
      ranking: presenceRanking,
    },
    finance: {
      totalEntradas,
      totalSaidas,
      saldo,
      byMonth: financeByMonth,
      transactions: finances.map(f => ({
        id: f.id,
        description: f.description,
        type: f.type,
        value: f.value,
        date: f.date.toISOString(),
        month: f.month,
        year: f.year,
      })),
    },
    directory: directoryData,
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// RELATÓRIO DA EBD — baseado em BibleSchoolLesson / BibleSchoolAttendance
// Superintendente/admin: todas as turmas. Professora: apenas a(s) sua(s).
// Mantém o mesmo formato de resposta do relatório genérico, + campo byClass.
// ─────────────────────────────────────────────────────────────────────────────
async function buildEbdReport() {
  const access = await getEbdAccess()
  const classWhere = access.canSeeAll ? {} : { id: { in: access.teacherClassIds } }

  const classes = await prisma.bibleSchoolClass.findMany({
    where: classWhere,
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })
  const classIds = classes.map((c) => c.id)
  const classNameById = new Map(classes.map((c) => [c.id, c.name]))

  const [members, lessons, teachers] = await Promise.all([
    prisma.member.findMany({
      where: { bibleSchoolClassId: { in: classIds } },
      select: { id: true, name: true, gender: true, isActive: true, birthDate: true, createdAt: true, bibleSchoolClassId: true },
    }),
    prisma.bibleSchoolLesson.findMany({
      where: { classId: { in: classIds } },
      orderBy: { date: "asc" },
      include: { attendances: { select: { isPresent: true, memberId: true } } },
    }),
    prisma.classTeacher.findMany({
      where: { classId: { in: classIds } },
      include: { member: { select: { id: true, name: true, phone: true, gender: true } } },
    }),
  ])

  const now = new Date()

  // ── Membros ──
  const totalMembers = members.length
  const activeMembers = members.filter((m) => m.isActive).length
  const genderDist = {
    masculino: members.filter((m) => m.gender === "MASCULINO").length,
    feminino: members.filter((m) => m.gender === "FEMININO").length,
    nao_informado: members.filter((m) => !m.gender).length,
  }

  const ageMap: Record<string, number> = {}
  let naoInformadoAge = 0
  members.forEach((m) => {
    if (!m.birthDate) { naoInformadoAge++; return }
    const age = Math.floor((now.getTime() - new Date(m.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    const bracket = AGE_BRACKETS.find((b) => age >= b.min && age <= b.max)
    if (bracket) ageMap[bracket.label] = (ageMap[bracket.label] ?? 0) + 1
  })
  const ageDist = [
    ...AGE_BRACKETS.filter((b) => (ageMap[b.label] ?? 0) > 0).map((b) => ({ faixa: b.label, total: ageMap[b.label] })),
    ...(naoInformadoAge > 0 ? [{ faixa: "N/A", total: naoInformadoAge }] : []),
  ]

  const monthlyGrowth = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
    const count = members.filter((m) => new Date(m.createdAt) <= d).length
    return { mes: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }), total: count }
  })

  // ── Presença (cada aula = um "evento") ──
  const byEvent = lessons.map((l) => {
    const present = l.attendances.filter((a) => a.isPresent).length
    const total = l.attendances.length
    const absent = total - present
    const rate = total > 0 ? Math.round((present / total) * 100) : 0
    const dateStr = new Date(l.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" })
    return {
      id: l.id,
      title: `${classNameById.get(l.classId) ?? "Turma"} — ${dateStr}`,
      date: l.date.toISOString(),
      total, present, absent, rate,
    }
  })

  const monthlyAttendance = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
    const dEnd = new Date(now.getFullYear(), now.getMonth() - (11 - i) + 1, 0)
    const ls = lessons.filter((l) => l.date >= d && l.date <= dEnd)
    const presentes = ls.reduce((s, l) => s + l.attendances.filter((a) => a.isPresent).length, 0)
    const total = ls.reduce((s, l) => s + l.attendances.length, 0)
    return {
      mes: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
      eventos: ls.length,
      presentes,
      total,
      taxa: total > 0 ? Math.round((presentes / total) * 100) : 0,
    }
  })

  const memberPresence: Record<number, { present: number; total: number }> = {}
  lessons.forEach((l) => {
    l.attendances.forEach((a) => {
      if (!memberPresence[a.memberId]) memberPresence[a.memberId] = { present: 0, total: 0 }
      memberPresence[a.memberId].total++
      if (a.isPresent) memberPresence[a.memberId].present++
    })
  })
  const ranking = members
    .map((m) => {
      const p = memberPresence[m.id] ?? { present: 0, total: 0 }
      return { id: m.id, name: m.name, present: p.present, total: p.total, rate: p.total > 0 ? Math.round((p.present / p.total) * 100) : null }
    })
    .filter((m) => m.total > 0)
    .sort((a, b) => (b.rate ?? 0) - (a.rate ?? 0))

  // ── Por turma ──
  const byClass = classes.map((c) => {
    const ls = lessons.filter((l) => l.classId === c.id)
    const present = ls.reduce((s, l) => s + l.attendances.filter((a) => a.isPresent).length, 0)
    const total = ls.reduce((s, l) => s + l.attendances.length, 0)
    return {
      classId: c.id,
      name: c.name,
      lessons: ls.length,
      members: members.filter((m: any) => (m as any).bibleSchoolClassId === c.id).length,
      present,
      total,
      rate: total > 0 ? Math.round((present / total) * 100) : 0,
    }
  })

  // ── "Diretoria" = professoras ──
  const directory = teachers.map((t) => ({ cargo: "Professora", member: t.member }))

  return {
    members: {
      total: totalMembers,
      active: activeMembers,
      inactive: totalMembers - activeMembers,
      genderDist,
      ageDist,
      monthlyGrowth,
    },
    attendance: {
      totalEvents: lessons.length,
      byEvent,
      monthly: monthlyAttendance,
      ranking,
    },
    finance: {
      totalEntradas: 0,
      totalSaidas: 0,
      saldo: 0,
      byMonth: [],
      transactions: [],
    },
    byClass,
    directory,
  }
}