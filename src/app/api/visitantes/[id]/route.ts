// src/app/api/visitantes/[id]/route.ts
// Gerência dos contatos de visitantes (protegido — admin/superadmin/pastor).
import { currentUser } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

function canManage(roles: string[]) {
  return roles.includes("admin") || roles.includes("superadmin") || roles.includes("pastor")
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await currentUser()
  const roles = (user?.publicMetadata?.roles as string[]) ?? []
  if (!canManage(roles)) return NextResponse.json({ error: "Sem permissão" }, { status: 403 })

  const id = Number(params.id)
  if (!Number.isInteger(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

  const { handled } = await req.json().catch(() => ({}))
  const updated = await prisma.visitorContact.update({
    where: { id },
    data: { handled: Boolean(handled) },
  })
  return NextResponse.json({ entry: updated })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await currentUser()
  const roles = (user?.publicMetadata?.roles as string[]) ?? []
  if (!canManage(roles)) return NextResponse.json({ error: "Sem permissão" }, { status: 403 })

  const id = Number(params.id)
  if (!Number.isInteger(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

  await prisma.visitorContact.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
