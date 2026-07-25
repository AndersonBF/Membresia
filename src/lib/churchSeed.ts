// src/lib/churchSeed.ts
// Aplicação de schema e seed do baseline de uma igreja NOVA, em um banco vazio.
// Serverless-safe: não usa a CLI do Prisma — aplica o prisma/init.sql instrução a
// instrução via $executeRawUnsafe, e semeia com métodos tipados do Prisma.
//
// Usado pela Fase B (POST /api/admin/churches). O baseline é o mesmo do script
// scripts/provision-church.mjs (sociedades com IDs fixos 3-7, singletons id=1, etc).
import type { PrismaClient } from "@prisma/client"

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

/** Aplica o schema (init.sql) num banco vazio, instrução a instrução.
 *  Ignora "already exists" para ser idempotente (retry de provisionamento). */
export async function applyInitSql(prisma: PrismaClient, initSql: string): Promise<void> {
  for (const stmt of splitSqlStatements(initSql)) {
    try {
      await prisma.$executeRawUnsafe(stmt)
    } catch (e: any) {
      if (/already exists/i.test(String(e?.message))) continue
      throw e
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
