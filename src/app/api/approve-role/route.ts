import { clerkClient } from '@clerk/nextjs/server'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { userId: adminId } = await auth()
  if (!adminId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  // Verifica se é admin ou superadmin
  const client = await clerkClient()
  const adminUser = await client.users.getUser(adminId)
  const adminRoles = (adminUser.publicMetadata?.roles as string[]) ?? []
  if (!adminRoles.includes('admin') && !adminRoles.includes('superadmin')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const { userId, role, action } = await req.json() // action: "approve" | "reject"

  const targetUser = await client.users.getUser(userId)
  const currentRoles = (targetUser.publicMetadata?.roles as string[]) ?? ["member"]

  let updatedRoles: string[]

  if (action === 'approve') {
    updatedRoles = currentRoles.includes(role) ? currentRoles : [...currentRoles, role]
  } else {
    updatedRoles = currentRoles.filter((r) => r !== role)
  }

  await client.users.updateUserMetadata(userId, {
    publicMetadata: { roles: updatedRoles }
  })

  return NextResponse.json({ success: true, roles: updatedRoles })
}