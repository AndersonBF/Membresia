// scripts/provision-church.mjs
// Provisiona uma igreja (tenant) num comando: aplica o schema no banco dela e
// semeia o baseline mínimo que o app precisa para funcionar. Opcionalmente cria
// o usuário admin no Clerk.
//
// Continua SEMI-automático: o banco no Neon e a env `TENANT_DB__<slug>` ainda são
// criados por você. Este script cuida da parte tediosa e propensa a erro
// (schema + seed + admin), que antes era manual.
//
// SEGURANÇA: usa `prisma db push` (sem --accept-data-loss) e `upsert` — NÃO é
// destrutivo. Rodar de novo no mesmo banco é seguro (não apaga dados).
//
// Uso:
//   node scripts/provision-church.mjs <slug> "<Nome da Igreja>" [opções]
//
// Opções:
//   --db "postgresql://..."   URL do banco. Se omitida, usa TENANT_DB__<slug> do ambiente.
//   --admin "Nome do Admin"   Cria o usuário admin no Clerk e imprime as credenciais.
//   --role pastor|admin       Papel do admin criado (padrão: admin).
//
// Exemplos:
//   node scripts/provision-church.mjs ipbcascavel "IPB Cascavel"
//   node scripts/provision-church.mjs ipbcascavel "IPB Cascavel" --admin "Rev. João" --role pastor
import "dotenv/config"
import { execSync } from "node:child_process"
import { PrismaClient } from "@prisma/client"
import { createClerkClient } from "@clerk/backend"

// ── Parse de argumentos ─────────────────────────────────────────────────────
const argv = process.argv.slice(2)
const positionals = []
const opts = {}
for (let i = 0; i < argv.length; i++) {
  const a = argv[i]
  if (a.startsWith("--")) {
    opts[a.slice(2)] = argv[i + 1]
    i++
  } else {
    positionals.push(a)
  }
}

const slug = positionals[0]
const name = positionals[1]

if (!slug || !name) {
  console.error('Uso: node scripts/provision-church.mjs <slug> "<Nome da Igreja>" [--db URL] [--admin "Nome"] [--role pastor|admin]')
  process.exit(1)
}

if (!/^[a-z][a-z0-9-]{1,30}$/.test(slug)) {
  console.error(`❌ Slug inválido: "${slug}". Use minúsculas, dígitos e hífen (ex.: ipbcascavel).`)
  process.exit(1)
}

const dbUrl = opts.db ?? process.env[`TENANT_DB__${slug}`]
if (!dbUrl) {
  console.error(
    `❌ Banco não encontrado. Passe --db "postgresql://..." ou defina TENANT_DB__${slug} no ambiente/.env.`,
  )
  process.exit(1)
}

const mask = (u) => u.replace(/:\/\/[^@]*@/, "://***@")

// Trava de segurança: nunca provisionar em cima do DATABASE_URL padrão (produção
// da igreja principal), que não é um banco de tenant.
if (process.env.DATABASE_URL && dbUrl === process.env.DATABASE_URL) {
  console.error("❌ A URL informada é igual ao DATABASE_URL padrão. Abortando por segurança.")
  process.exit(1)
}

// Sociedades com IDs fixos (o app mapeia por eles): saf=3, uph=4, ump=5, upa=6, ucp=7
const SOCIEDADES = [
  { id: 3, name: "SAF" },
  { id: 4, name: "UPH" },
  { id: 5, name: "UMP" },
  { id: 6, name: "UPA" },
  { id: 7, name: "UCP" },
]

function generateUsername(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "")
    .slice(0, 20)
}

function generatePassword() {
  return Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase()
}

async function main() {
  console.log(`\n🏛️  Provisionando igreja "${name}" (slug: ${slug})`)
  console.log(`   Banco: ${mask(dbUrl)}\n`)

  // ── 1. Schema ──────────────────────────────────────────────────────────────
  console.log("▶  Aplicando schema (prisma db push)...")
  execSync("npx prisma db push --skip-generate", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: dbUrl },
  })

  // ── 2. Baseline (idempotente via upsert) ────────────────────────────────────
  const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } })
  try {
    console.log("\n▶  Semeando baseline da igreja...")

    // Configurações da igreja (id fixo 1). Preserva campos já preenchidos numa
    // re-execução; só garante slug e nome.
    await prisma.churchSettings.upsert({
      where: { id: 1 },
      update: { slug, churchName: name },
      create: { id: 1, slug, churchName: name },
    })

    // Sociedades internas (IDs fixos exigidos pelo código).
    for (const s of SOCIEDADES) {
      await prisma.internalSociety.upsert({
        where: { id: s.id },
        update: { name: s.name },
        create: { id: s.id, name: s.name },
      })
    }

    // Singletons: Conselho, Diaconia e Escola Bíblica (todos id 1).
    await prisma.council.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } })
    await prisma.diaconate.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } })
    await prisma.bibleSchool.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } })

    // Ministério padrão (o app usa findFirst para o papel "ministerio").
    // Só cria se ainda não houver nenhum — não duplica em re-execução.
    const temMinisterio = await prisma.ministry.findFirst()
    if (!temMinisterio) {
      await prisma.ministry.create({ data: { name: "Ministério de Louvor" } })
    }

    console.log("   ✔ Baseline pronto (sociedades, conselho, diaconia, EBD, ministério, config).")

    // ── 3. Admin no Clerk (opcional) ──────────────────────────────────────────
    if (opts.admin) {
      const role = opts.role === "pastor" ? "pastor" : "admin"
      if (!process.env.CLERK_SECRET_KEY) {
        console.error("\n⚠️  --admin pedido, mas CLERK_SECRET_KEY não está definido. Pulei a criação do admin.")
      } else {
        console.log(`\n▶  Criando admin no Clerk (papel: ${role})...`)
        const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

        // Username único (checa Clerk e o banco da igreja).
        const base = generateUsername(opts.admin) || "admin"
        let username = base
        let suffix = 1
        while (true) {
          const noBanco = await prisma.member.findFirst({ where: { username } })
          let noClerk = false
          try {
            const { data } = await clerk.users.getUserList({ username: [username] })
            noClerk = (data ?? []).length > 0
          } catch {}
          if (!noBanco && !noClerk) break
          username = `${base}${suffix++}`
        }

        const password = generatePassword()

        const clerkUser = await clerk.users.createUser({
          username,
          password,
          // mustChangePassword: força troca no primeiro acesso (padrão do sistema).
          publicMetadata: { roles: [role], church: slug, mustChangePassword: true },
        })

        // Cria o Member correspondente no banco da igreja (paridade com create-member).
        await prisma.member.create({
          data: { name: opts.admin, username, password },
        })

        const base_domain = process.env.TENANT_BASE_DOMAIN
        const loginUrl = base_domain ? `https://${slug}.${base_domain}/sign-in` : `(subdomínio ${slug})`

        console.log("\n   ✅ Admin criado:")
        console.log(`      Usuário:  ${username}`)
        console.log(`      Senha:    ${password}   (troca obrigatória no 1º acesso)`)
        console.log(`      Clerk ID: ${clerkUser.id}`)
        console.log(`      Login em: ${loginUrl}`)
      }
    }
  } finally {
    await prisma.$disconnect()
  }

  console.log(`\n✅ Igreja "${name}" provisionada com sucesso.`)
  if (!opts.admin) {
    console.log("   Dica: rode de novo com --admin \"Nome do Responsável\" para criar o login admin.")
  }
}

main().catch((e) => {
  console.error("\n❌ Falha no provisionamento:", e?.message ?? e)
  process.exit(1)
})
