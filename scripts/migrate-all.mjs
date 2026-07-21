// scripts/migrate-all.mjs
// Sincroniza o schema (prisma db push) em TODOS os bancos configurados (TENANT_DB__*).
// Usa `db push` (não `migrate deploy`) porque o histórico de migrations do projeto
// não é replayable do zero — db push cria/atualiza o schema direto do schema.prisma.
// É não destrutivo (sem --accept-data-loss). Uso: npm run migrate:all
import "dotenv/config"
import { execSync } from "node:child_process"

const PREFIX = "TENANT_DB__"
const entries = Object.entries(process.env).filter(([k, v]) => k.startsWith(PREFIX) && v)

if (entries.length === 0) {
  console.log("Nenhuma variável TENANT_DB__* definida — nada a sincronizar.")
  process.exit(0)
}

for (const [key, url] of entries) {
  const slug = key.slice(PREFIX.length)
  console.log(`\n▶  db push → ${slug}`)
  try {
    execSync("npx prisma db push --skip-generate", {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: url },
    })
  } catch (e) {
    console.error(`❌ Falha ao sincronizar ${slug}:`, e.message)
    process.exit(1)
  }
}

console.log("\n✅ Todos os bancos sincronizados com sucesso.")
