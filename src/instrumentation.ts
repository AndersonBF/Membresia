// src/instrumentation.ts
// Warm-up do servidor (Next chama register() uma vez no boot). Garante a tabela
// do control-plane e carrega o snapshot de tenants antes de servir requests, para
// que a resolução síncrona por request já encontre os tenants do banco.
//
// Só roda no runtime Node (nunca no Edge) e só faz algo quando o control-plane
// está configurado — sem CONTROL_PLANE_DATABASE_URL, é no-op.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return
  // Não conectar durante o build (next build) — só em runtime.
  if (process.env.NEXT_PHASE === "phase-production-build") return

  const { controlPlaneEnabled, ensureTenantTable } = await import("./lib/controlPlane")
  if (!controlPlaneEnabled()) return

  const { refreshSnapshot } = await import("./lib/tenantRegistry")

  try {
    await ensureTenantTable()
  } catch (e) {
    console.error("[control-plane] ensureTenantTable falhou:", e)
  }
  try {
    await refreshSnapshot()
  } catch (e) {
    console.error("[control-plane] refreshSnapshot falhou:", e)
  }
}
