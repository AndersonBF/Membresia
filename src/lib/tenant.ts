// src/lib/tenant.ts
// Registro de "tenants" (igrejas) para o modelo híbrido: 1 app, 1 banco por
// subdomínio. Cada igreja tem um slug (= subdomínio) e um DATABASE_URL próprio.
//
// Configuração por variáveis de ambiente:
//   TENANT_BASE_DOMAIN=membrese.com          (domínio base — extrai o subdomínio)
//   DEFAULT_TENANT=ipbtoledo                 (usado quando não há subdomínio: localhost/base)
//   DEMO_TENANTS=igreja                      (subdomínios de demonstração, separados por vírgula)
//   TENANT_DB__ipbtoledo=postgresql://...    (banco da igreja "ipbtoledo")
//   TENANT_DB__igreja=postgresql://...       (banco do demo "igreja")
//
// Adicionar uma igreja nova = adicionar uma TENANT_DB__<slug> e reiniciar.
//
// IMPORTANTE: este arquivo é PURO (sem next/headers) para poder ser importado
// pelo middleware (Edge). As funções que dependem de headers() ficam em
// `tenant-server.ts`.

export type Tenant = { slug: string; dbUrl: string }

const ENV_PREFIX = "TENANT_DB__"

/** Mapa slug → DATABASE_URL, lido das variáveis TENANT_DB__*. */
export function getTenantRegistry(): Record<string, string> {
  const reg: Record<string, string> = {}
  for (const [key, val] of Object.entries(process.env)) {
    if (key.startsWith(ENV_PREFIX) && val) {
      reg[key.slice(ENV_PREFIX.length).toLowerCase()] = val
    }
  }
  return reg
}

export function listTenants(): string[] {
  return Object.keys(getTenantRegistry())
}

export function isKnownTenant(slug: string | null | undefined): boolean {
  if (!slug) return false
  return slug.toLowerCase() in getTenantRegistry()
}

export function getDemoTenants(): string[] {
  return (process.env.DEMO_TENANTS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

/**
 * Extrai o subdomínio do host. Retorna null quando é localhost, IP, o próprio
 * domínio base, ou "www".
 */
export function getSubdomainFromHost(host: string | null | undefined): string | null {
  if (!host) return null
  const hostname = host.split(":")[0].toLowerCase().trim() // remove porta
  if (!hostname || hostname === "localhost") return null
  // Suporte a subdomínios locais para teste: igreja.localhost, ipbtoledo.localhost
  if (hostname.endsWith(".localhost")) {
    const sub = hostname.slice(0, -".localhost".length).split(".")[0]
    return sub && sub !== "www" ? sub : null
  }
  // IP puro (v4) → sem subdomínio
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return null

  const base = (process.env.TENANT_BASE_DOMAIN ?? "").toLowerCase().trim()
  if (base && (hostname === base || hostname === `www.${base}`)) return null

  if (base && hostname.endsWith(`.${base}`)) {
    const sub = hostname.slice(0, -(base.length + 1)) // remove ".base"
    const first = sub.split(".")[0]
    return first && first !== "www" ? first : null
  }

  // Sem TENANT_BASE_DOMAIN definido: tenta o primeiro rótulo se houver 3+ partes.
  const parts = hostname.split(".")
  if (parts.length >= 3 && parts[0] !== "www") return parts[0]
  return null
}

/**
 * Resolve o tenant a partir de um host (função PURA).
 * Ordem: subdomínio conhecido → DEFAULT_TENANT → process.env.DATABASE_URL (fallback).
 */
export function resolveTenantFromHost(host: string | null | undefined): Tenant {
  const reg = getTenantRegistry()
  const sub = getSubdomainFromHost(host)

  if (sub && reg[sub]) return { slug: sub, dbUrl: reg[sub] }

  const def = (process.env.DEFAULT_TENANT ?? "").toLowerCase()
  if (def && reg[def]) return { slug: def, dbUrl: reg[def] }

  // Fallback: mantém o comportamento single-tenant atual (dev/local ou sem env).
  return { slug: def || sub || "default", dbUrl: process.env.DATABASE_URL ?? "" }
}
