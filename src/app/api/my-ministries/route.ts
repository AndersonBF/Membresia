import { currentUser } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json([])

  const roles = (user.publicMetadata?.roles as string[]) ?? []
  const isSuperAdmin = roles.includes("superadmin")
  const isAdmin = roles.includes("admin") || isSuperAdmin

  // Admin e superadmin veem todos os ministérios
  if (isAdmin) {
    const all = await prisma.ministry.findMany({ orderBy: { name: "asc" } })
    return NextResponse.json(all)
  }

  // Membro comum: busca pelo email
  const email = user.emailAddresses[0]?.emailAddress
  if (!email) return NextResponse.json([])

  const member = await prisma.member.findFirst({
    where: { email },
    include: {
      ministries: {
        include: { ministry: true },
      },
    },
  })

  if (!member) return NextResponse.json([])

  const ministries = member.ministries.map((mm) => mm.ministry)
  return NextResponse.json(ministries)
}