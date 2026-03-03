import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET(
  req: Request,
  context: { params: { role: string } }
) {
  try {
    const role = context.params.role

    if (!role) {
      return NextResponse.json(
        { error: "Role não informada" },
        { status: 400, headers: corsHeaders }
      )
    }

    // 🔥 TESTE SIMPLES PRIMEIRO
    return NextResponse.json(
      { success: true, role },
      { headers: corsHeaders }
    )

  } catch (error) {
    console.error("ERRO NA API:", error)

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500, headers: corsHeaders }
    )
  }
}