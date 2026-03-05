// app/api/gallery/albums/route.ts
import { currentUser } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

const societyMap: Record<string, number> = {
  saf: 3, uph: 4, ump: 5, upa: 6, ucp: 7,
}

function getWhereForRole(role: string) {
  const societyId = societyMap[role]
  if (societyId)   return { societyId }
  if (role === "conselho")   return { councilId: 1 }
  if (role === "diaconia")   return { diaconateId: 1 }
  if (role === "ministerio") return { ministryId: { not: null as any } }
  if (role === "ebd")        return { bibleSchoolClassId: { not: null as any } }
  return {}
}

// GET /api/gallery/albums?role=ump
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const role = searchParams.get("role") ?? ""

  const where = getWhereForRole(role)

  const albums = await prisma.galleryAlbum.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      photos: { orderBy: { createdAt: "asc" } },
      _count: { select: { photos: true } },
    },
  })

  return NextResponse.json(albums)
}

// POST /api/gallery/albums
export async function POST(req: NextRequest) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const roles = (user.publicMetadata?.roles as string[]) ?? []
  const isSuperAdmin = roles.includes("superadmin") || roles.includes("admin")

  const body = await req.json()
  const { title, description, coverUrl, role } = body

  if (!title || !role) {
    return NextResponse.json({ error: "title e role são obrigatórios" }, { status: 400 })
  }

  // Verifica se tem acesso ao role
  if (!isSuperAdmin && !roles.includes(role)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  const societyId = societyMap[role]
  const data: any = { title, description, coverUrl }

  if (societyId)              data.societyId = societyId
  else if (role === "conselho")   data.councilId = 1
  else if (role === "diaconia")   data.diaconateId = 1
  else if (role === "ministerio") data.ministryId = 1
  else if (role === "ebd")        data.bibleSchoolClassId = 1

  const album = await prisma.galleryAlbum.create({ data })
  return NextResponse.json(album, { status: 201 })
}