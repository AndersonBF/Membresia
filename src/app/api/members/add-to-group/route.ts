// src/app/api/members/add-to-group/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getManageableGroups } from "@/lib/permissions"
import { attachMembersToGroup } from "@/lib/groupMembership"

export async function POST(req: NextRequest) {
  const { role, memberId, memberIds, targetId } = await req.json()

  // Admin gere qualquer grupo; superintendente gere a EBD; e quem ocupa um cargo
  // (Presidente, Vice-Presidente, etc.) num grupo pode gerir os membros daquele grupo.
  const { isAdmin, groups } = await getManageableGroups()
  const canManage = isAdmin || groups.has(role)
  if (!canManage) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
  }

  // Aceita um único memberId (compat) ou uma lista memberIds (seleção múltipla)
  const ids: number[] = Array.isArray(memberIds) && memberIds.length > 0
    ? memberIds.map((n: any) => Number(n)).filter((n: number) => !!n)
    : memberId ? [Number(memberId)] : []

  if (!role || ids.length === 0) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
  }

  try {
    const res = await attachMembersToGroup(role, ids, targetId)
    if ("error" in res) {
      return NextResponse.json({ error: res.error }, { status: res.status })
    }
    return NextResponse.json({ success: true, count: res.count })
  } catch (e: any) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
