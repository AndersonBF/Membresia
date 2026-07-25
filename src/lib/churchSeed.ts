// src/lib/churchSeed.ts
// Aplicação de schema e seed do baseline de uma igreja NOVA, em um banco vazio.
// Serverless-safe: não usa a CLI do Prisma — aplica o prisma/init.sql instrução a
// instrução via $executeRawUnsafe, e semeia com métodos tipados do Prisma.
//
// Usado pela Fase B (POST /api/admin/churches). O baseline é o mesmo do script
// scripts/provision-church.mjs (sociedades com IDs fixos 3-7, singletons id=1, etc).
import type { PrismaClient } from "@prisma/client"
import { Client } from "pg"

// Sociedades com IDs fixos (o app mapeia por eles): saf=3, uph=4, ump=5, upa=6, ucp=7
const SOCIEDADES = [
  { id: 3, name: "SAF" },
  { id: 4, name: "UPH" },
  { id: 5, name: "UMP" },
  { id: 6, name: "UPA" },
  { id: 7, name: "UCP" },
]

/** Quebra o init.sql em instruções, removendo comentários. Seguro para o SQL
 *  gerado pelo Prisma (sem ';' dentro de strings/funcões). */
export function splitSqlStatements(sql: string): string[] {
  return sql
    .split("\n")
    .filter((l) => !l.trim().startsWith("--"))
    .join("\n")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
}

/** Acorda o compute do Neon antes do trabalho pesado: tenta um SELECT 1 com
 *  retry, absorvendo o cold start (scale-to-zero) do banco recém-criado. */
export async function waitForDb(prisma: PrismaClient, tries = 6, delayMs = 2500): Promise<void> {
  for (let i = 0; i < tries; i++) {
    try {
      await prisma.$queryRawUnsafe("SELECT 1")
      return
    } catch (e) {
      if (i === tries - 1) throw e
      await new Promise((r) => setTimeout(r, delayMs))
    }
  }
}

/**
 * Aplica o schema inteiro em UM único round-trip (multi-statement) via node-postgres.
 * O Postgres executa o lote como uma transação implícita: ou aplica tudo, ou nada
 * (retry seguro). Tolera cold start (retry no connect) e "already exists" (cura um
 * banco que já recebeu o schema numa tentativa anterior).
 */
export async function applySchema(rawUrl: string, initSql: string): Promise<void> {
  for (let i = 0; ; i++) {
    const client = new Client({
      connectionString: rawUrl,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 15000,
    })
    try {
      await client.connect()
      await client.query(initSql) // multi-statement: um round-trip só
      await client.end()
      return
    } catch (e: any) {
      await client.end().catch(() => {})
      const msg = String(e?.message ?? "")
      if (/already exists/i.test(msg)) return // schema já aplicado → pronto
      if (i >= 4) throw e
      // Cold start do compute (scale-to-zero): espera e tenta de novo.
      await new Promise((r) => setTimeout(r, 2500))
    }
  }
}

/** Semeia o baseline mínimo que o app precisa. Idempotente (upsert). */
export async function seedChurchBaseline(
  prisma: PrismaClient,
  opts: { slug: string; name: string },
): Promise<void> {
  await prisma.churchSettings.upsert({
    where: { id: 1 },
    update: { slug: opts.slug, churchName: opts.name },
    create: { id: 1, slug: opts.slug, churchName: opts.name },
  })

  for (const s of SOCIEDADES) {
    await prisma.internalSociety.upsert({
      where: { id: s.id },
      update: { name: s.name },
      create: { id: s.id, name: s.name },
    })
  }

  await prisma.council.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } })
  await prisma.diaconate.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } })
  await prisma.bibleSchool.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } })

  // Ministério padrão (o app usa findFirst para o papel "ministerio").
  const temMinisterio = await prisma.ministry.findFirst()
  if (!temMinisterio) {
    await prisma.ministry.create({ data: { name: "Ministério de Louvor" } })
  }
}
