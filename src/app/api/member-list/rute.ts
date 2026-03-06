// src/app/api/members-list/route.ts
import { currentUser } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const roles = (user.publicMetadata?.roles as string[]) ?? []
  const isAdmin = roles.includes("admin") || roles.includes("superadmin")
  if (!isAdmin) return NextResponse.json({ error: "Sem permissão" }, { status: 403 })

  const members = await prisma.member.findMany({
    orderBy: { name: "asc" },
    include: {
      societies: { include: { society: true } },
      council: true,
      diaconate: true,
      ministries: { include: { ministry: true } },
      bibleSchoolClass: true,
    },
  })

  return NextResponse.json(members)
}