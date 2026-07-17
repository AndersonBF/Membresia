// src/app/api/admin/member-roles/route.ts
import { auth, clerkClient } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// Retorna os papéis (Clerk publicMetadata.roles) de um membro, pelo memberId.
// Usado pelo formulário de membro para refletir papéis que não vêm de relação
// no banco (ex.: "superintendente").
export async function GET(req: NextRequest) {
  const { sessionClaims } = await auth()
  const roles = (sessionClaims?.metadata as { roles?: string[] })?.roles ?? []
  const isAdmin = roles.includes("admin") || roles.includes("superadmin")
  if (!isAdmin) return NextResponse.json({ error: "Sem permissão" }, { status: 403 })

  const memberId = Number(req.nextUrl.searchParams.get("memberId"))
  if (!memberId) return NextResponse.json({ error: "memberId inválido" }, { status: 400 })

  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: { username: true },
  })
  if (!member?.username) return NextResponse.json({ roles: [] })

  try {
    const client = await clerkClient()
    const { data: users } = await client.users.getUserList({ username: [member.username] })
    const clerkRoles = users.length > 0 ? ((users[0].publicMetadata?.roles as string[]) ?? []) : []
    return NextResponse.json({ roles: clerkRoles })
  } catch (e) {
    console.error("Erro ao buscar papéis do membro:", e)
    return NextResponse.json({ roles: [] })
  }
}
