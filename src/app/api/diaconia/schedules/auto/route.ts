import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// Gera escalas de domingo automaticamente, distribuindo os diáconos
// de forma equilibrada (quem foi escalado menos vezes entra primeiro),
// evitando repetir a mesma pessoa em domingos seguidos quando possível.

// Retorna o próximo domingo (>= a data informada), em UTC "puro" (meia-noite).
function firstSunday(from: Date): Date {
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()))
  const shift = (7 - d.getUTCDay()) % 7 // 0 = já é domingo
  d.setUTCDate(d.getUTCDate() + shift)
  return d
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))

  const weeks: number = Math.min(Math.max(parseInt(body.weeks, 10) || 4, 1), 26)
  const perSunday: number = Math.min(Math.max(parseInt(body.perSunday, 10) || 2, 1), 20)
  const startDate = body.startDate ? new Date(body.startDate) : new Date()
  // Se vierem ids específicos usamos só eles, senão todos os diáconos.
  const poolIds: number[] = Array.isArray(body.memberIds) ? body.memberIds : []

  // 1) Pool de diáconos
  const members = await prisma.member.findMany({
    where: {
      diaconate: { isNot: null },
      ...(poolIds.length ? { id: { in: poolIds } } : {}),
    },
    select: { id: true, name: true },
  })
  if (members.length === 0) {
    return NextResponse.json({ error: "Nenhum diácono disponível" }, { status: 400 })
  }

  // 2) Carga atual: quantas vezes cada um já foi escalado (para equilibrar).
  const existing = await prisma.diaconateScheduleMember.groupBy({
    by: ["memberId"],
    _count: { memberId: true },
    where: { schedule: { diaconateId: 1 } },
  })
  const load = new Map<number, number>()
  for (const m of members) load.set(m.id, 0)
  for (const e of existing) {
    if (load.has(e.memberId)) load.set(e.memberId, e._count.memberId)
  }
  // Fator de desempate aleatório e fixo por membro (embaralha quem está empatado
  // em carga, para não escalar sempre o mesmo grupo).
  const rand = new Map<number, number>()
  for (const m of members) rand.set(m.id, Math.random())

  // 3) Datas alvo: próximos N domingos, pulando os que já têm escala de domingo.
  const sundays: Date[] = []
  let cursor = firstSunday(startDate)
  while (sundays.length < weeks) {
    sundays.push(new Date(cursor))
    cursor = new Date(cursor)
    cursor.setUTCDate(cursor.getUTCDate() + 7)
  }
  const existingSchedules = await prisma.diaconateSchedule.findMany({
    where: {
      diaconateId: 1,
      type: "DOMINGO",
      date: { in: sundays },
    },
    select: { date: true },
  })
  const taken = new Set(existingSchedules.map(s => s.date.getTime()))
  const targets = sundays.filter(s => !taken.has(s.getTime()))

  // 3b) Indisponibilidades nas datas alvo → memberId proibido por data.
  const unav = await prisma.diaconateUnavailability.findMany({
    where: { date: { in: targets } },
    select: { memberId: true, date: true },
  })
  const blocked = new Map<number, Set<number>>() // date.getTime() -> memberIds
  for (const u of unav) {
    const key = u.date.getTime()
    if (!blocked.has(key)) blocked.set(key, new Set())
    blocked.get(key)!.add(u.memberId)
  }

  // 4) Seleção equilibrada: menor carga primeiro, evita repetir do domingo
  //    anterior, respeita indisponibilidade e desempata aleatoriamente.
  let previous: Set<number> = new Set()
  const created = []
  for (const date of targets) {
    const off = blocked.get(date.getTime()) ?? new Set<number>()
    const available = members.filter(m => !off.has(m.id))
    const pool = available.length ? available : members // se todos indisponíveis, ignora bloqueio

    const ranked = [...pool].sort((a, b) => {
      const la = load.get(a.id)!, lb = load.get(b.id)!
      if (la !== lb) return la - lb
      const pa = previous.has(a.id) ? 1 : 0
      const pb = previous.has(b.id) ? 1 : 0
      if (pa !== pb) return pa - pb
      return rand.get(a.id)! - rand.get(b.id)!
    })

    const take = Math.min(perSunday, pool.length)
    const chosen: number[] = []
    // Primeiro os que não saíram no domingo anterior.
    for (const m of ranked) {
      if (chosen.length >= take) break
      if (!previous.has(m.id)) chosen.push(m.id)
    }
    // Completa (se faltou gente) permitindo repetir.
    for (const m of ranked) {
      if (chosen.length >= take) break
      if (!chosen.includes(m.id)) chosen.push(m.id)
    }

    const schedule = await prisma.diaconateSchedule.create({
      data: {
        type: "DOMINGO",
        title: null,
        date,
        notes: null,
        diaconateId: 1,
        members: { create: chosen.map(memberId => ({ memberId })) },
      },
      include: {
        members: {
          include: { member: { select: { id: true, name: true, profileImageUrl: true } } },
        },
      },
    })
    created.push(schedule)

    for (const id of chosen) load.set(id, load.get(id)! + 1)
    previous = new Set(chosen)
  }

  return NextResponse.json({ created, skipped: sundays.length - targets.length }, { status: 201 })
}
