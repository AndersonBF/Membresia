import { Sparkles } from "lucide-react"
import { getDemoTenants } from "@/lib/tenant"
import { getCurrentSubdomain } from "@/lib/tenant-server"

// Faixa "Ambiente de demonstração" — aparece quando o subdomínio atual está em
// DEMO_TENANTS (ex.: "igreja"). Fallback: NEXT_PUBLIC_DEMO_MODE=true.
export default function DemoBanner() {
  const sub = getCurrentSubdomain()
  const isDemo =
    (sub && getDemoTenants().includes(sub)) ||
    process.env.NEXT_PUBLIC_DEMO_MODE === "true"

  if (!isDemo) return null

  return (
    <div className="w-full bg-amber-400 text-amber-950 text-xs md:text-sm font-medium px-4 py-2 flex items-center justify-center gap-2">
      <Sparkles size={14} />
      Ambiente de demonstração — os dados são fictícios e podem ser apagados a qualquer momento.
    </div>
  )
}
