// src/app/api/attendance/scan/route.ts
//
// Lê uma foto da lista de presença em papel e devolve os nomes reconhecidos,
// já casados com os membros da turma/evento. Quem confirma é sempre o usuário
// na tela — esta rota não grava presença nenhuma.

import { NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import prisma from "@/lib/prisma"
import { canManageGroup } from "@/lib/permissions"
import { matchNames, normalize, type Candidate } from "@/lib/nameMatch"
import {
  readSheetNames,
  ACCEPTED_MEDIA_TYPES,
  OcrConfigError,
  OcrRefusalError,
  type AcceptedMediaType,
} from "@/lib/sheetOcr"

export const dynamic = "force-dynamic"
// Ler letra cursiva leva alguns segundos — o padrão de 10s da Vercel não basta.
export const maxDuration = 60

/** Quem pode usar a leitura por foto. */
const ALLOWED_ROLES = [
  "superadmin", "admin", "pastor",
  "ebd", "superintendente",
  "diaconia", "conselho", "ministerio",
  "ump", "upa", "uph", "saf", "ucp",
]

/** ~8MB de base64 — acima disso a requisição não vale a pena. */
const MAX_BASE64_LENGTH = 8_000_000

export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 })

  const roles = (user.publicMetadata?.roles as string[]) ?? []
  if (!roles.some((r) => ALLOWED_ROLES.includes(r))) {
    return NextResponse.json({ error: "Sem permissão para usar a leitura por foto." }, { status: 403 })
  }

  let body: {
    imageBase64?: string
    mediaType?: string
    candidates?: Candidate[]
    visitorCandidates?: Candidate[]
    role?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 })
  }

  const { imageBase64, mediaType, candidates, role } = body
  const visitorCandidates = Array.isArray(body.visitorCandidates) ? body.visitorCandidates : []

  if (!imageBase64 || typeof imageBase64 !== "string") {
    return NextResponse.json({ error: "Envie a imagem da lista." }, { status: 400 })
  }
  if (imageBase64.length > MAX_BASE64_LENGTH) {
    return NextResponse.json({ error: "Imagem grande demais. Tire a foto novamente." }, { status: 413 })
  }
  if (!ACCEPTED_MEDIA_TYPES.includes(mediaType as AcceptedMediaType)) {
    return NextResponse.json({ error: "Formato de imagem não suportado." }, { status: 400 })
  }
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return NextResponse.json({ error: "Nenhum membro para comparar." }, { status: 400 })
  }

  let readEntries
  let provider
  try {
    const result = await readSheetNames(imageBase64, mediaType as AcceptedMediaType)
    readEntries = result.names
    provider = result.provider
  } catch (error) {
    if (error instanceof OcrConfigError) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }
    if (error instanceof OcrRefusalError) {
      return NextResponse.json({ error: error.message }, { status: 422 })
    }
    console.error("Falha ao ler a lista de presença:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível ler a imagem." },
      { status: 502 },
    )
  }

  // Vínculos que o usuário já ensinou neste grupo têm prioridade sobre a
  // semelhança: ele viu a folha e disse de quem é aquele risco.
  const readNames = readEntries.map((n) => n.name)
  const aliasRows = role
    ? await prisma.sheetNameAlias.findMany({
        where: { role, normalized: { in: readNames.map(normalize).filter(Boolean) } },
        select: { normalized: true, memberId: true, visitorId: true },
      })
    : []

  const aliasBy = new Map(aliasRows.map((a) => [a.normalized, a]))
  const memberById = new Map(candidates.map((c) => [c.id, c]))
  const visitorById = new Map(visitorCandidates.map((v) => [v.id, v]))

  const aliasMatches: { readName: string; memberId: number; memberName: string; score: number }[] = []
  const visitorMatches: { readName: string; visitorId: number; visitorName: string }[] = []
  const takenMembers = new Set<number>()
  const takenVisitors = new Set<number>()
  const rest: string[] = []

  for (const readName of readNames) {
    const alias = aliasBy.get(normalize(readName))
    const member = alias?.memberId != null ? memberById.get(alias.memberId) : undefined
    const visitor = alias?.visitorId != null ? visitorById.get(alias.visitorId) : undefined

    // Pessoa ensinada mas que não está nesta lista (saiu da turma, outro grupo)
    // volta para o caminho normal em vez de sumir.
    if (member && !takenMembers.has(member.id)) {
      takenMembers.add(member.id)
      aliasMatches.push({ readName, memberId: member.id, memberName: member.name, score: 1 })
    } else if (visitor && !takenVisitors.has(visitor.id)) {
      takenVisitors.add(visitor.id)
      visitorMatches.push({ readName, visitorId: visitor.id, visitorName: visitor.name })
    } else {
      rest.push(readName)
    }
  }

  const fuzzy = matchNames(
    rest,
    candidates.filter((c) => !takenMembers.has(c.id)),
  )

  const matches = [...aliasMatches, ...fuzzy.matches]
  const unmatched = fuzzy.unmatched

  // Nomes que o próprio modelo marcou como ilegíveis viram aviso, mesmo quando
  // casaram com alguém — quem confere na tela decide.
  const illegible = new Set(
    readEntries.filter((n) => !n.legible).map((n) => n.name.trim()),
  )

  // Só quem administra o grupo pode cadastrar os nomes sem correspondência —
  // a tela esconde essa opção para os demais em vez de deixar dar erro.
  const canCreate = role ? await canManageGroup(role) : false

  const aliased = new Set(aliasMatches.map((m) => m.readName.trim()))

  // Onde cada nome está na foto, para a tela mostrar o pedaço da folha ao lado.
  // Chaveado pelo nome lido, que é o que acompanha match/unmatched.
  const boxes: Record<string, number[]> = {}
  for (const entry of readEntries) {
    const key = entry.name.trim()
    if (entry.box && !boxes[key]) boxes[key] = entry.box
  }

  return NextResponse.json({
    matches: matches.map((m) => ({
      ...m,
      viaAlias: aliased.has(m.readName.trim()),
      // Um nome já ensinado não precisa de conferência, mesmo com letra ruim.
      uncertain: !aliased.has(m.readName.trim()) && illegible.has(m.readName.trim()),
    })),
    visitorMatches,
    unmatched,
    boxes,
    totalRead: readEntries.length,
    provider,
    canCreate,
  })
}
