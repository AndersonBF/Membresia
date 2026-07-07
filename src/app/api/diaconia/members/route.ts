import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// Lista os membros da diaconia (para escalar)
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const members = await prisma.member.findMany({
    where: { diaconate: { isNot: null } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, profileImageUrl: true },
  })
  return NextResponse.json(members)
}
