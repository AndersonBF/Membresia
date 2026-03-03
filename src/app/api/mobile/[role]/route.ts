// app/api/mobile/[role]/route.ts
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

    // ── CONSELHO ──────────────────────────────────────────────
    if (roleParam === "conselho" || roleParam === "council") {
      const council = await prisma.council.findFirst({
        include: {
          documents: true,
          finances:  true,
          members: {
            include: { member: true },
          },
        },
      })
      return NextResponse.json(
        { ...council, events: [] },
        { headers: corsHeaders }
      )
    }

    // ── DIACONIA ──────────────────────────────────────────────
    if (roleParam === "diaconia" || roleParam === "diaconate") {
      const diaconate = await prisma.diaconate.findFirst({
        include: {
          documents: true,
          members: {
            include: { member: true },
          },
        },
      })
      return NextResponse.json(
        { ...diaconate, events: [] },
        { headers: corsHeaders }
      )
    }

    // ── SOCIEDADES INTERNAS ───────────────────────────────────
    const societyMap: Record<string, string> = {
      ump:       "UMP",
      upa:       "UPA",
      uph:       "UPH",
      saf:       "SAF",
      ucp:       "UCP",
      ministerio:"Ministério",
      ebd:       "EBD",
    }

    const societyName = societyMap[roleParam]

    if (societyName) {
      const society = await prisma.internalSociety.findFirst({
        where: { name: societyName },
        include: {
          documents: true,
          events:    true,
          finances:  true,
          members: {
            include: { member: true },
          },
        },
      })

      if (!society) {
        return NextResponse.json(
          { error: "Sociedade não encontrada" },
          { status: 404, headers: corsHeaders }
        )
      }

      return NextResponse.json(society, { headers: corsHeaders })
    }

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