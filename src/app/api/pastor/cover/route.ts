// src/app/api/pastor/cover/route.ts
import { currentUser } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// Salva a imagem do card/capa do Painel do Pastor (guardada em ChurchSettings).
// Pode alterar: pastor, admin ou superadmin.
export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const roles = (user.publicMetadata?.roles as string[]) ?? []
  const allowed =
    roles.includes("pastor") || roles.includes("admin") || roles.includes("superadmin")
  if (!allowed) return NextResponse.json({ error: "Sem permissão" }, { status: 403 })

  const { coverImageUrl } = await req.json().catch(() => ({}))

  await prisma.churchSettings.upsert({
    where: { id: 1 },
    update: { pastorCoverUrl: coverImageUrl || null },
    create: { id: 1, pastorCoverUrl: coverImageUrl || null },
  })

  return NextResponse.json({ ok: true })
}
