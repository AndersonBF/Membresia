// src/app/api/admin/reset-credentials/route.ts
import { clerkClient } from '@clerk/nextjs/server'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getManageableGroups, roleForSocietyId } from '@/lib/permissions'

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

    const { memberId } = await req.json()
    if (!memberId) return NextResponse.json({ error: 'memberId obrigatório' }, { status: 400 })

    // Permissão: admin/superadmin/pastor gerem qualquer um; um líder de grupo
    // (quem tem cargo na Diaconia/Conselho/Sociedade) só pode gerar credenciais
    // para membros que pertençam a um grupo que ele gerencia.
    const { isAdmin, groups } = await getManageableGroups()
    if (!isAdmin) {
      if (groups.size === 0) {
        return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
      }
      const target = await prisma.member.findUnique({
        where: { id: memberId },
        select: {
          societies: { select: { societyId: true } },
          diaconate: { select: { id: true } },
          council: { select: { id: true } },
        },
      })
      if (!target) return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 })

      const targetGroups = new Set<string>()
      for (const s of target.societies) {
        const role = roleForSocietyId(s.societyId)
        if (role) targetGroups.add(role)
      }
      if (target.diaconate) targetGroups.add('diaconia')
      if (target.council) targetGroups.add('conselho')

      const shares = [...targetGroups].some(g => groups.has(g))
      if (!shares) {
        return NextResponse.json({ error: 'Sem permissão para este membro' }, { status: 403 })
      }
    }

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
        teachingAssignments: true,
      },
    })

    const societyIdToRole: Record<number, string> = { 3: 'saf', 4: 'uph', 5: 'ump', 6: 'upa', 7: 'ucp' }
    const roles: string[] = ['member']
    memberWithRoles?.societies.forEach(s => { if (societyIdToRole[s.societyId]) roles.push(societyIdToRole[s.societyId]) })
    if (memberWithRoles?.council)    roles.push('conselho')
    if (memberWithRoles?.diaconate)  roles.push('diaconia')
    if (memberWithRoles?.ministries?.length) roles.push('ministerio')
    // Aluno de turma OU professora (ClassTeacher) recebe acesso à EBD
    if (memberWithRoles?.bibleSchoolClass || memberWithRoles?.teachingAssignments?.length) roles.push('ebd')

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