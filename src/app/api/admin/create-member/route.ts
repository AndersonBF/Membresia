import { clerkClient } from '@clerk/nextjs/server'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

const societyMap: Record<string, number> = {
  saf: 3,
  uph: 4,
  ump: 5,
  upa: 6,
  ucp: 7,
}

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

    const { name, email, phone, birthDate, gender, roles } = await req.json()

    const baseUsername = generateUsername(name)
    const password = generatePassword()

    let username = baseUsername
    let suffix = 1
    while (true) {
      const existingPrisma = await prisma.member.findFirst({ where: { username } })

      let existingClerk = false
      try {
        const { data: clerkUsers } = await client.users.getUserList({ username: [username] })
        existingClerk = clerkUsers.length > 0
      } catch {}

      if (!existingPrisma && !existingClerk) break
      username = `${baseUsername}${suffix++}`
    }

    const clerkUser = await client.users.createUser({
      username,
      password,
      publicMetadata: { roles: ["member", ...roles] },
    })

    // Cria o membro no Prisma
    const member = await prisma.member.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        gender: gender === "M" ? "MASCULINO" : gender === "F" ? "FEMININO" : null,
        username,
        password,
      },
    })

    // Cria relações de sociedades
    const societyRoles = roles.filter((r: string) => societyMap[r])
    if (societyRoles.length > 0) {
      await prisma.memberSociety.createMany({
        data: societyRoles.map((r: string) => ({
          memberId: member.id,
          societyId: societyMap[r],
        })),
      })
    }

    // Cria relação com conselho
    if (roles.includes("conselho")) {
      await prisma.memberCouncil.create({
        data: { memberId: member.id, councilId: 1 },
      })
    }

    // Cria relação com diaconia
    if (roles.includes("diaconia")) {
      await prisma.memberDiaconate.create({
        data: { memberId: member.id, diaconateId: 1 },
      })
    }

    // Cria relação com ministério
    if (roles.includes("ministerio")) {
      const ministry = await prisma.ministry.findFirst()
      if (ministry) {
        await prisma.memberMinistry.create({
          data: { memberId: member.id, ministryId: ministry.id },
        })
      }
    }

    return NextResponse.json({ username, password, clerkId: clerkUser.id })
  } catch (error: any) {
    console.error("❌ Erro ao criar membro:", error)
    return NextResponse.json({ error: error?.message ?? "Erro interno" }, { status: 500 })
  }
}