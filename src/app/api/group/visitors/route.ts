// src/app/api/group/visitors/route.ts
// Cadastro de visitantes por grupo (sociedade interna, EBD, diaconia, …).
// Quem pode gerir: admin/superadmin/pastor ou quem ocupa cargo no grupo.
import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getManageableGroups } from "@/lib/permissions"
import { isGroupRole, scopeForRole } from "@/lib/visitorScope"

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Payload inválido" }, { status: 400 })

  const { role, name, phone, email, gender, birthDate, notes } = body

  if (typeof role !== "string" || !isGroupRole(role)) {
    return NextResponse.json({ error: "Grupo inválido" }, { status: 400 })
  }

  const { isAdmin, groups } = await getManageableGroups()
  if (!isAdmin && !groups.has(role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
  }

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
  }

  const scope = scopeForRole(role)

  const visitor = await prisma.visitor.create({
    data: {
      name: name.trim(),
      phone: phone?.trim() || null,
      email: email?.trim() || null,
      gender: gender === "MASCULINO" || gender === "FEMININO" ? gender : null,
      birthDate: birthDate ? new Date(birthDate) : null,
      notes: notes?.trim() || null,
      societyId: scope.societyId,
      category: scope.category,
    },
  })

  return NextResponse.json({ visitor })
}
