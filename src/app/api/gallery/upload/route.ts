// src/app/api/gallery/upload/route.ts
import { currentUser } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// GET → devolve credenciais para upload direto browser → Cloudinary
// Não importa o SDK — apenas lê variáveis de ambiente
export async function GET() {
  try {
    const user = await currentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const cloudName    = process.env.CLOUDINARY_CLOUD_NAME    ?? null
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET ?? null

    return NextResponse.json({ cloudName, uploadPreset })
  } catch (err: any) {
    console.error("[GET /api/gallery/upload]", err)
    return NextResponse.json({ error: err?.message ?? "Erro interno" }, { status: 500 })
  }
}

// POST → upload via servidor (fallback para localhost)
export async function POST(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Import dinâmico para evitar inicialização no topo do módulo
    const { v2: cloudinary } = await import("cloudinary")
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key:    process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    })

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    if (!file) return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())

    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: "gallery", resource_type: "image" },
        (error, result) => { if (error) reject(error); else resolve(result) }
      ).end(buffer)
    })

    return NextResponse.json({ url: result.secure_url })
  } catch (err: any) {
    console.error("[POST /api/gallery/upload]", err)
    return NextResponse.json({ error: err?.message ?? "Erro interno" }, { status: 500 })
  }
}