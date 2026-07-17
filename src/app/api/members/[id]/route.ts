// src/app/api/members/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getManageableGroups } from "@/lib/permissions"

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Admin, superintendente ou qualquer líder de grupo (com cargo) pode ver o
  // detalhe de um membro para geri-lo.
  const { isAdmin, groups } = await getManageableGroups()
  if (!isAdmin && groups.size === 0) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
  }

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