// src/lib/neon.ts
// Wrapper mínimo da API do Neon para criar o banco de uma igreja nova e obter a
// connection string pronta. SERVER-ONLY.
//
// Config:
//   NEON_API_KEY=...        (obrigatório)
//   NEON_PROJECT_ID=...     (obrigatório)
//   NEON_BRANCH_ID=...      (opcional — senão usa a branch default do projeto)
//   NEON_ROLE=...           (opcional — senão usa o primeiro role da branch)
const NEON_API = "https://console.neon.tech/api/v2"

export function neonEnabled(): boolean {
  return !!process.env.NEON_API_KEY && !!process.env.NEON_PROJECT_ID
}

function cfg() {
  const apiKey = process.env.NEON_API_KEY
  const projectId = process.env.NEON_PROJECT_ID
  if (!apiKey || !projectId) {
    throw new Error("NEON_API_KEY / NEON_PROJECT_ID não configurados")
  }
  return { apiKey, projectId }
}

async function neon(path: string, init?: RequestInit): Promise<any> {
  const { apiKey } = cfg()
  const res = await fetch(`${NEON_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Neon API ${res.status} em ${path}: ${body.slice(0, 300)}`)
  }
  return res.json()
}

async function getBranchId(projectId: string): Promise<string> {
  if (process.env.NEON_BRANCH_ID) return process.env.NEON_BRANCH_ID
  const data = await neon(`/projects/${projectId}/branches`)
  const branches: any[] = data.branches ?? []
  const def = branches.find((b) => b.default) ?? branches.find((b) => b.primary) ?? branches[0]
  if (!def?.id) throw new Error("Nenhuma branch encontrada no projeto Neon")
  return def.id
}

async function getRoleName(projectId: string, branchId: string): Promise<string> {
  if (process.env.NEON_ROLE) return process.env.NEON_ROLE
  const data = await neon(`/projects/${projectId}/branches/${branchId}/roles`)
  const roles: any[] = data.roles ?? []
  if (!roles.length) throw new Error("Nenhum role encontrado na branch Neon")
  return roles[0].name
}

export type NeonDatabase = { dbUrl: string; rawUrl: string; dbName: string; branchId: string }

/**
 * Cria um banco novo no projeto Neon para o slug informado e devolve a connection
 * string (direta, boa para Prisma). dbName = church_<slug com _ no lugar de ->.
 */
export async function createNeonDatabase(slug: string): Promise<NeonDatabase> {
  const { projectId } = cfg()
  const branchId = await getBranchId(projectId)
  const roleName = await getRoleName(projectId, branchId)
  const dbName = `church_${slug.replace(/-/g, "_")}`

  // Cria o banco. Tolera "já existe" para permitir retry de um provisionamento
  // que falhou depois de criar o banco mas antes de aplicar o schema.
  try {
    await neon(`/projects/${projectId}/branches/${branchId}/databases`, {
      method: "POST",
      body: JSON.stringify({ database: { name: dbName, owner_name: roleName } }),
    })
  } catch (e: any) {
    if (!/already exists|409/i.test(String(e?.message))) throw e
  }

  // Conexão POOLED (endpoint "-pooler"): recomendada para serverless (Vercel).
  // O pooler acorda o compute suspenso e é tolerante a cold start — a conexão
  // direta (5432) falha nesse cenário. O Prisma exige pgbouncer=true no pooler.
  const params = new URLSearchParams({
    branch_id: branchId,
    database_name: dbName,
    role_name: roleName,
    pooled: "true",
  })
  const conn = await neon(`/projects/${projectId}/connection_uri?${params.toString()}`)
  if (!conn?.uri) throw new Error("Neon não retornou connection_uri")

  // pool_timeout/connect_timeout altos: o compute pode estar suspenso e leva alguns
  // segundos para acordar no primeiro acesso. connection_limit=1 é o padrão
  // recomendado para serverless + PgBouncer.
  const extra = "pgbouncer=true&connect_timeout=30&pool_timeout=30&connection_limit=1"
  const dbUrl = conn.uri.includes("?") ? `${conn.uri}&${extra}` : `${conn.uri}?sslmode=require&${extra}`

  // rawUrl = string sem os parâmetros do Prisma, usada pelo driver serverless do
  // Neon para aplicar o schema em um único round-trip. dbUrl = versão p/ Prisma.
  return { dbUrl, rawUrl: conn.uri, dbName, branchId }
}

/** Apaga o banco de uma igreja no Neon. Tolera "não existe" (já apagado). */
export async function deleteNeonDatabase(slug: string): Promise<void> {
  const { projectId } = cfg()
  const branchId = await getBranchId(projectId)
  const dbName = `church_${slug.replace(/-/g, "_")}`
  try {
    await neon(`/projects/${projectId}/branches/${branchId}/databases/${encodeURIComponent(dbName)}`, {
      method: "DELETE",
    })
  } catch (e: any) {
    if (!/404|not found|does not exist/i.test(String(e?.message))) throw e
  }
}
