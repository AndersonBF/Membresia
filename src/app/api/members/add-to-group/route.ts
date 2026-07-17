// src/app/api/members/add-to-group/route.ts
import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import prisma from "@/lib/prisma"

const societyMap: Record<string, number> = { saf: 3, uph: 4, ump: 5, upa: 6, ucp: 7 }

export async function POST(req: NextRequest) {
  const user = await currentUser()
  const roles = (user?.publicMetadata?.roles as string[]) ?? []
  const isAdmin = roles.includes("admin") || roles.includes("superadmin")

  const { role, memberId, memberIds, targetId } = await req.json()

  // Admin gere qualquer grupo; superintendente pode gerir membros das turmas da EBD
  const canManage = isAdmin || (role === "ebd" && roles.includes("superintendente"))
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
    let count = 0

    if (societyMap[role]) {
      const res = await prisma.memberSociety.createMany({
        data: ids.map((id) => ({ memberId: id, societyId: societyMap[role] })),
        skipDuplicates: true,
      })
      count = res.count
    } else if (role === "conselho") {
      const res = await prisma.memberCouncil.createMany({
        data: ids.map((id) => ({ memberId: id, councilId: 1 })),
        skipDuplicates: true,
      })
      count = res.count
    } else if (role === "diaconia") {
      const res = await prisma.memberDiaconate.createMany({
        data: ids.map((id) => ({ memberId: id, diaconateId: 1 })),
        skipDuplicates: true,
      })
      count = res.count
    } else if (role === "ministerio") {
      if (!targetId) {
        return NextResponse.json({ error: "Selecione um ministério" }, { status: 400 })
      }
      const res = await prisma.memberMinistry.createMany({
        data: ids.map((id) => ({ memberId: id, ministryId: Number(targetId) })),
        skipDuplicates: true,
      })
      count = res.count
    } else if (role === "ebd") {
      if (!targetId) {
        return NextResponse.json({ error: "Selecione uma classe" }, { status: 400 })
      }
      const res = await prisma.member.updateMany({
        where: { id: { in: ids } },
        data: { bibleSchoolClassId: Number(targetId) },
      })
      count = res.count
    } else {
      return NextResponse.json({ error: "Grupo inválido" }, { status: 400 })
    }

    return NextResponse.json({ success: true, count })
  } catch (e: any) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
