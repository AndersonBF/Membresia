// src/app/api/members/by-role/route.ts
import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { Prisma } from "@prisma/client"

const societyMap: Record<string, number> = {
  saf: 3, uph: 4, ump: 5, upa: 6, ucp: 7,
}

export async function GET(req: NextRequest) {
  const { sessionClaims } = await auth()
  const roles = (sessionClaims?.metadata as { roles?: string[] })?.roles ?? []
  const isSuperAdmin = roles.includes("superadmin")
  const isAdmin = isSuperAdmin || roles.includes("admin")

  const { searchParams } = req.nextUrl
  const role   = searchParams.get("role") ?? ""
  const page   = parseInt(searchParams.get("page") ?? "1")
  const limit  = parseInt(searchParams.get("limit") ?? "10")
  const search = searchParams.get("search") ?? ""

  // verifica acesso
  if (!isSuperAdmin && !roles.includes(role) && !isAdmin) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
  }

  let memberWhere: Prisma.MemberWhereInput = {}

  if (societyMap[role]) {
    memberWhere = { societies: { some: { societyId: societyMap[role] } } }
  } else if (role === "conselho") {
    memberWhere = { council: { isNot: null } }
  } else if (role === "diaconia") {
    memberWhere = { diaconate: { isNot: null } }
  } else if (role === "ministerio") {
    memberWhere = { ministries: { some: {} } }
  } else if (role === "ebd") {
    memberWhere = { bibleSchoolClassId: { not: null } }
  }

  if (search) {
    memberWhere = {
      ...memberWhere,
      name: { contains: search, mode: "insensitive" },
    }
  }

  const [members, total] = await prisma.$transaction([
    prisma.member.findMany({
      where: memberWhere,
      take: limit,
      skip: limit * (page - 1),
      orderBy: [
        { societies: { _count: "desc" } },
        { name: "asc" },
      ],
      include: {
        societies: { include: { society: true } },
        council: true,
        diaconate: true,
        ministries: { include: { ministry: true } },
        bibleSchoolClass: true,
      },
    }),
    prisma.member.count({ where: memberWhere }),
  ])

  return NextResponse.json({ members, total })
}