// app/api/gallery/albums/[id]/route.ts
import { currentUser } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const id = Number(params.id)
  await prisma.galleryAlbum.delete({ where: { id } })
  return NextResponse.json({ success: true })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const id = Number(params.id)
  const body = await req.json()
  const { title, description, coverUrl } = body

  const album = await prisma.galleryAlbum.update({
    where: { id },
    data: { title, description, coverUrl },
  })
  return NextResponse.json(album)
}