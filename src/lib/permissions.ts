// src/lib/permissions.ts
//
// Centraliza a lógica de "quem pode gerir os membros de um grupo".
//
// Regras:
//  - admin / superadmin  → gerem qualquer grupo.
//  - superintendente     → gere a EBD (mantém o comportamento existente).
//  - qualquer membro que ocupe um CARGO num grupo (Presidente, Vice-Presidente,
//    Secretário, Tesoureiro, etc.) → gere os membros DAQUELE grupo.
//
// O vínculo entre o usuário logado (Clerk) e o registro de Membro é feito por
// username ou email — os mesmos campos usados no resto do app.

import { currentUser } from "@clerk/nextjs/server"
import prisma from "@/lib/prisma"

export const societyMap: Record<string, number> = {
  saf: 3, uph: 4, ump: 5, upa: 6, ucp: 7,
}

// societyId → role key (inverso do societyMap)
export const societyIdToRole: Record<number, string> = Object.fromEntries(
  Object.entries(societyMap).map(([role, id]) => [id, role])
)

/** Converte um societyId num role de grupo (ex.: 3 → "saf"). */
export function roleForSocietyId(societyId: number | null | undefined): string | null {
  if (!societyId) return null
  return societyIdToRole[societyId] ?? null
}

export interface ManageableGroups {
  /** admin ou superadmin — pode gerir qualquer grupo */
  isAdmin: boolean
  /** conjunto de roles de grupo que o usuário pode gerir por cargo/superintendência */
  groups: Set<string>
  /** id do Member correspondente ao usuário logado (se encontrado) */
  memberId: number | null
}

/**
 * Retorna quais grupos o usuário logado pode gerir.
 * Consumidores devem checar: `isAdmin || groups.has(role)`.
 */
export async function getManageableGroups(): Promise<ManageableGroups> {
  const user = await currentUser()
  if (!user) return { isAdmin: false, groups: new Set(), memberId: null }

  const roles = (user.publicMetadata?.roles as string[]) ?? []
  // Pastor tem gestão total (leitura + escrita) de todos os grupos, como admin.
  const isAdmin = roles.includes("admin") || roles.includes("superadmin") || roles.includes("pastor")

  const groups = new Set<string>()

  // Superintendente mantém acesso à EBD (comportamento pré-existente)
  if (roles.includes("superintendente")) groups.add("ebd")

  if (isAdmin) {
    return { isAdmin: true, groups, memberId: null }
  }

  // Liga o usuário ao Member por username ou email
  const or: any[] = []
  if (user.username) or.push({ username: user.username })
  const email = user.emailAddresses?.[0]?.emailAddress
  if (email) or.push({ email })

  if (or.length === 0) return { isAdmin: false, groups, memberId: null }

  const member = await prisma.member.findFirst({
    where: { OR: or },
    select: {
      id: true,
      societies: { select: { societyId: true, cargo: true } },
      diaconate: { select: { cargo: true } },
      council: { select: { cargo: true } },
    },
  })

  if (!member) return { isAdmin: false, groups, memberId: null }

  // Cargo em sociedade → gere aquela sociedade
  for (const s of member.societies) {
    if (s.cargo && societyIdToRole[s.societyId]) {
      groups.add(societyIdToRole[s.societyId])
    }
  }
  // Cargo na diaconia → gere a diaconia
  if (member.diaconate?.cargo) groups.add("diaconia")
  // Cargo no conselho → gere o conselho
  if (member.council?.cargo) groups.add("conselho")

  return { isAdmin: false, groups, memberId: member.id }
}

/** Conveniência: o usuário logado pode gerir os membros deste grupo? */
export async function canManageGroup(role: string): Promise<boolean> {
  const { isAdmin, groups } = await getManageableGroups()
  return isAdmin || groups.has(role)
}

export interface MyMembership {
  memberId: number | null
  societyIds: number[]
  hasCouncil: boolean
  hasDiaconate: boolean
  ministryIds: number[]
  classIds: number[]
}

/**
 * Retorna a que grupos o usuário logado PERTENCE (independente de cargo).
 * Usado para escopar visualizações (ex.: documentos do próprio membro).
 */
export async function getMyMembership(): Promise<MyMembership> {
  const empty: MyMembership = {
    memberId: null, societyIds: [], hasCouncil: false,
    hasDiaconate: false, ministryIds: [], classIds: [],
  }

  const user = await currentUser()
  if (!user) return empty

  const or: any[] = []
  if (user.username) or.push({ username: user.username })
  const email = user.emailAddresses?.[0]?.emailAddress
  if (email) or.push({ email })
  if (or.length === 0) return empty

  const member = await prisma.member.findFirst({
    where: { OR: or },
    select: {
      id: true,
      societies: { select: { societyId: true } },
      council: { select: { id: true } },
      diaconate: { select: { id: true } },
      ministries: { select: { ministryId: true } },
      bibleSchoolClassId: true,
      teachingAssignments: { select: { classId: true } },
    },
  })

  if (!member) return empty

  const classIds = new Set<number>()
  if (member.bibleSchoolClassId) classIds.add(member.bibleSchoolClassId)
  member.teachingAssignments.forEach((t) => classIds.add(t.classId))

  return {
    memberId: member.id,
    societyIds: member.societies.map((s) => s.societyId),
    hasCouncil: !!member.council,
    hasDiaconate: !!member.diaconate,
    ministryIds: member.ministries.map((m) => m.ministryId),
    classIds: [...classIds],
  }
}
