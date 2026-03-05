// app/api/gallery/photos/route.ts
import { currentUser } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// GET /api/gallery/photos?albumId=1
export async function GET(req: NextRequest) {
  const albumId = Number(req.nextUrl.searchParams.get("albumId"))
  if (!albumId) return NextResponse.json({ error: "albumId obrigatório" }, { status: 400 })

  const photos = await prisma.galleryPhoto.findMany({
    where: { albumId },
    orderBy: { createdAt: "asc" },
  })
  return NextResponse.json(photos)
}

// POST /api/gallery/photos
export async function POST(req: NextRequest) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { albumId, url, caption } = body

  if (!albumId || !url) {
    return NextResponse.json({ error: "albumId e url são obrigatórios" }, { status: 400 })
  }

  const photo = await prisma.galleryPhoto.create({
    data: { albumId: Number(albumId), url, caption },
  })
  return NextResponse.json(photo, { status: 201 })
}

// DELETE /api/gallery/photos?id=1
export async function DELETE(req: NextRequest) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const id = Number(req.nextUrl.searchParams.get("id"))
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 })

  await prisma.galleryPhoto.delete({ where: { id } })
  return NextResponse.json({ success: true })
}