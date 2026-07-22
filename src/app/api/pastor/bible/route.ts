// src/app/api/pastor/bible/route.ts
// Consulta de passagens bíblicas em várias versões.
// GET ?ref=Hebreus 13:8&version=ARA        → uma versão
// GET ?ref=Hebreus 13:8&compare=1          → todas as versões em português
import { currentUser } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { parseRef, getVersion, BIBLE_VERSIONS, normalize } from "@/lib/bible"

type Verse = { verse: number; text: string }

const CACHE = { next: { revalidate: 60 * 60 * 24 * 30 } } // 30 dias — o texto não muda

/** bolls.life: capítulo inteiro, filtrado pelo intervalo pedido. */
async function fromBolls(version: string, bookId: number, chapter: number, from: number | null, to: number | null): Promise<Verse[]> {
  const res = await fetch(`https://bolls.life/get-text/${version}/${bookId}/${chapter}/`, CACHE)
  if (!res.ok) throw new Error("bolls indisponível")
  const data = (await res.json()) as { verse: number; text: string }[]
  const clean = (t: string) => t.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()
  return data
    .filter((v) => (from == null ? true : v.verse >= from && v.verse <= (to ?? from)))
    .map((v) => ({ verse: v.verse, text: clean(v.text) }))
}

/** bible-api.com: aceita nome em português sem acento. */
async function fromBibleApi(version: string, bookName: string, chapter: number, from: number | null, to: number | null): Promise<Verse[]> {
  const nome = bookName.normalize("NFD").replace(/[̀-ͯ]/g, "")
  const ref = from ? `${nome} ${chapter}:${from}${to && to !== from ? `-${to}` : ""}` : `${nome} ${chapter}`
  const res = await fetch(`https://bible-api.com/${encodeURIComponent(ref)}?translation=${version}`, CACHE)
  if (!res.ok) throw new Error("bible-api indisponível")
  const data = await res.json()
  if (!data?.verses) throw new Error("passagem não encontrada")
  return (data.verses as any[]).map((v) => ({ verse: v.verse, text: String(v.text).replace(/\s+/g, " ").trim() }))
}

async function buscar(
  versionId: string,
  parsed: NonNullable<ReturnType<typeof parseRef>>,
  full: boolean
): Promise<Verse[]> {
  const v = getVersion(versionId)
  // `full` ignora o intervalo e traz o capítulo inteiro (contexto da passagem).
  const from = full ? null : parsed.from
  const to = full ? null : parsed.to
  return v.provider === "bolls"
    ? fromBolls(v.id, parsed.book.id, parsed.chapter, from, to)
    : fromBibleApi(v.id, parsed.book.name, parsed.chapter, from, to)
}

export async function GET(req: NextRequest) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const roles = (user.publicMetadata?.roles as string[]) ?? []
  if (!roles.includes("pastor") && !roles.includes("superadmin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const ref = req.nextUrl.searchParams.get("ref") ?? ""
  const parsed = parseRef(ref)
  if (!parsed) {
    return NextResponse.json({ error: "Referência não reconhecida. Ex.: Hebreus 13:8" }, { status: 400 })
  }

  const compare = req.nextUrl.searchParams.get("compare") === "1"
  const full = req.nextUrl.searchParams.get("full") === "1" || parsed.from == null
  const versionId = req.nextUrl.searchParams.get("version") ?? "almeida"

  // Informações para a interface destacar o trecho e navegar entre capítulos
  const meta = {
    reference: parsed.label,
    book: { id: parsed.book.id, name: parsed.book.name },
    chapter: parsed.chapter,
    from: parsed.from,
    to: parsed.to,
    full,
  }

  try {
    if (compare) {
      const pt = BIBLE_VERSIONS.filter((v) => v.id !== "kjv")
      const results = await Promise.all(
        pt.map(async (v) => {
          try {
            return { version: v.id, label: v.label, livre: v.livre, verses: await buscar(v.id, parsed, full) }
          } catch {
            return { version: v.id, label: v.label, livre: v.livre, verses: [], erro: true }
          }
        })
      )
      return NextResponse.json({ ...meta, results })
    }

    const verses = await buscar(versionId, parsed, full)
    const v = getVersion(versionId)
    return NextResponse.json({
      ...meta,
      results: [{ version: v.id, label: v.label, livre: v.livre, verses }],
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Erro ao buscar a passagem" }, { status: 502 })
  }
}
