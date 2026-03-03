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
    const roleParam = context.params.role?.toLowerCase()

    if (!roleParam) {
      return NextResponse.json(
        { error: "Role não informada" },
        { status: 400, headers: corsHeaders }
      )
    }

    // =============================
    // 1️⃣ COUNCIL
    // =============================
    if (roleParam === "council") {
      const council = await prisma.council.findFirst({
        include: {
          documents: true,
          finances: true,
          members: {
            include: {
              member: true,
            },
          },
        },
      })

      return NextResponse.json(council, { headers: corsHeaders })
    }

    // =============================
    // 2️⃣ DIACONATE
    // =============================
    if (roleParam === "diaconate") {
      const diaconate = await prisma.diaconate.findFirst({
        include: {
          documents: true,
          members: {
            include: {
              member: true,
            },
          },
        },
      })

      return NextResponse.json(diaconate, { headers: corsHeaders })
    }

    // =============================
    // 3️⃣ SOCIEDADES INTERNAS
    // =============================
    const societyMap: Record<string, string> = {
      ump: "UMP",
      upa: "UPA",
      uph: "UPH",
      saf: "SAF",
    }

    if (societyMap[roleParam]) {
      const society = await prisma.internalSociety.findFirst({
        where: {
          name: societyMap[roleParam],
        },
        include: {
          documents: true,
          broadcasts: true,
          events: true,
          finances: true,
          members: {
            include: {
              member: true,
            },
          },
        },
      })

      if (!society) {
        return NextResponse.json(
          { error: "Sociedade não encontrada no banco" },
          { status: 404, headers: corsHeaders }
        )
      }

      return NextResponse.json(society, { headers: corsHeaders })
    }

    // =============================
    // ROLE INVÁLIDA
    // =============================
    return NextResponse.json(
      { error: "Role inválida" },
      { status: 404, headers: corsHeaders }
    )

  } catch (error) {
    console.error("ERRO NA API MOBILE:", error)

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500, headers: corsHeaders }
    )
  }
}