import { currentUser } from "@clerk/nextjs/server"
import { getEbdAccess } from "@/lib/ebdAccess"

export const ORCAMENTO_CONTEXTS = ["ebd", "diaconia", "conselho"] as const
export type OrcamentoContext = (typeof ORCAMENTO_CONTEXTS)[number]

export function isOrcamentoContext(v: unknown): v is OrcamentoContext {
  return typeof v === "string" && (ORCAMENTO_CONTEXTS as readonly string[]).includes(v)
}

/**
 * Quem pode ver/gerir os orçamentos de um contexto:
 * - admin / superadmin / pastor: todos os contextos
 * - ebd: superintendente ou professora (via EBD access)
 * - diaconia: papel "diaconia"
 * - conselho: papel "conselho"
 */
export async function canAccessOrcamentos(context: string): Promise<boolean> {
  const user = await currentUser()
  const roles = (user?.publicMetadata?.roles as string[]) ?? []

  if (roles.includes("admin") || roles.includes("superadmin") || roles.includes("pastor")) {
    return true
  }

  if (context === "ebd") {
    const access = await getEbdAccess()
    return access.canSeeAll || access.teacherClassIds.length > 0
  }
  if (context === "diaconia") return roles.includes("diaconia")
  if (context === "conselho") return roles.includes("conselho")
  return false
}
