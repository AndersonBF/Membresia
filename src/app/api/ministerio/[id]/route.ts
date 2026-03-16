// src/app/api/ministerio/[id]/route.ts
import { currentUser } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const roles = (user.publicMetadata?.roles as string[]) ?? []
  const isSuperAdmin = roles.includes("superadmin")
  const isAdmin = roles.includes("admin")

  const allowedRoles = ["ministerio", "member"]
  const hasAccess = isSuperAdmin || isAdmin || allowedRoles.some(r => roles.includes(r))

  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const id = parseInt(params.id)
  if (isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 })

  const ministry = await prisma.ministry.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          member: {
            select: {
              id: true,
              name: true,
              phone: true,
              gender: true,
              isActive: true,
              profileImageUrl: true,
            },
          },
        },
      },
      documents: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          fileUrl: true,
          createdAt: true,
        },
      },
    },
  })

  if (!ministry) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({
    id: ministry.id,
    name: ministry.name,
    members: ministry.members.map(mm => mm.member),
    documents: ministry.documents,
  })
}