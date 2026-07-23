// src/lib/nameMatch.ts
//
// Casa nomes lidos de uma lista de presença manuscrita com os membros
// cadastrados. A letra da folha raramente bate exatamente com o cadastro:
// falta sobrenome, sobra apelido, acento some, letra sai trocada. Por isso o
// casamento é feito em camadas, da mais segura para a mais tolerante.

export type Candidate = { id: number; name: string }

export type Match = {
  /** Nome como foi lido na folha */
  readName: string
  memberId: number
  memberName: string
  /** 0..1 — quanto o nome lido se parece com o cadastrado */
  score: number
}

/** Minúsculas, sem acento, sem pontuação, espaços colapsados. */
export function normalize(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

// Partículas que não ajudam a identificar ninguém.
const STOPWORDS = new Set(["de", "da", "do", "das", "dos", "e", "di", "del"])

function tokens(name: string): string[] {
  return normalize(name)
    .split(" ")
    .filter((t) => t.length > 1 && !STOPWORDS.has(t))
}

/** Distância de Levenshtein (iterativa, duas linhas). */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  let curr = new Array<number>(b.length + 1)

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost)
    }
    const tmp = prev
    prev = curr
    curr = tmp
  }
  return prev[b.length]
}

/** Similaridade 0..1 entre duas strings. */
function similarity(a: string, b: string): number {
  const longest = Math.max(a.length, b.length)
  if (longest === 0) return 1
  return 1 - levenshtein(a, b) / longest
}

/**
 * Pontua o quanto `read` (nome da folha) corresponde a `candidate` (cadastro).
 * Retorna 0 quando não há semelhança suficiente para arriscar.
 */
function scorePair(read: string, candidate: string): number {
  const nRead = normalize(read)
  const nCand = normalize(candidate)
  if (!nRead || !nCand) return 0

  // 1. Nome completo idêntico.
  if (nRead === nCand) return 1

  const tRead = tokens(read)
  const tCand = tokens(candidate)
  if (tRead.length === 0 || tCand.length === 0) return 0

  // 2. Todos os tokens lidos aparecem no cadastro (ou vice-versa) — o caso de
  //    "Mateus Biazin" para "Mateus Biazin Fernandes".
  const contains = (a: string[], b: string[]) =>
    a.every((t) => b.some((o) => o === t || (t.length >= 4 && similarity(t, o) >= 0.85)))

  if (contains(tRead, tCand) || contains(tCand, tRead)) {
    const shared = Math.min(tRead.length, tCand.length)
    // Um único token em comum é fraco demais (só "Ana", só "Silva").
    return shared >= 2 ? 0.92 : 0.6
  }

  // 3. Primeiro + último token batem — cobre nome do meio abreviado.
  const firstOk = similarity(tRead[0], tCand[0]) >= 0.85
  const lastOk =
    similarity(tRead[tRead.length - 1], tCand[tCand.length - 1]) >= 0.85
  if (firstOk && lastOk && (tRead.length > 1 || tCand.length > 1)) return 0.88

  // 4. Última tentativa: semelhança bruta do nome inteiro, para letra ruim.
  const raw = similarity(nRead, nCand)
  return raw >= 0.82 ? raw : 0
}

/** Abaixo disso não marcamos ninguém automaticamente. */
export const MATCH_THRESHOLD = 0.8

/**
 * Casa a lista de nomes lidos com os candidatos. Cada membro é usado no
 * máximo uma vez — dois riscos parecidos na folha não marcam a mesma pessoa
 * duas vezes; o segundo cai em `unmatched` para conferência manual.
 */
export function matchNames(
  readNames: string[],
  candidates: Candidate[],
): { matches: Match[]; unmatched: string[] } {
  const matches: Match[] = []
  const unmatched: string[] = []
  const taken = new Set<number>()

  // Avalia todos os pares primeiro para que os casamentos mais confiantes
  // reservem seus membros antes dos duvidosos.
  const pairs: (Match & { readIndex: number })[] = []
  readNames.forEach((readName, readIndex) => {
    for (const candidate of candidates) {
      const score = scorePair(readName, candidate.name)
      if (score >= MATCH_THRESHOLD) {
        pairs.push({ readName, readIndex, memberId: candidate.id, memberName: candidate.name, score })
      }
    }
  })
  pairs.sort((a, b) => b.score - a.score)

  const usedRead = new Set<number>()
  for (const pair of pairs) {
    if (taken.has(pair.memberId) || usedRead.has(pair.readIndex)) continue
    taken.add(pair.memberId)
    usedRead.add(pair.readIndex)
    matches.push({
      readName: pair.readName,
      memberId: pair.memberId,
      memberName: pair.memberName,
      score: pair.score,
    })
  }

  readNames.forEach((readName, i) => {
    if (!usedRead.has(i) && readName.trim()) unmatched.push(readName.trim())
  })

  return { matches, unmatched }
}
