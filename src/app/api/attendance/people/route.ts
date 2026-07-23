// src/app/api/attendance/people/route.ts
//
// Cadastra, a partir da leitura da folha, os nomes que não bateram com
// ninguém. O usuário escolhe na tela quem vira membro e quem vira visitante —
// esta rota só grava o que ele confirmou.

import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getManageableGroups, societyMap } from "@/lib/permissions"
import { roleHasVisitors } from "@/lib/visitorScope"
import { normalize } from "@/lib/nameMatch"

export const dynamic = "force-dynamic"

type Kind = "member" | "visitor"

type Body = {
  kind?: Kind
  names?: string[]
  /** Grupo de onde a chamada partiu (ump, ebd, diaconia…) */
  role?: string
  /** Turma da EBD, quando a chamada é de uma turma */
  classId?: number
}

/** Limite de segurança: uma folha não tem centenas de nomes novos. */
const MAX_NAMES = 60

export async function POST(req: Request) {
  let body: Body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 })
  }

  const { kind, names, role, classId } = body

  if (kind !== "member" && kind !== "visitor") {
    return NextResponse.json({ error: "Tipo inválido." }, { status: 400 })
  }
  if (!Array.isArray(names) || names.length === 0) {
    return NextResponse.json({ error: "Nenhum nome enviado." }, { status: 400 })
  }
  if (names.length > MAX_NAMES) {
    return NextResponse.json({ error: "Nomes demais de uma vez." }, { status: 400 })
  }
  if (!role || typeof role !== "string") {
    return NextResponse.json({ error: "Grupo não informado." }, { status: 400 })
  }

  // Só quem administra o grupo pode cadastrar gente nele.
  const { isAdmin, groups } = await getManageableGroups()
  if (!isAdmin && !groups.has(role)) {
    return NextResponse.json({ error: "Sem permissão para cadastrar neste grupo." }, { status: 403 })
  }

  if (kind === "visitor" && !roleHasVisitors(role)) {
    return NextResponse.json({ error: "Este grupo não recebe visitantes." }, { status: 400 })
  }

  const clean = Array.from(
    new Map(
      names
        .map((n) => (typeof n === "string" ? n.trim() : ""))
        .filter((n) => n.length >= 2 && n.length <= 120)
        // Dois riscos que normalizam igual viram um cadastro só.
        .map((n) => [normalize(n), n] as const),
    ).values(),
  )

  if (clean.length === 0) {
    return NextResponse.json({ error: "Nenhum nome válido." }, { status: 400 })
  }

  const societyId = societyMap[role] ?? null

  if (kind === "member") {
    const created = await prisma.$transaction(
      clean.map((name) =>
        prisma.member.create({
          data: {
            name,
            // Já entra vinculado ao grupo de onde veio a chamada.
            ...(classId ? { bibleSchoolClassId: classId } : {}),
            ...(societyId ? { societies: { create: { societyId } } } : {}),
            ...(role === "diaconia" ? { diaconate: { create: { diaconateId: 1 } } } : {}),
            ...(role === "conselho" ? { council: { create: { councilId: 1 } } } : {}),
          },
          select: { id: true, name: true, email: true },
        }),
      ),
    )
    return NextResponse.json({ created })
  }

  // Visitante: escopo igual ao usado no resto do sistema — sociedade por id,
  // demais grupos por categoria.
  const created = await prisma.$transaction(
    clean.map((name) =>
      prisma.visitor.create({
        data: {
          name,
          societyId,
          category: societyId ? null : role,
          notes: "Cadastrado pela leitura da lista de presença.",
        },
        select: { id: true, name: true, phone: true },
      }),
    ),
  )
  return NextResponse.json({ created })
}
