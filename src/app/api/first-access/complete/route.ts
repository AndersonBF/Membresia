import { auth, clerkClient } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

/**
 * Troca a senha do usuário logado no primeiro acesso e remove a flag
 * `mustChangePassword`. Não exige a senha atual porque quem chama já está
 * autenticado (acabou de logar) e a troca é feita no backend.
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { newPassword } = await req.json()
    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json(
        { error: "A nova senha deve ter pelo menos 8 caracteres." },
        { status: 400 },
      )
    }

    const client = await clerkClient()
    const user = await client.users.getUser(userId)

    // Atualiza a senha e mescla a metadata preservando os campos existentes.
    await client.users.updateUser(userId, {
      password: newPassword,
      publicMetadata: { ...user.publicMetadata, mustChangePassword: false },
    })

    // Mantém o espelho da senha no Prisma em sincronia, se o membro existir.
    if (user.username) {
      await prisma.member
        .updateMany({ where: { username: user.username }, data: { password: newPassword } })
        .catch(() => {})
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    const message =
      error?.errors?.[0]?.longMessage ??
      error?.errors?.[0]?.message ??
      error?.message ??
      "Não foi possível alterar a senha."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
