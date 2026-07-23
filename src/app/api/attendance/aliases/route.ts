// src/app/api/attendance/aliases/route.ts
//
// Guarda o que o usuário ensinou na tela de conferência: "este risco da folha é
// fulano". Da próxima leitura o nome já vem reconhecido sozinho, sem depender
// da semelhança com o cadastro.

import { NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import prisma from "@/lib/prisma"
import { canManageGroup } from "@/lib/permissions"
import { normalize } from "@/lib/nameMatch"

export const dynamic = "force-dynamic"

type AliasInput = {
  readName?: string
  memberId?: number
  visitorId?: number
}

type Body = {
  role?: string
  aliases?: AliasInput[]
}

/** Limite de segurança: uma folha não tem centenas de nomes. */
const MAX_ALIASES = 80

export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 })

  let body: Body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 })
  }

  const { role, aliases } = body

  if (!role || typeof role !== "string") {
    return NextResponse.json({ error: "Grupo não informado." }, { status: 400 })
  }
  if (!Array.isArray(aliases) || aliases.length === 0) {
    return NextResponse.json({ saved: 0 })
  }
  if (aliases.length > MAX_ALIASES) {
    return NextResponse.json({ error: "Vínculos demais de uma vez." }, { status: 400 })
  }

  // Só quem administra o grupo ensina o reconhecimento dele.
  if (!(await canManageGroup(role))) {
    return NextResponse.json({ error: "Sem permissão neste grupo." }, { status: 403 })
  }

  // Um nome só pode apontar para uma pessoa; se vier repetido na mesma folha,
  // vale o último.
  const clean = new Map<
    string,
    { normalized: string; readName: string; memberId: number | null; visitorId: number | null }
  >()

  for (const alias of aliases) {
    const readName = typeof alias?.readName === "string" ? alias.readName.trim() : ""
    if (readName.length < 2 || readName.length > 120) continue

    const normalized = normalize(readName)
    if (!normalized) continue

    const memberId = Number.isInteger(alias?.memberId) ? (alias!.memberId as number) : null
    const visitorId = Number.isInteger(alias?.visitorId) ? (alias!.visitorId as number) : null
    // Exatamente um alvo.
    if ((memberId === null) === (visitorId === null)) continue

    clean.set(normalized, { normalized, readName, memberId, visitorId })
  }

  if (clean.size === 0) return NextResponse.json({ saved: 0 })

  // Ensinar de novo corrige o que estava errado antes, por isso é upsert.
  await prisma.$transaction(
    Array.from(clean.values()).map((a) =>
      prisma.sheetNameAlias.upsert({
        where: { role_normalized: { role, normalized: a.normalized } },
        create: {
          role,
          normalized: a.normalized,
          readName: a.readName,
          memberId: a.memberId,
          visitorId: a.visitorId,
          createdBy: user.id,
        },
        update: {
          readName: a.readName,
          memberId: a.memberId,
          visitorId: a.visitorId,
          createdBy: user.id,
        },
      }),
    ),
  )

  return NextResponse.json({ saved: clean.size })
}
