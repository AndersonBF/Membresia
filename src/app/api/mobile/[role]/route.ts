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

    // 🔥 SWITCH baseado no seu schema REAL
    switch (role.toLowerCase()) {

      case "council":
        const council = await prisma.council.findFirst({
          include: { documents: true }
        })
        return NextResponse.json(council, { headers: corsHeaders })

      case "diaconate":
        const diaconate = await prisma.diaconate.findFirst({
          include: { documents: true }
        })
        return NextResponse.json(diaconate, { headers: corsHeaders })

      case "society":
        const societies = await prisma.internalSociety.findMany({
          include: {
            documents: true,
            broadcasts: true,
            events: true,
          }
        })
        return NextResponse.json(societies, { headers: corsHeaders })

      case "ministry":
        const ministries = await prisma.ministry.findMany({
          include: { documents: true }
        })
        return NextResponse.json(ministries, { headers: corsHeaders })

      case "bibleschool":
        const classes = await prisma.bibleSchoolClass.findMany({
          include: { documents: true }
        })
        return NextResponse.json(classes, { headers: corsHeaders })

      default:
        return NextResponse.json(
          { error: "Role inválida" },
          { status: 404, headers: corsHeaders }
        )
    }

  } catch (error) {
    console.error("ERRO NA API:", error)

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500, headers: corsHeaders }
    )
  }
}