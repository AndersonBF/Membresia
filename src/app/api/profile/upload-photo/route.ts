// src/app/api/profile/upload-photo/route.ts
import { auth, clerkClient } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"
import prisma from "@/lib/prisma"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // 1. Upload para o Cloudinary (crop quadrado 400x400)
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

  // 2. Atualiza a foto no Clerk
  try {
    const client = await clerkClient()
    await client.users.updateUserProfileImage(userId, {
      file: new Blob([buffer], { type: file.type }),
    })
  } catch (e) {
    console.error("Erro ao atualizar foto no Clerk:", e)
    // Não bloqueia — a URL do Cloudinary já foi salva
  }

  // 3. Descobre o username do Clerk para encontrar o membro no Prisma
  try {
    const client = await clerkClient()
    const clerkUser = await client.users.getUser(userId)
    const username = clerkUser.username

    if (username) {
      await prisma.member.updateMany({
        where: { username },
        data: { profileImageUrl: imageUrl },
      })
    }
  } catch (e) {
    console.error("Erro ao atualizar profileImageUrl no Prisma:", e)
    // Não bloqueia — Clerk já foi atualizado
  }

  return NextResponse.json({ url: imageUrl })
}