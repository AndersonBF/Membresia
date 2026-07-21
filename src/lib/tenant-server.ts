// src/lib/tenant-server.ts
// Funções de tenant que dependem de headers() (server-only). Separadas de
// tenant.ts para que o middleware (Edge) não importe next/headers.
import { headers } from "next/headers"
import { getSubdomainFromHost, resolveTenantFromHost, type Tenant } from "./tenant"

/** Subdomínio (igreja) da requisição atual, ou null. */
export function getCurrentSubdomain(): string | null {
  try {
    return getSubdomainFromHost(headers().get("host"))
  } catch {
    return null
  }
}

/** Resolve o tenant da requisição atual → { slug, dbUrl }. */
export function resolveTenant(): Tenant {
  try {
    return resolveTenantFromHost(headers().get("host"))
  } catch {
    return resolveTenantFromHost(null)
  }
}
