// src/app/api/admin/reset-credentials/route.ts
import { clerkClient } from '@clerk/nextjs/server'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

function generateUsername(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .slice(0, 20)
}

function generatePassword(): string {
  return Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase()
}

export async function POST(req: Request) {
  try {
    const { userId: adminId } = await auth()
    if (!adminId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const client = await clerkClient()
    const adminUser = await client.users.getUser(adminId)
    const adminRoles = (adminUser.publicMetadata?.roles as string[]) ?? []
    if (!adminRoles.includes('admin') && !adminRoles.includes('superadmin')) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { memberId } = await req.json()
    if (!memberId) return NextResponse.json({ error: 'memberId obrigatório' }, { status: 400 })

    const member = await prisma.member.findUnique({ where: { id: memberId } })
    if (!member) return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 })

    const password = generatePassword()

    // Verifica se já tem usuário no Clerk pelo username existente
    if (member.username) {
      const { data: existingUsers } = await client.users.getUserList({ username: [member.username] })

      if (existingUsers.length > 0) {
        // Já tem conta — só reseta a senha
        await client.users.updateUser(existingUsers[0].id, { password })
        await prisma.member.update({ where: { id: memberId }, data: { password } })
        return NextResponse.json({ username: member.username, password, action: 'reset' })
      }
    }

    // Não tem conta no Clerk — cria uma nova
    const baseUsername = member.username ?? generateUsername(member.name)
    let username = baseUsername
    let suffix = 1

    while (true) {
      const existingPrisma = await prisma.member.findFirst({ where: { username, id: { not: memberId } } })
      let existingClerk = false
      try {
        const { data: clerkUsers } = await client.users.getUserList({ username: [username] })
        existingClerk = clerkUsers.length > 0
      } catch {}
      if (!existingPrisma && !existingClerk) break
      username = `${baseUsername}${suffix++}`
    }

    // Busca os roles atuais do membro para atribuir no Clerk
    const memberWithRoles = await prisma.member.findUnique({
      where: { id: memberId },
      include: {
        societies: true,
        council: true,
        diaconate: true,
        ministries: true,
        bibleSchoolClass: true,
      },
    })

    const societyIdToRole: Record<number, string> = { 3: 'saf', 4: 'uph', 5: 'ump', 6: 'upa', 7: 'ucp' }
    const roles: string[] = ['member']
    memberWithRoles?.societies.forEach(s => { if (societyIdToRole[s.societyId]) roles.push(societyIdToRole[s.societyId]) })
    if (memberWithRoles?.council)    roles.push('conselho')
    if (memberWithRoles?.diaconate)  roles.push('diaconia')
    if (memberWithRoles?.ministries?.length) roles.push('ministerio')
    if (memberWithRoles?.bibleSchoolClass)   roles.push('ebd')

    await client.users.createUser({
      username,
      password,
      publicMetadata: { roles },
    })

    await prisma.member.update({
      where: { id: memberId },
      data: { username, password },
    })

    return NextResponse.json({ username, password, action: 'created' })
  } catch (error: any) {
    console.error("❌ Erro ao resetar credenciais:", error)
    return NextResponse.json({ error: error?.message ?? "Erro interno" }, { status: 500 })
  }
}