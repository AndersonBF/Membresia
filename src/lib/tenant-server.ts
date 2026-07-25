// src/lib/tenant-server.ts
// Funções de tenant que dependem de headers() (server-only). Separadas de
// tenant.ts para que o middleware (Edge) não importe next/headers.
import { headers } from "next/headers"
import { getSubdomainFromHost, type Tenant } from "./tenant"
import { resolveDbUrlForHost } from "./tenantRegistry"

/** Subdomínio (igreja) da requisição atual, ou null. */
export function getCurrentSubdomain(): string | null {
  try {
    return getSubdomainFromHost(headers().get("host"))
  } catch {
    return null
  }
}

/**
 * Resolve o tenant da requisição atual → { slug, dbUrl }, usando o registro
 * mesclado (env + control-plane). Continua síncrono (lê o snapshot em memória).
 */
export function resolveTenant(): Tenant {
  try {
    return resolveDbUrlForHost(headers().get("host"))
  } catch {
    return resolveDbUrlForHost(null)
  }
}
