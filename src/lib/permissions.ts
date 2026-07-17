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
const societyIdToRole: Record<number, string> = Object.fromEntries(
  Object.entries(societyMap).map(([role, id]) => [id, role])
)

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
  const isAdmin = roles.includes("admin") || roles.includes("superadmin")

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
