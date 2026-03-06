// src/app/api/ministerio/add-member/route.ts
import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import prisma from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const user = await currentUser()
  const roles = (user?.publicMetadata?.roles as string[]) ?? []
  const isAdmin = roles.includes("admin") || roles.includes("superadmin")

  if (!isAdmin) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
  }

  const { ministryId, memberId } = await req.json()

  if (!ministryId || !memberId) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
  }

  try {
    await prisma.memberMinistry.create({
      data: { memberId, ministryId },
    })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    // P2002 = unique constraint (membro já está no ministério)
    if (e.code === "P2002") {
      return NextResponse.json({ error: "Membro já está neste ministério" }, { status: 409 })
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}