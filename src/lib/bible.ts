// src/lib/bible.ts
// Utilidades de Bíblia: livros, interpretação de referências e versões disponíveis.
// Arquivo PURO (sem I/O) — usado pela API e pela interface.

export type BibleBook = { id: number; name: string; aliases: string[] }

/** 66 livros com abreviações comuns em português. */
export const BOOKS: BibleBook[] = [
  { id: 1,  name: "Gênesis",            aliases: ["gn", "gen"] },
  { id: 2,  name: "Êxodo",              aliases: ["ex", "exo"] },
  { id: 3,  name: "Levítico",           aliases: ["lv", "lev"] },
  { id: 4,  name: "Números",            aliases: ["nm", "num"] },
  { id: 5,  name: "Deuteronômio",       aliases: ["dt", "deu"] },
  { id: 6,  name: "Josué",              aliases: ["js", "jos"] },
  { id: 7,  name: "Juízes",             aliases: ["jz", "jui"] },
  { id: 8,  name: "Rute",               aliases: ["rt", "rut"] },
  { id: 9,  name: "1 Samuel",           aliases: ["1sm", "1sa", "1s"] },
  { id: 10, name: "2 Samuel",           aliases: ["2sm", "2sa", "2s"] },
  { id: 11, name: "1 Reis",             aliases: ["1rs", "1re", "1r"] },
  { id: 12, name: "2 Reis",             aliases: ["2rs", "2re", "2r"] },
  { id: 13, name: "1 Crônicas",         aliases: ["1cr", "1cro"] },
  { id: 14, name: "2 Crônicas",         aliases: ["2cr", "2cro"] },
  { id: 15, name: "Esdras",             aliases: ["ed", "esd"] },
  { id: 16, name: "Neemias",            aliases: ["ne", "nee"] },
  { id: 17, name: "Ester",              aliases: ["et", "est"] },
  { id: 18, name: "Jó",                 aliases: ["job"] },
  { id: 19, name: "Salmos",             aliases: ["sl", "sal", "salmo", "ps"] },
  { id: 20, name: "Provérbios",         aliases: ["pv", "pr", "prov"] },
  { id: 21, name: "Eclesiastes",        aliases: ["ec", "ecl"] },
  { id: 22, name: "Cânticos",           aliases: ["ct", "cant", "cantares"] },
  { id: 23, name: "Isaías",             aliases: ["is", "isa"] },
  { id: 24, name: "Jeremias",           aliases: ["jr", "jer"] },
  { id: 25, name: "Lamentações",        aliases: ["lm", "lam"] },
  { id: 26, name: "Ezequiel",           aliases: ["ez", "eze"] },
  { id: 27, name: "Daniel",             aliases: ["dn", "dan"] },
  { id: 28, name: "Oseias",             aliases: ["os", "ose"] },
  { id: 29, name: "Joel",               aliases: ["jl", "joe"] },
  { id: 30, name: "Amós",               aliases: ["am", "amo"] },
  { id: 31, name: "Obadias",            aliases: ["ob", "oba"] },
  { id: 32, name: "Jonas",              aliases: ["jn", "jon"] },
  { id: 33, name: "Miqueias",           aliases: ["mq", "miq"] },
  { id: 34, name: "Naum",               aliases: ["na", "nau"] },
  { id: 35, name: "Habacuque",          aliases: ["hc", "hab"] },
  { id: 36, name: "Sofonias",           aliases: ["sf", "sof"] },
  { id: 37, name: "Ageu",               aliases: ["ag", "age"] },
  { id: 38, name: "Zacarias",           aliases: ["zc", "zac"] },
  { id: 39, name: "Malaquias",          aliases: ["ml", "mal"] },
  { id: 40, name: "Mateus",             aliases: ["mt", "mat"] },
  { id: 41, name: "Marcos",             aliases: ["mc", "mar"] },
  { id: 42, name: "Lucas",              aliases: ["lc", "luc"] },
  { id: 43, name: "João",               aliases: ["jo", "joao"] },
  { id: 44, name: "Atos",               aliases: ["at", "ato"] },
  { id: 45, name: "Romanos",            aliases: ["rm", "rom"] },
  { id: 46, name: "1 Coríntios",        aliases: ["1co", "1cor"] },
  { id: 47, name: "2 Coríntios",        aliases: ["2co", "2cor"] },
  { id: 48, name: "Gálatas",            aliases: ["gl", "gal"] },
  { id: 49, name: "Efésios",            aliases: ["ef", "efe"] },
  { id: 50, name: "Filipenses",         aliases: ["fp", "fil"] },
  { id: 51, name: "Colossenses",        aliases: ["cl", "col"] },
  { id: 52, name: "1 Tessalonicenses",  aliases: ["1ts", "1te", "1tes"] },
  { id: 53, name: "2 Tessalonicenses",  aliases: ["2ts", "2te", "2tes"] },
  { id: 54, name: "1 Timóteo",          aliases: ["1tm", "1ti"] },
  { id: 55, name: "2 Timóteo",          aliases: ["2tm", "2ti"] },
  { id: 56, name: "Tito",               aliases: ["tt", "tit"] },
  { id: 57, name: "Filemom",            aliases: ["fm", "flm"] },
  { id: 58, name: "Hebreus",            aliases: ["hb", "heb"] },
  { id: 59, name: "Tiago",              aliases: ["tg", "tia"] },
  { id: 60, name: "1 Pedro",            aliases: ["1pe", "1pd"] },
  { id: 61, name: "2 Pedro",            aliases: ["2pe", "2pd"] },
  { id: 62, name: "1 João",             aliases: ["1jo", "1joao"] },
  { id: 63, name: "2 João",             aliases: ["2jo", "2joao"] },
  { id: 64, name: "3 João",             aliases: ["3jo", "3joao"] },
  { id: 65, name: "Judas",              aliases: ["jd", "jud"] },
  { id: 66, name: "Apocalipse",         aliases: ["ap", "apo", "apc"] },
]

