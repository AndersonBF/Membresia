// src/lib/controlPlane.ts
// "Control-plane": banco central (dedicado) que guarda o registro de igrejas
// (tenants). Substitui/complementa as envs TENANT_DB__* — assim dá para adicionar
// uma igreja em runtime, sem redeploy.
//
// SERVER-ONLY (Node). NUNCA importe este arquivo no middleware (Edge): ele usa
// PrismaClient. O middleware continua com o registro em env (puro), via tenant.ts.
//
// Config: CONTROL_PLANE_DATABASE_URL=postgresql://...  (banco só do registro)
//
// Tabela criada de forma idempotente por ensureTenantTable() no warm-up
// (src/instrumentation.ts) — não precisa de migration nem de um segundo schema.
import { PrismaClient } from "@prisma/client"

const CP_URL = process.env.CONTROL_PLANE_DATABASE_URL ?? ""

declare const globalThis: {
  __cpClient?: PrismaClient
} & typeof global

function cp(): PrismaClient | null {
  if (!CP_URL) return null
  if (!globalThis.__cpClient) {
    globalThis.__cpClient = new PrismaClient({ datasources: { db: { url: CP_URL } } })
  }
  return globalThis.__cpClient
}

/** true quando o control-plane está configurado (env presente). */
export function controlPlaneEnabled(): boolean {
  return !!CP_URL
}

export type TenantRow = {
  slug: string
  name: string
  dbUrl: string
  status: string // "provisioning" | "active" | "suspended"
}

/** Cria a tabela Tenant se ainda não existir. Idempotente. */
export async function ensureTenantTable(): Promise<void> {
  const c = cp()
  if (!c) return
  await c.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Tenant" (
      slug         TEXT PRIMARY KEY,
      name         TEXT NOT NULL,
      db_url       TEXT NOT NULL,
      status       TEXT NOT NULL DEFAULT 'active',
      neon_project TEXT,
      neon_db_name TEXT,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `)
}

/** Lista todas as igrejas do control-plane (mais recentes primeiro). */
export async function listTenantsDB(): Promise<TenantRow[]> {
  const c = cp()
  if (!c) return []
  const rows = await c.$queryRawUnsafe<any[]>(
    `SELECT slug, name, db_url, status FROM "Tenant" ORDER BY created_at DESC`,
  )
  return rows.map((r) => ({ slug: r.slug, name: r.name, dbUrl: r.db_url, status: r.status }))
}

/** Mapa slug → dbUrl apenas dos tenants ATIVOS (usado na resolução por request). */
export async function getActiveRegistryDB(): Promise<Record<string, string>> {
  const reg: Record<string, string> = {}
  for (const r of await listTenantsDB()) {
    if (r.status === "active" && r.dbUrl) reg[r.slug.toLowerCase()] = r.dbUrl
  }
  return reg
}

/** Insere/atualiza uma igreja. (Usado pela Fase B — provisionamento pelo painel.) */
export async function upsertTenant(t: {
  slug: string
  name: string
  dbUrl: string
  status?: string
  neonProject?: string | null
  neonDbName?: string | null
}): Promise<void> {
  const c = cp()
  if (!c) throw new Error("CONTROL_PLANE_DATABASE_URL não configurado")
  await c.$executeRawUnsafe(
    `INSERT INTO "Tenant" (slug, name, db_url, status, neon_project, neon_db_name)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (slug) DO UPDATE SET
       name = EXCLUDED.name,
       db_url = EXCLUDED.db_url,
       status = EXCLUDED.status,
       neon_project = EXCLUDED.neon_project,
       neon_db_name = EXCLUDED.neon_db_name`,
    t.slug.toLowerCase(),
    t.name,
    t.dbUrl,
    t.status ?? "active",
    t.neonProject ?? null,
    t.neonDbName ?? null,
  )
}

/** Muda o status de uma igreja (provisioning/active/suspended). */
export async function setTenantStatus(slug: string, status: string): Promise<void> {
  const c = cp()
  if (!c) throw new Error("CONTROL_PLANE_DATABASE_URL não configurado")
  await c.$executeRawUnsafe(`UPDATE "Tenant" SET status = $2 WHERE slug = $1`, slug.toLowerCase(), status)
}

/** Remove uma igreja do control-plane. */
export async function deleteTenant(slug: string): Promise<void> {
  const c = cp()
  if (!c) throw new Error("CONTROL_PLANE_DATABASE_URL não configurado")
  await c.$executeRawUnsafe(`DELETE FROM "Tenant" WHERE slug = $1`, slug.toLowerCase())
}
