// src/lib/appSettings.ts
// Leitura server-side das preferências salvas em ChurchSettings.preferences.
import prisma from "@/lib/prisma"
import { ITEM_PER_PAGE } from "@/lib/settings"

type Prefs = {
  notificacoes?: Record<string, boolean>
  privacidade?: Record<string, boolean>
  membros?: Record<string, boolean>
  valores?: { itensPorPagina?: number }
}

export async function getPreferences(): Promise<Prefs> {
  try {
    const s = await prisma.churchSettings.findFirst({ select: { preferences: true } })
    return (s?.preferences as Prefs) ?? {}
  } catch {
    return {}
  }
}

/** Quantos membros por página na listagem (Configurações → Membros). */
export async function getMembersPerPage(): Promise<number> {
  const prefs = await getPreferences()
  const n = prefs.valores?.itensPorPagina
  return typeof n === "number" && n > 0 ? n : ITEM_PER_PAGE
}
