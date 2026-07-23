// src/app/api/attendance/scan/route.ts
//
// Lê uma foto da lista de presença em papel e devolve os nomes reconhecidos,
// já casados com os membros da turma/evento. Quem confirma é sempre o usuário
// na tela — esta rota não grava presença nenhuma.

import { NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { canManageGroup } from "@/lib/permissions"
import { matchNames, type Candidate } from "@/lib/nameMatch"
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

  let body: { imageBase64?: string; mediaType?: string; candidates?: Candidate[]; role?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 })
  }

  const { imageBase64, mediaType, candidates, role } = body

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

  const { matches, unmatched } = matchNames(
    readEntries.map((n) => n.name),
    candidates,
  )

  // Nomes que o próprio modelo marcou como ilegíveis viram aviso, mesmo quando
  // casaram com alguém — quem confere na tela decide.
  const illegible = new Set(
    readEntries.filter((n) => !n.legible).map((n) => n.name.trim()),
  )

  // Só quem administra o grupo pode cadastrar os nomes sem correspondência —
  // a tela esconde essa opção para os demais em vez de deixar dar erro.
  const canCreate = role ? await canManageGroup(role) : false

  return NextResponse.json({
    matches: matches.map((m) => ({ ...m, uncertain: illegible.has(m.readName.trim()) })),
    unmatched,
    totalRead: readEntries.length,
    provider,
    canCreate,
  })
}
