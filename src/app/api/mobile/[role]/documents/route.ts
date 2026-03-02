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

const societyMap: Record<string, number> = {
  saf: 3, uph: 4, ump: 5, upa: 6, ucp: 7,
}

export async function GET(
  req: Request,
  { params }: { params: { role: string } }
) {
  const role = params.role
  let where: any = {}

  if (societyMap[role]) {
    where = { societyId: societyMap[role] }
  } else if (role === "conselho") {
    where = { councilId: 1 }
  } else if (role === "diaconia") {
    where = { diaconateId: 1 }
  } else if (role === "ministerio") {
    where = { ministryId: { not: null } }
  } else if (role === "ebd") {
    where = { bibleSchoolClassId: { not: null } }
  }

  const documents = await prisma.document.findMany({
    where,
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(documents, { headers: corsHeaders })
}