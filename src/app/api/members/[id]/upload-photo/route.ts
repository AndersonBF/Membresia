// src/app/api/members/[id]/upload-photo/route.ts
import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"
import prisma from "@/lib/prisma"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { sessionClaims } = await auth()
  const roles = (sessionClaims?.metadata as { roles?: string[] })?.roles ?? []
  const isAdmin = roles.includes("admin") || roles.includes("superadmin")
  if (!isAdmin) return NextResponse.json({ error: "Sem permissão" }, { status: 403 })

  const id = parseInt(params.id)
  if (isNaN(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Upload para o Cloudinary (crop quadrado 400x400)
  const result = await new Promise<any>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: "profile_photos",
        transformation: [
          { width: 400, height: 400, crop: "fill", gravity: "face" },
          { quality: "auto", fetch_format: "auto" },
        ],
      },
      (error, result) => {
        if (error) reject(error)
        else resolve(result)
      }
    ).end(buffer)
  })

  const imageUrl: string = result.secure_url

  // Salva no Prisma
  await prisma.member.update({
    where: { id },
    data: { profileImageUrl: imageUrl },
  })

  return NextResponse.json({ url: imageUrl })
}