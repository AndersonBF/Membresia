// src/app/api/gallery/upload/route.ts
import { currentUser } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// GET → devolve credenciais para upload direto browser → Cloudinary
// Usado em produção (Vercel) para evitar o limite de 4.5MB
export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const cloudName    = process.env.CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET

  if (!cloudName) {
    console.error("[gallery/upload] CLOUDINARY_CLOUD_NAME não definido")
    return NextResponse.json({ error: "CLOUDINARY_CLOUD_NAME não configurado" }, { status: 500 })
  }
  if (!uploadPreset) {
    console.error("[gallery/upload] CLOUDINARY_UPLOAD_PRESET não definido")
    return NextResponse.json({ error: "CLOUDINARY_UPLOAD_PRESET não configurado. Adicione esta variável de ambiente na Vercel." }, { status: 500 })
  }

  return NextResponse.json({ cloudName, uploadPreset })
}

// POST → upload via servidor
// Usado como fallback (localhost) onde não há limite de body
export async function POST(req: NextRequest) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get("file") as File | null

  if (!file) {
    return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
  }

  const bytes  = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const result = await new Promise<any>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: "gallery",
        resource_type: "image",
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      },
      (error, result) => {
        if (error) reject(error)
        else resolve(result)
      }
    ).end(buffer)
  })

  return NextResponse.json({ url: result.secure_url }, { status: 200 })
}