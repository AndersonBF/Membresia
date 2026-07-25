// scripts/migrate-tenants.mjs
// Sincroniza o schema (prisma db push) em TODOS os bancos de igreja:
//   - DATABASE_URL (igreja principal)
//   - TENANT_DB__* (env)
//   - tenants ATIVOS do control-plane (tabela Tenant em CONTROL_PLANE_DATABASE_URL)
//
// Usa `db push` (não `migrate deploy`) e é NÃO destrutivo (sem --accept-data-loss):
// só aplica mudanças aditivas. Uso: npm run migrate:tenants
// Ver memórias membresia-db-safety / membresia-provisionamento.
import "dotenv/config"
import { execSync } from "node:child_process"
import { PrismaClient } from "@prisma/client"

// Mapa url → label (dedup por URL: a principal costuma repetir em TENANT_DB__*).
const byUrl = new Map()
const add = (label, url) => {
  if (url && !byUrl.has(url)) byUrl.set(url, label)
}

if (process.env.DATABASE_URL) add("principal (DATABASE_URL)", process.env.DATABASE_URL)
for (const [k, v] of Object.entries(process.env)) {
  if (k.startsWith("TENANT_DB__") && v) add(k.slice("TENANT_DB__".length), v)
}

const cpUrl = process.env.CONTROL_PLANE_DATABASE_URL
if (cpUrl) {
  const cp = new PrismaClient({ datasources: { db: { url: cpUrl } } })
  try {
    const rows = await cp.$queryRawUnsafe(`SELECT slug, db_url FROM "Tenant" WHERE status = 'active'`)
    for (const r of rows) add(`cp:${r.slug}`, r.db_url)
  } catch (e) {
    console.error("⚠️  Falha ao ler control-plane:", e.message)
  } finally {
    await cp.$disconnect()
  }
}

if (byUrl.size === 0) {
  console.log("Nenhum banco alvo (defina DATABASE_URL / TENANT_DB__* / CONTROL_PLANE_DATABASE_URL).")
  process.exit(0)
}

let fail = 0
for (const [url, label] of byUrl) {
  console.log(`\n▶  db push → ${label}`)
  try {
    execSync("npx prisma db push --skip-generate", {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: url },
    })
  } catch (e) {
    fail++
    console.error(`❌ Falha em ${label}:`, e.message)
  }
}

console.log(fail === 0 ? "\n✅ Todos os bancos sincronizados." : `\n⚠️  Concluído com ${fail} falha(s).`)
process.exit(fail === 0 ? 0 : 1)
