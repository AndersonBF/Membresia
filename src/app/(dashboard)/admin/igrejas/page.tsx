import { currentUser } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Church } from "lucide-react"
import { controlPlaneEnabled, listTenantsDB } from "@/lib/controlPlane"
import { neonEnabled } from "@/lib/neon"
import IgrejasClient from "@/components/IgrejasClient"

export const dynamic = "force-dynamic"

export default async function IgrejasPage() {
  const user = await currentUser()
  const roles = (user?.publicMetadata?.roles as string[]) ?? []
  if (!user || !roles.includes("superadmin")) notFound()

  const cpOn = controlPlaneEnabled()
  const tenants = cpOn ? await listTenantsDB() : []
  const baseDomain = process.env.TENANT_BASE_DOMAIN ?? null

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* HERO */}
      <div style={{ background: "#1e293b" }}>
        <div className="px-6 md:px-10 pt-6 pb-8">
          <Link href="/admin/ferramentas" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs transition">
            <ArrowLeft size={13} /> Administração
          </Link>
          <div className="flex items-center gap-4 mt-4">
            <div className="rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.08)" }}>
              <Church size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold" style={{ fontSize: "clamp(1.8rem,5vw,2.6rem)" }}>
                Igrejas
              </h1>
              <p className="text-white/50 text-sm mt-1 font-light">
                Criar e gerenciar as igrejas do sistema
              </p>
            </div>
          </div>
        </div>
        <div style={{ height: 2, background: "linear-gradient(90deg, #0f766e, #0f766e55, transparent)" }} />
      </div>

      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <IgrejasClient
          controlPlane={cpOn}
          neon={neonEnabled()}
          baseDomain={baseDomain}
          tenants={tenants.map((t) => ({ slug: t.slug, name: t.name, status: t.status }))}
        />
      </div>
    </div>
  )
}
