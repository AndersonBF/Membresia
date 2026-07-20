// src/app/api/group/cover/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { canManageGroup } from "@/lib/permissions"
import { isGroupCoverRole } from "@/lib/groupCovers"

// Salva a capa (imagem de fundo) de um grupo.
// Podem alterar: admin, superadmin, pastor e os líderes daquele grupo
// (mesma regra de "quem gere os membros do grupo").
export async function POST(req: Request) {
  const { role, coverImageUrl } = await req.json().catch(() => ({}))

  if (!role || !isGroupCoverRole(role)) {
    return NextResponse.json({ error: "Grupo inválido" }, { status: 400 })
  }

  const canManage = await canManageGroup(role)
  if (!canManage) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
  }

  if (coverImageUrl) {
    await prisma.groupCover.upsert({
      where: { role },
      update: { coverImageUrl },
      create: { role, coverImageUrl },
    })
  } else {
    // Sem URL → remove a capa (volta ao padrão).
    await prisma.groupCover.deleteMany({ where: { role } })
  }

  return NextResponse.json({ ok: true })
}
