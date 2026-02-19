import Announcements from "@/components/Announcements"
import EventCalendarContainer from "@/components/EventCalendarContainer"
import { currentUser } from "@clerk/nextjs/server"
import Link from "next/link"
import Image from "next/image"
import { Users, Shield, HandHelping, Music, Baby, GraduationCap } from "lucide-react"
import Aniversariantes from "@/components/Aniversariantes"


export const dynamic = "force-dynamic"

const UMPIcon = ({ size }: { size?: number }) => (
  <Image src="/UMP.png" alt="UMP" width={(size ?? 32) + 16} height={(size ?? 32) + 16} className="object-contain" />
)

const UPAIcon = ({ size }: { size?: number }) => (
  <Image src="/UPA.png" alt="UPA" width={(size ?? 32) + 16} height={(size ?? 32) + 16} className="object-contain" />
)

const roleConfig: Record<string, { label: string; icon: React.ElementType; color: string; image: string }> = {
  ump:        { label: "UMP",        icon: UMPIcon,       color: "bg-blue-600",   image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80" },
  upa:        { label: "UPA",        icon: UPAIcon,       color: "bg-yellow-500", image: "https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=800&q=80" },
  uph:        { label: "UPH",        icon: Users,         color: "bg-orange-500", image: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=800&q=80" },
  saf:        { label: "SAF",        icon: Users,         color: "bg-pink-600",   image: "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=800&q=80" },
  ucp:        { label: "UCP",        icon: Baby,          color: "bg-yellow-500", image: "https://images.unsplash.com/photo-1516627145497-ae6968895b40?w=800&q=80" },
  diaconia:   { label: "Diaconia",   icon: HandHelping,   color: "bg-teal-600",   image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&q=80" },
  conselho:   { label: "Conselho",   icon: Shield,        color: "bg-indigo-600", image: "https://images.unsplash.com/photo-1560439514-4e9645039924?w=800&q=80" },
  ministerio: { label: "Ministério", icon: Music,         color: "bg-green-600",  image: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&q=80" },
  ebd:        { label: "EBD",        icon: GraduationCap, color: "bg-amber-600",  image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80" },
}

const groupRoles = ["ump", "upa", "uph", "saf", "ucp", "diaconia", "conselho", "ministerio", "ebd"]

export default async function MemberPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined }
}) {
  const user = await currentUser()
  const name = user?.firstName ?? "Membro"
  const userRoles = (user?.publicMetadata?.roles as string[]) ?? []
  const isSuperAdmin = userRoles.includes("superadmin")
  const myGroups = isSuperAdmin ? groupRoles : groupRoles.filter((r) => userRoles.includes(r))

  return (
    <div className="p-4 flex gap-4 flex-col md:flex-row">
      <div className="w-full lg:w-2/3 flex flex-col gap-8">

        {/* Boas vindas */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h1 className="text-xl font-semibold text-gray-700">Olá, {name} 👋</h1>
          <p className="text-sm text-gray-500 mt-1">Bem-vindo ao sistema da igreja.</p>
        </div>

        {/* Meus grupos */}
        {myGroups.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-gray-600">Meus Grupos</h2>
            <div className="flex flex-col gap-4">
              {myGroups.map((role) => {
                const config = roleConfig[role]
                if (!config) return null
                const Icon = config.icon
                return (
                  <Link
                    key={role}
                    href={`/${role}`}
                    className="group relative w-full h-28 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 ease-out"
                  >
                    <Image
                      src={config.image}
                      alt={config.label}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    />

                    <div className={`absolute inset-0 ${config.color} opacity-100 group-hover:opacity-30 transition-opacity duration-500`} />

                    <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />

                    <div className="absolute inset-0 flex items-center px-8 gap-6">
                      <Icon size={40} className="text-white shrink-0 drop-shadow-lg" />
                      <div className="w-px h-12 bg-white/40" />
                      <div>
                        <span className="text-white font-bold text-2xl drop-shadow-lg block">{config.label}</span>
                        <span className="text-white/70 text-sm group-hover:text-white transition-colors">
                          Acessar grupo →
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Avisos */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Avisos Gerais</h2>
          <Announcements />
           <Aniversariantes />
        </div>

      </div>

      {/* Direita */}
      <div className="w-full lg:w-1/3 flex flex-col gap-8">
        <EventCalendarContainer searchParams={searchParams} />
      </div>

     
    </div>
  )
}