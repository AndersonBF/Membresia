import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import prisma from "@/lib/prisma"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

// Responde ao preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

const societyMap: Record<string, number> = {
  saf: 3, uph: 4, ump: 5, upa: 6, ucp: 7,
}

const directoryCargos = [
  "Presidente", "Vice-Presidente",
  "1º Secretário", "2º Secretário",
  "Tesoureiro", "1º Tesoureiro", "2º Tesoureiro",
]

export async function GET(
  req: Request,
  { params }: { params: { role: string } }
) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401, headers: corsHeaders })
  }

  const role = params.role
  const societyId = societyMap[role]

  let memberWhere: any = {}
  let eventWhere: any = {}
  let documentWhere: any = {}
  let directoryMembers: any[] = []

  if (societyId) {
    memberWhere   = { societies: { some: { societyId } } }
    eventWhere    = { societyId }
    documentWhere = { societyId }

    const societyWithCargos = await prisma.memberSociety.findMany({
      where: { societyId, cargo: { not: null } },
      include: {
        member: {
          select: { id: true, name: true, phone: true, gender: true, isActive: true },
        },
      },
    })

    directoryMembers = societyWithCargos
      .filter(ms => ms.cargo && directoryCargos.includes(ms.cargo))
      .sort((a, b) => directoryCargos.indexOf(a.cargo!) - directoryCargos.indexOf(b.cargo!))

  } else if (role === "conselho") {
    memberWhere   = { council: { isNot: null } }
    documentWhere = { councilId: 1 }
  } else if (role === "diaconia") {
    memberWhere   = { diaconate: { isNot: null } }
    documentWhere = { diaconateId: 1 }
  } else if (role === "ministerio") {
    memberWhere   = { ministries: { some: {} } }
    documentWhere = { ministryId: { not: null } }
  } else if (role === "ebd") {
    memberWhere   = { bibleSchoolClassId: { not: null } }
    documentWhere = { bibleSchoolClassId: { not: null } }
  }

  const now = new Date()

  const [totalMembers, totalEvents, totalDocuments, recentMembers, upcomingEvents, allMembers] =
    await Promise.all([
      prisma.member.count({ where: memberWhere }),
      prisma.event.count({ where: eventWhere }),
      prisma.document.count({ where: documentWhere }),
      prisma.member.findMany({ where: memberWhere, orderBy: { name: "asc" }, take: 8 }),
      prisma.event.findMany({
        where: { ...eventWhere, date: { gte: now } },
        orderBy: { date: "asc" },
        take: 3,
      }),
      prisma.member.findMany({
        where: { ...memberWhere, birthDate: { not: null }, isActive: true },
        select: { id: true, name: true, birthDate: true },
      }),
    ])

  const birthdaysThisMonth = allMembers
    .filter(m => new Date(m.birthDate!).getMonth() === now.getMonth())
    .sort((a, b) => new Date(a.birthDate!).getDate() - new Date(b.birthDate!).getDate())

  return NextResponse.json({
    totalMembers,
    totalEvents,
    totalDocuments,
    directoryMembers,
    recentMembers,
    upcomingEvents,
    birthdaysThisMonth,
  }, { headers: corsHeaders })
}