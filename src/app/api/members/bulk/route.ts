// src/app/api/members/bulk/route.ts
//
// Cadastro de vários membros de uma vez, a partir de uma lista de nomes.
// Se `role` vier junto, os membros criados já entram no grupo.
//
// Nomes que já existem NÃO são recriados: o membro existente é reaproveitado
// (e, havendo grupo, apenas vinculado a ele).

import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getManageableGroups } from "@/lib/permissions"
import { attachMembersToGroup } from "@/lib/groupMembership"

/** Limite defensivo — evita colar um arquivo inteiro por engano. */
const MAX_NAMES = 300

type Incoming = { name: string; phone?: string | null; email?: string | null }

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Payload inválido" }, { status: 400 })

  const { role, targetId } = body as { role?: string; targetId?: number | string }

  const { isAdmin, groups } = await getManageableGroups()
  // Sem grupo = cadastro global, restrito a admin/pastor.
  const canManage = role ? isAdmin || groups.has(role) : isAdmin
  if (!canManage) return NextResponse.json({ error: "Sem permissão" }, { status: 403 })

  // Normaliza a entrada e remove duplicatas dentro da própria lista
  const raw: Incoming[] = Array.isArray(body.people) ? body.people : []
  const seen = new Set<string>()
  const people: Incoming[] = []
  for (const p of raw) {
    const name = typeof p?.name === "string" ? p.name.trim().replace(/\s+/g, " ") : ""
    if (!name) continue
    const key = name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    people.push({ name, phone: p.phone?.trim() || null, email: p.email?.trim() || null })
  }

  if (people.length === 0) {
    return NextResponse.json({ error: "Nenhum nome válido na lista" }, { status: 400 })
  }
  if (people.length > MAX_NAMES) {
    return NextResponse.json(
      { error: `Máximo de ${MAX_NAMES} nomes por vez (recebidos ${people.length})` },
      { status: 400 }
    )
  }

  try {
    // Quem já existe? (comparação por nome, sem diferenciar maiúsculas)
    const existing = await prisma.member.findMany({
      where: { OR: people.map((p) => ({ name: { equals: p.name, mode: "insensitive" as const } })) },
      select: { id: true, name: true },
    })
    const existingByName = new Map(existing.map((m) => [m.name.toLowerCase(), m]))

    const toCreate = people.filter((p) => !existingByName.has(p.name.toLowerCase()))

    // createMany não devolve os ids — cria um a um para poder vincular ao grupo
    const created = await Promise.all(
      toCreate.map((p) =>
        prisma.member.create({
          data: { name: p.name, phone: p.phone, email: p.email },
          select: { id: true, name: true },
        })
      )
    )

    let linked = 0
    if (role) {
      const allIds = [...created.map((m) => m.id), ...existing.map((m) => m.id)]
      const res = await attachMembersToGroup(role, allIds, targetId)
      if ("error" in res) {
        return NextResponse.json({ error: res.error }, { status: res.status })
      }
      linked = res.count
    }

    return NextResponse.json({
      success: true,
      created: created.map((m) => m.name),
      /** Já existiam como membro — reaproveitados, não duplicados */
      reused: existing.map((m) => m.name),
      /** Quantos passaram a fazer parte do grupo agora */
      linked,
    })
  } catch (e) {
    console.error("Erro no cadastro em lote de membros:", e)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
