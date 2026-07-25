// src/app/api/admin/churches/route.ts
// Provisionamento de uma igreja (tenant) pelo painel — só superadmin.
//   GET  → lista as igrejas do control-plane (usado pela UI da Fase C).
//   POST → cria banco no Neon, aplica schema, semeia baseline, cria admin no Clerk
//          e registra no control-plane. Fim: subdomínio ativo, sem redeploy.
import { NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { PrismaClient } from "@prisma/client"
import { readFileSync } from "fs"
import path from "path"
import {
  controlPlaneEnabled,
  listTenantsDB,
  upsertTenant,
  setTenantStatus,
  deleteTenant,
} from "@/lib/controlPlane"
import { primeSnapshot, removeFromSnapshot } from "@/lib/tenantRegistry"
import { getTenantRegistry } from "@/lib/tenant"
import { neonEnabled, createNeonDatabase, deleteNeonDatabase } from "@/lib/neon"
import { applySchema, seedChurchBaseline, waitForDb } from "@/lib/churchSeed"

export const dynamic = "force-dynamic"
export const maxDuration = 60 // provisionamento pode levar alguns segundos

// Lido no cold start — garante que o Vercel inclua o arquivo no bundle da função.
const INIT_SQL = readFileSync(path.join(process.cwd(), "prisma", "init.sql"), "utf8")

const RESERVED = new Set(["www", "api", "app", "admin", "sign-in", "sign-up", "em-breve", "acesso-negado"])

async function requireSuperadmin(): Promise<{ ok: true } | { ok: false; res: NextResponse }> {
  const { userId, sessionClaims } = await auth()
  if (!userId) return { ok: false, res: NextResponse.json({ error: "Não autorizado" }, { status: 401 }) }
  const roles = (sessionClaims?.metadata as { roles?: string[] })?.roles ?? []
  if (!roles.includes("superadmin")) {
    return { ok: false, res: NextResponse.json({ error: "Apenas superadmin" }, { status: 403 }) }
  }
  return { ok: true }
}

function generateUsername(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "")
    .slice(0, 20)
}

function generatePassword(): string {
  return Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase()
}

export async function GET() {
  const guard = await requireSuperadmin()
  if (!guard.ok) return guard.res
  if (!controlPlaneEnabled()) {
    return NextResponse.json({ tenants: [], controlPlane: false })
  }
  const tenants = await listTenantsDB()
  // Não vaza a connection string para o cliente.
  return NextResponse.json({
    controlPlane: true,
    tenants: tenants.map((t) => ({ slug: t.slug, name: t.name, status: t.status })),
  })
}

