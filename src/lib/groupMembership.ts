// src/lib/groupMembership.ts
//
// Vincula membros já existentes a um grupo. Compartilhado entre
// /api/members/add-to-group (seleção de existentes) e /api/members/bulk
// (importação de lista de nomes).

import prisma from "@/lib/prisma"
import { societyMap } from "@/lib/permissions"

export type AttachResult = { count: number } | { error: string; status: number }

export async function attachMembersToGroup(
  role: string,
  ids: number[],
  targetId?: number | string
): Promise<AttachResult> {
  if (ids.length === 0) return { count: 0 }

  if (societyMap[role]) {
    const res = await prisma.memberSociety.createMany({
      data: ids.map((id) => ({ memberId: id, societyId: societyMap[role] })),
      skipDuplicates: true,
    })
    return { count: res.count }
  }

  if (role === "conselho") {
    const res = await prisma.memberCouncil.createMany({
      data: ids.map((id) => ({ memberId: id, councilId: 1 })),
      skipDuplicates: true,
    })
    return { count: res.count }
  }

  if (role === "diaconia") {
    const res = await prisma.memberDiaconate.createMany({
      data: ids.map((id) => ({ memberId: id, diaconateId: 1 })),
      skipDuplicates: true,
    })
    return { count: res.count }
  }

  if (role === "ministerio") {
    if (!targetId) return { error: "Selecione um ministério", status: 400 }
    const res = await prisma.memberMinistry.createMany({
      data: ids.map((id) => ({ memberId: id, ministryId: Number(targetId) })),
      skipDuplicates: true,
    })
    return { count: res.count }
  }

  if (role === "ebd") {
    if (!targetId) return { error: "Selecione uma classe", status: 400 }
    const res = await prisma.member.updateMany({
      where: { id: { in: ids } },
      data: { bibleSchoolClassId: Number(targetId) },
    })
    return { count: res.count }
  }

  return { error: "Grupo inválido", status: 400 }
}
