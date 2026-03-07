// src/app/api/settings/route.ts
import { currentUser } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const settings = await prisma.churchSettings.findFirst()
    return NextResponse.json(settings ?? {})
  } catch {
    return NextResponse.json({ error: "Erro ao buscar configurações" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await currentUser()
    const roles = (user?.publicMetadata?.roles as string[]) ?? []
    const isAdmin = roles.includes("admin") || roles.includes("superadmin")

    if (!isAdmin) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
    }

    const body = await req.json()

    const settings = await prisma.churchSettings.upsert({
      where: { id: 1 },
      update: {
        churchName:        body.churchName        ?? undefined,
        youtubeChannelUrl: body.youtubeChannelUrl ?? undefined,
      },
      create: {
        id:                1,
        churchName:        body.churchName        ?? null,
        youtubeChannelUrl: body.youtubeChannelUrl ?? null,
      },
    })

    return NextResponse.json(settings)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Erro ao salvar configurações" }, { status: 500 })
  }
}