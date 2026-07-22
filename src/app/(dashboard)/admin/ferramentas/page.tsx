import { currentUser } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Activity, Users, Inbox, Key, Settings, DollarSign, UserCircle } from "lucide-react"

export const dynamic = "force-dynamic"

const FERRAMENTAS = [
  { label: "Acessos",       sub: "Quem entrou no sistema e quando", icon: Activity,   href: "/admin/acessos",     destaque: true },
  { label: "Membros",       sub: "Cadastro geral da igreja",        icon: Users,      href: "/list/members" },
  { label: "Visitantes",    sub: "Contatos recebidos pelo site",    icon: Inbox,      href: "/list/visitantes" },
  { label: "Credenciais",   sub: "Logins e senhas dos membros",     icon: Key,        href: "/admin/credenciais" },
  { label: "Financeiro",    sub: "Entradas, saídas e saldo",        icon: DollarSign, href: "/list/finance" },
  { label: "Configurações", sub: "Dados e ajustes da igreja",       icon: Settings,   href: "/settings" },
]

export default async function AdminFerramentasPage() {
  const user = await currentUser()
  const roles = (user?.publicMetadata?.roles as string[]) ?? []
  if (!user || !(roles.includes("admin") || roles.includes("superadmin"))) notFound()

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* HERO */}
      <div style={{ background: "#1e293b" }}>
        <div className="px-6 md:px-10 pt-6 pb-8">
          <Link href="/admin" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs transition">
            <ArrowLeft size={13} /> Voltar
          </Link>
          <div className="flex items-center gap-4 mt-4">
            <div className="rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.08)" }}>
              <UserCircle size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold" style={{ fontSize: "clamp(1.8rem,5vw,2.6rem)" }}>
                Administração
              </h1>
              <p className="text-white/50 text-sm mt-1 font-light">
                Controle do sistema e da igreja
              </p>
            </div>
          </div>
        </div>
        <div style={{ height: 2, background: "linear-gradient(90deg, #0f766e, #0f766e55, transparent)" }} />
      </div>

      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FERRAMENTAS.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`rounded-2xl border p-5 flex flex-col gap-2 transition hover:-translate-y-0.5 hover:shadow-md ${
                  item.destaque
                    ? "bg-teal-700 border-teal-700 text-white shadow-sm"
                    : "bg-white border-gray-100 shadow-sm"
                }`}
              >
                <Icon size={22} className={item.destaque ? "text-white" : "text-teal-700"} />
                <p className={`font-semibold ${item.destaque ? "text-white" : "text-gray-800"}`}>
                  {item.label}
                </p>
                <p className={`text-xs ${item.destaque ? "text-white/70" : "text-gray-400"}`}>
                  {item.sub}
                </p>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
