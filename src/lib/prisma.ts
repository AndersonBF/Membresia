import { PrismaClient } from "@prisma/client"
import { resolveTenant } from "./tenant-server"

// ────────────────────────────────────────────────────────────────────────────
// Prisma "host-aware": no modelo híbrido (1 app, 1 banco por igreja), o client
// usado depende do subdomínio da requisição atual. Como o Next 14 tem headers()
// síncrono, resolvemos o banco a cada acesso e devolvemos o client certo.
//
// Um PrismaClient por DATABASE_URL, cacheado em globalThis (sobrevive ao
// hot-reload e evita estourar conexões). Os ~72 arquivos que fazem
// `import prisma from "@/lib/prisma"` continuam inalterados.
// ────────────────────────────────────────────────────────────────────────────

declare const globalThis: {
  __prismaByUrl?: Map<string, PrismaClient>
} & typeof global

const clients: Map<string, PrismaClient> =
  globalThis.__prismaByUrl ?? (globalThis.__prismaByUrl = new Map())

function getClientForUrl(url: string): PrismaClient {
  const key = url || "__default__"
  let client = clients.get(key)
  if (!client) {
    client = url
      ? new PrismaClient({ datasources: { db: { url } } })
      : new PrismaClient() // usa DATABASE_URL do ambiente
    clients.set(key, client)
  }
  return client
}

/** Resolve o PrismaClient da requisição atual (por subdomínio), com fallback. */
function currentClient(): PrismaClient {
  let url = ""
  try {
    url = resolveTenant().dbUrl
  } catch {
    url = process.env.DATABASE_URL ?? ""
  }
  return getClientForUrl(url)
}

// Proxy tipado como PrismaClient: cada acesso (prisma.member, prisma.$transaction…)
// é redirecionado para o client do tenant atual. Funções são bindadas ao client.
const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = currentClient()
    const value = Reflect.get(client as object, prop, receiver)
    return typeof value === "function" ? value.bind(client) : value
  },
}) as PrismaClient

export default prisma
