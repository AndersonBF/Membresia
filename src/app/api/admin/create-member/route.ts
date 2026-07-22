import { clerkClient } from '@clerk/nextjs/server'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getManageableGroups } from '@/lib/permissions'
import { resolveTenant } from '@/lib/tenant-server'

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

    // Admin/superadmin criam qualquer membro com qualquer papel.
    // Um líder (com cargo) pode criar membros, mas os papéis ficam restritos
    // aos grupos que ele gere (sem admin/superadmin/superintendente).
    const { isAdmin, groups } = await getManageableGroups()
    if (!isAdmin && groups.size === 0) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    // Só admin/superadmin real podem conceder a função Pastor (pastor tem isAdmin, mas não pode propagá-la).
    const adminUser = await client.users.getUser(adminId)
    const actorRoles = (adminUser.publicMetadata?.roles as string[]) ?? []
    const isRealAdmin = actorRoles.includes('admin') || actorRoles.includes('superadmin')

    const body = await req.json()
    const { name, email, phone, birthDate, gender, cargos } = body
    let roles: string[] = Array.isArray(body.roles) ? body.roles : []

    if (!isRealAdmin) {
      roles = roles.filter((r: string) => r !== 'pastor')
    }

    if (!isAdmin) {
      // Filtra: mantém apenas grupos que o líder gere; remove papéis privilegiados.
      roles = roles.filter((r: string) => groups.has(r))
      if (roles.length === 0) {
        return NextResponse.json({ error: 'Sem permissão para os grupos selecionados' }, { status: 403 })
      }
    }

    // Regra de gênero por grupo: Diaconia/UPH → masculino, SAF → feminino.
    const groupGender: Record<string, "M" | "F"> = { diaconia: "M", uph: "M", saf: "F" }
    for (const r of roles) {
      if (groupGender[r] && gender !== groupGender[r]) {
        const label = groupGender[r] === "M" ? "masculino" : "feminino"
        return NextResponse.json(
          { error: `O grupo ${r.toUpperCase()} é exclusivo do gênero ${label}.` },
          { status: 400 },
        )
      }
    }

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

    // Igreja (tenant) atual — amarra o usuário ao seu subdomínio.
    const church = resolveTenant().slug

    const clerkUser = await client.users.createUser({
      username,
      password,
      publicMetadata: { roles: ["member", ...roles], church },
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

    // Cria relações de sociedades com cargo
    const societyRoles = roles.filter((r: string) => societyMap[r])
    for (const r of societyRoles) {
      await prisma.memberSociety.create({
        data: {
          memberId: member.id,
          societyId: societyMap[r],
          cargo: cargos?.[r] ?? null,
        },
      })
    }

    // Cria relação com conselho
    if (roles.includes("conselho")) {
      await prisma.memberCouncil.create({
        data: { memberId: member.id, councilId: 1, cargo: cargos?.["conselho"] ?? null },
      })
    }

    // Cria relação com diaconia
    if (roles.includes("diaconia")) {
      await prisma.memberDiaconate.create({
        data: { memberId: member.id, diaconateId: 1, cargo: cargos?.["diaconia"] ?? null },
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