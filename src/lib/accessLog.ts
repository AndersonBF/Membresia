// src/lib/accessLog.ts
// Registro de acessos ao sistema. Falhas aqui NUNCA devem quebrar a página —
// por isso tudo está protegido por try/catch.
import { currentUser } from "@clerk/nextjs/server"
import { headers } from "next/headers"
import prisma, { prismaForTenant } from "@/lib/prisma"

/** Páginas/prefixos que não vale a pena registrar. */
const IGNORAR = ["/api", "/_next", "/favicon", "/icon", "/em-breve", "/acesso-negado"]

/**
 * Registra a abertura de uma página do painel pelo usuário logado.
 * Chamado no layout do dashboard (roda no servidor a cada requisição).
 */
export async function logPageview() {
  try {
    const path = headers().get("x-pathname") ?? null
    if (path && IGNORAR.some((p) => path.startsWith(p))) return

    const user = await currentUser()
    if (!user) return

    const roles = (user.publicMetadata?.roles as string[]) ?? []
    const userName =
      user.fullName ||
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      user.username ||
      user.id

    await prisma.accessLog.create({
      data: { event: "pageview", userId: user.id, userName, roles, path },
    })
  } catch {
    // silencioso de propósito
  }
}

/**
 * Registra um login (sessão criada). Vem do webhook do Clerk, que não tem
 * subdomínio — por isso o banco é resolvido pela igreja marcada no usuário.
 */
export async function logLogin(opts: {
  userId: string
  userName: string
  roles: string[]
  church?: string | null
}) {
  try {
    const db = opts.church ? prismaForTenant(opts.church) : prisma
    await db.accessLog.create({
      data: {
        event: "login",
        userId: opts.userId,
        userName: opts.userName,
        roles: opts.roles,
        path: null,
      },
    })
  } catch {
    // silencioso de propósito
  }
}
