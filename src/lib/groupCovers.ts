// src/lib/groupCovers.ts
// Capas (imagens de fundo) personalizáveis dos grupos, guardadas em GroupCover.
import prisma from "@/lib/prisma"

// Grupos que suportam capa personalizável pelo sistema.
export const GROUP_COVER_ROLES = [
  "ump", "upa", "uph", "saf", "ucp",
  "diaconia", "conselho", "ministerio", "ebd",
] as const

export type GroupCoverRole = (typeof GROUP_COVER_ROLES)[number]

export function isGroupCoverRole(role: string): role is GroupCoverRole {
  return (GROUP_COVER_ROLES as readonly string[]).includes(role)
}

/** URL da capa de um grupo, ou null se não houver. */
export async function getGroupCover(role: string): Promise<string | null> {
  if (!isGroupCoverRole(role)) return null
  const row = await prisma.groupCover.findUnique({
    where: { role },
    select: { coverImageUrl: true },
  })
  return row?.coverImageUrl ?? null
}

/** Mapa role → URL de capa (apenas os grupos que têm capa definida). */
export async function getAllGroupCovers(): Promise<Record<string, string>> {
  const rows = await prisma.groupCover.findMany({ select: { role: true, coverImageUrl: true } })
  return Object.fromEntries(rows.map((r) => [r.role, r.coverImageUrl]))
}
