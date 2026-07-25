// src/lib/tenantRegistry.ts
// Registro híbrido de tenants (env + control-plane), com um SNAPSHOT em memória
// para que a resolução por request continue SÍNCRONA — requisito do Proxy de
// prisma.ts, que resolve o banco a cada acesso.
//
// SERVER-ONLY (Node). Importa controlPlane.ts (PrismaClient). Não use no Edge.
//
// Fluxo:
//  - warm-up (instrumentation.ts) chama refreshSnapshot() no boot;
//  - cada resolução dispara refreshIfStale() (fire-and-forget, nunca bloqueia);
//  - a Fase B chama primeSnapshot() ao criar uma igreja, para valer na hora.
import {
  getSubdomainFromHost,
  getTenantRegistry as getEnvRegistry,
  getDemoTenants,
  type Tenant,
} from "./tenant"
import { controlPlaneEnabled, getActiveRegistryDB } from "./controlPlane"

let snapshot: Record<string, string> = {}
let loadedAt = 0
const TTL_MS = 60_000

/** Recarrega o snapshot a partir do control-plane. */
export async function refreshSnapshot(): Promise<void> {
  if (!controlPlaneEnabled()) return
  try {
    snapshot = await getActiveRegistryDB()
    loadedAt = Date.now()
  } catch {
    // Mantém o último snapshot válido em caso de falha momentânea do control-plane.
  }
}

/** Dispara um refresh assíncrono se o snapshot estiver velho. Não bloqueia. */
export function refreshIfStale(): void {
  if (!controlPlaneEnabled()) return
  if (Date.now() - loadedAt > TTL_MS) void refreshSnapshot()
}

/** Adiciona/atualiza um tenant no snapshot da instância atual imediatamente. */
export function primeSnapshot(slug: string, dbUrl: string): void {
  snapshot = { ...snapshot, [slug.toLowerCase()]: dbUrl }
}

/** Remove um tenant do snapshot da instância atual imediatamente. */
export function removeFromSnapshot(slug: string): void {
  const next = { ...snapshot }
  delete next[slug.toLowerCase()]
  snapshot = next
}

/** Registro mesclado (env como base, control-plane sobrepõe). Síncrono. */
export function getMergedRegistry(): Record<string, string> {
  return { ...getEnvRegistry(), ...snapshot }
}

/**
 * Resolve o tenant da request (host) usando o registro mesclado. Síncrono.
 * Ordem: subdomínio conhecido → DEFAULT_TENANT → DATABASE_URL (fallback).
 */
export function resolveDbUrlForHost(host: string | null | undefined): Tenant {
  refreshIfStale()
  const reg = getMergedRegistry()
  const sub = getSubdomainFromHost(host)

  if (sub && reg[sub]) return { slug: sub, dbUrl: reg[sub] }

  const def = (process.env.DEFAULT_TENANT ?? "").toLowerCase()
  if (def && reg[def]) return { slug: def, dbUrl: reg[def] }

  return { slug: def || sub || "default", dbUrl: process.env.DATABASE_URL ?? "" }
}

/**
 * Decide, no lado Node, se um host de subdomínio desconhecido deve ver a página
 * "em breve". Só age quando o control-plane está ativo — em modo puro-env o
 * middleware (Edge) continua cuidando disso.
 */
export function shouldShowComingSoon(host: string | null | undefined): boolean {
  if (!controlPlaneEnabled()) return false
  refreshIfStale()
  const sub = getSubdomainFromHost(host)
  if (!sub) return false
  if (getMergedRegistry()[sub]) return false
  if (getDemoTenants().includes(sub)) return false
  if (sub === (process.env.DEFAULT_TENANT ?? "").toLowerCase()) return false
  return true
}