export async function DELETE(req: Request) {
  const guard = await requireSuperadmin()
  if (!guard.ok) return guard.res
  if (!controlPlaneEnabled()) {
    return NextResponse.json({ error: "CONTROL_PLANE_DATABASE_URL não configurado" }, { status: 400 })
  }

  const slug = (new URL(req.url).searchParams.get("slug") ?? "").trim().toLowerCase()
  if (!slug) return NextResponse.json({ error: "slug obrigatório" }, { status: 400 })

  try {
    // Apaga o banco no Neon (libera espaço). Não bloqueia se já não existir.
    if (neonEnabled()) {
      try {
        await deleteNeonDatabase(slug)
      } catch (e) {
        console.error(`⚠️ Falha ao apagar banco Neon de ${slug}:`, e)
      }
    }
    await deleteTenant(slug)
    removeFromSnapshot(slug)
    return NextResponse.json({ ok: true, slug })
  } catch (err: any) {
    console.error("❌ Falha ao excluir igreja:", err)
    return NextResponse.json({ error: err?.message ?? "Erro ao excluir" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const guard = await requireSuperadmin()
  if (!guard.ok) return guard.res

  if (!controlPlaneEnabled()) {
    return NextResponse.json({ error: "CONTROL_PLANE_DATABASE_URL não configurado" }, { status: 400 })
  }
  if (!neonEnabled()) {
    return NextResponse.json({ error: "NEON_API_KEY / NEON_PROJECT_ID não configurados" }, { status: 400 })
  }

  const body = await req.json().catch(() => ({}))
  const name: string = (body.name ?? "").trim()
  const slug: string = (body.slug ?? "").trim().toLowerCase()
  const adminName: string = (body.adminName ?? "").trim()
  const role: string = body.role === "pastor" ? "pastor" : "admin"

  // ── Validações ──
  if (!name || !slug) {
    return NextResponse.json({ error: "Informe nome e slug" }, { status: 400 })
  }
  if (!/^[a-z][a-z0-9-]{1,30}$/.test(slug) || RESERVED.has(slug)) {
    return NextResponse.json({ error: "Slug inválido ou reservado" }, { status: 400 })
  }
  // Unicidade: env (TENANT_DB__*) + control-plane.
  const envRegistry = getTenantRegistry()
  const existing = await listTenantsDB()
  const prior = existing.find((t) => t.slug === slug)
  // Bloqueia se o slug existe em env ou como igreja já ATIVA/suspensa. Um registro
  // 'provisioning' é de uma tentativa que falhou — permite reprovisionar por cima.
  if (envRegistry[slug] || (prior && prior.status !== "provisioning")) {
    return NextResponse.json({ error: `Slug "${slug}" já existe` }, { status: 409 })
  }

  // ── Provisionamento ──
  let churchPrisma: PrismaClient | null = null
  try {
    // Registra a intenção (status provisioning) antes de mexer no Neon.
    await upsertTenant({ slug, name, dbUrl: "", status: "provisioning" })

    // 1. Banco no Neon
    const { dbUrl, rawUrl, dbName, branchId } = await createNeonDatabase(slug)

    // 2. Schema em um único round-trip (driver Neon) + seed (Prisma)
    await applySchema(rawUrl, INIT_SQL)
    churchPrisma = new PrismaClient({ datasources: { db: { url: dbUrl } } })
    await waitForDb(churchPrisma)
    await seedChurchBaseline(churchPrisma, { slug, name })

    // 3. Admin no Clerk (+ Member correspondente no banco da igreja)
    let admin: { username: string; password: string } | null = null
    if (adminName) {
      const clerk = await clerkClient()
      const base = generateUsername(adminName) || "admin"
      let username = base
      let suffix = 1
      while (true) {
        const noBanco = await churchPrisma.member.findFirst({ where: { username } })
        let noClerk = false
        try {
          const { data } = await clerk.users.getUserList({ username: [username] })
          noClerk = (data ?? []).length > 0
        } catch {}
        if (!noBanco && !noClerk) break
        username = `${base}${suffix++}`
      }
      const password = generatePassword()
      await clerk.users.createUser({
        username,
        password,
        publicMetadata: { roles: [role], church: slug, mustChangePassword: true },
      })
      await churchPrisma.member.create({ data: { name: adminName, username, password } })
      admin = { username, password }
    }

    // 4. Ativa no control-plane + torna resolvível já nesta instância
    await upsertTenant({ slug, name, dbUrl, status: "active", neonProject: process.env.NEON_PROJECT_ID, neonDbName: dbName })
    primeSnapshot(slug, dbUrl)

    const baseDomain = process.env.TENANT_BASE_DOMAIN
    const url = baseDomain ? `https://${slug}.${baseDomain}` : null

    return NextResponse.json({ ok: true, slug, name, url, branchId, admin })
  } catch (err: any) {
    console.error("❌ Falha ao provisionar igreja:", err)
    // Deixa como provisioning para inspeção/retry manual.
    try {
      await setTenantStatus(slug, "provisioning")
    } catch {}
    return NextResponse.json({ error: err?.message ?? "Erro no provisionamento" }, { status: 500 })
  } finally {
    if (churchPrisma) await churchPrisma.$disconnect().catch(() => {})
  }
}
