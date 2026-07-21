// src/app/api/visit/route.ts
// Endpoint PÚBLICO (sem login) do "Quero conhecer/visitar" da home.
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Corpo inválido" }, { status: 400 })

  const name = typeof body.name === "string" ? body.name.trim() : ""
  const phone = typeof body.phone === "string" ? body.phone.trim() : ""
  const message = typeof body.message === "string" ? body.message.trim() : ""

  if (!name) return NextResponse.json({ error: "Informe seu nome" }, { status: 400 })

  await prisma.visitorContact.create({
    data: {
      name,
      phone: phone || null,
      message: message || null,
    },
  })

  return NextResponse.json({ ok: true }, { status: 201 })
}
