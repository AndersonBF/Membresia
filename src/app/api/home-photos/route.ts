// src/app/api/home-photos/route.ts
// Fotos da home pública da igreja (carrossel do hero). Guardadas em
// ChurchSettings.preferences.homePhotos (array de URLs Cloudinary) — sem mudança
// de schema. O upload em si usa /api/gallery/upload (Cloudinary).
import { currentUser } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const s = await prisma.churchSettings.findFirst({ select: { preferences: true } })
  const photos = ((s?.preferences as any)?.homePhotos as string[]) ?? []
  return NextResponse.json({ photos })
}

export async function POST(req: Request) {
  const user = await currentUser()
  const roles = (user?.publicMetadata?.roles as string[]) ?? []
  const allowed = roles.includes("admin") || roles.includes("superadmin") || roles.includes("pastor")
  if (!allowed) return NextResponse.json({ error: "Sem permissão" }, { status: 403 })

  const { photos } = await req.json().catch(() => ({}))
  if (!Array.isArray(photos)) {
    return NextResponse.json({ error: "photos deve ser um array" }, { status: 400 })
  }
  const clean = photos.filter((p) => typeof p === "string" && p).slice(0, 12)

  // Merge: preserva as demais preferências (toggles etc).
  const current = ((await prisma.churchSettings.findFirst({ select: { preferences: true } }))
    ?.preferences as Record<string, unknown> | null) ?? {}
  const preferences = { ...current, homePhotos: clean }

  await prisma.churchSettings.upsert({
    where: { id: 1 },
    update: { preferences },
    create: { id: 1, preferences },
  })
  return NextResponse.json({ ok: true, photos: clean })
}
