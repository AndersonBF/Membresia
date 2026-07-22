// src/app/api/group/visitors/[id]/route.ts
// Edição e exclusão de visitantes de um grupo.
import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getManageableGroups, roleForSocietyId } from "@/lib/permissions"

/** Role do grupo a que o visitante pertence (para checagem de permissão). */
async function roleOfVisitor(id: number): Promise<string | null | undefined> {
  const visitor = await prisma.visitor.findUnique({
    where: { id },
    select: { societyId: true, category: true },
  })
  if (!visitor) return undefined // não existe
  return visitor.societyId ? roleForSocietyId(visitor.societyId) : visitor.category
}

async function guard(id: number) {
  if (!Number.isInteger(id)) return { error: "ID inválido", status: 400 }

  const role = await roleOfVisitor(id)
  if (role === undefined) return { error: "Visitante não encontrado", status: 404 }

  const { isAdmin, groups } = await getManageableGroups()
  if (!isAdmin && !(role && groups.has(role))) {
    return { error: "Sem permissão", status: 403 }
  }
  return null
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  const denied = await guard(id)
  if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Payload inválido" }, { status: 400 })

  const { name, phone, email, gender, birthDate, notes, isActive } = body

  if (name !== undefined && (typeof name !== "string" || !name.trim())) {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
  }

  const visitor = await prisma.visitor.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(phone !== undefined && { phone: phone?.trim() || null }),
      ...(email !== undefined && { email: email?.trim() || null }),
      ...(gender !== undefined && {
        gender: gender === "MASCULINO" || gender === "FEMININO" ? gender : null,
      }),
      ...(birthDate !== undefined && { birthDate: birthDate ? new Date(birthDate) : null }),
      ...(notes !== undefined && { notes: notes?.trim() || null }),
      ...(isActive !== undefined && { isActive: Boolean(isActive) }),
    },
  })

  return NextResponse.json({ visitor })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  const denied = await guard(id)
  if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status })

  await prisma.visitor.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