/** minúsculas, sem acento, sem espaços/pontos — para casar nomes e abreviações. */
export function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[.\s]/g, "")
    .trim()
}

const INDEX: Record<string, BibleBook> = (() => {
  const map: Record<string, BibleBook> = {}
  for (const b of BOOKS) {
    map[normalize(b.name)] = b
    for (const a of b.aliases) map[normalize(a)] = b
  }
  return map
})()

export function findBook(input: string): BibleBook | null {
  return INDEX[normalize(input)] ?? null
}

export type ParsedRef = {
  book: BibleBook
  chapter: number
  from: number | null
  to: number | null
  label: string
}

/** Interpreta "Hb 13:8", "1 Coríntios 13:4-7", "Salmos 23". */
export function parseRef(input: string): ParsedRef | null {
  if (!input?.trim()) return null
  const m = input.trim().match(/^(\d?\s*[^\d]+?)\s*(\d+)(?:\s*[:.]\s*(\d+)(?:\s*-\s*(\d+))?)?$/)
  if (!m) return null

  const book = findBook(m[1])
  if (!book) return null

  const chapter = Number(m[2])
  const from = m[3] ? Number(m[3]) : null
  const to = m[4] ? Number(m[4]) : from

  if (!chapter || chapter < 1) return null

  const label = from
    ? `${book.name} ${chapter}:${from}${to && to !== from ? `-${to}` : ""}`
    : `${book.name} ${chapter}`

  return { book, chapter, from, to, label }
}

/** Versões disponíveis. `livre` = domínio público / uso liberado. */
export const BIBLE_VERSIONS = [
  { id: "almeida", label: "Almeida (domínio público)",        provider: "bible-api", livre: true  },
  { id: "ARA",     label: "Almeida Revista e Atualizada",     provider: "bolls",     livre: false },
  { id: "NVIPT",   label: "Nova Versão Internacional",        provider: "bolls",     livre: false },
  { id: "NTLH",    label: "Nova Trad. na Linguagem de Hoje",  provider: "bolls",     livre: false },
  { id: "kjv",     label: "King James (inglês)",              provider: "bible-api", livre: true  },
] as const

export type VersionId = (typeof BIBLE_VERSIONS)[number]["id"]

export function getVersion(id: string) {
  return BIBLE_VERSIONS.find((v) => v.id === id) ?? BIBLE_VERSIONS[0]
}
