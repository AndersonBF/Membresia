// src/app/api/members/[id]/route.ts
import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { sessionClaims } = await auth()
  const roles = (sessionClaims?.metadata as { roles?: string[] })?.roles ?? []
  const isAdmin = roles.includes("admin") || roles.includes("superadmin")
  if (!isAdmin) return NextResponse.json({ error: "Sem permissão" }, { status: 403 })

  const id = parseInt(params.id)
  if (isNaN(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      societies: { include: { society: true } },
      council: true,
      diaconate: true,
      ministries: { include: { ministry: true } },
      bibleSchoolClass: true,
      attendances: {
        take: 30,
        orderBy: { id: "desc" },
        include: {
          event: { select: { title: true, date: true } },
        },
      },
    },
  })

  if (!member) return NextResponse.json({ error: "Membro não encontrado" }, { status: 404 })

  return NextResponse.json(member)
}