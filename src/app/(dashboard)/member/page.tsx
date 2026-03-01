import Announcements from "@/components/Announcements"
import EventCalendarContainer from "@/components/EventCalendarContainer"
import { currentUser } from "@clerk/nextjs/server"
import Link from "next/link"
import Image from "next/image"
import { roleConfig } from "@/lib/roleConfig"
import Aniversariantes from "@/components/Aniversariantes"

export const dynamic = "force-dynamic"

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
                    {config.image.startsWith("/") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={config.image}
                        alt={config.label}
                        className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-110"
                        style={{ display: "block" }}
                      />
                    ) : (
                      <Image
                        src={config.image}
                        alt={config.label}
                        fill
                        sizes="(max-width: 768px) 100vw, 66vw"
                        className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                      />
                    )}
                    <div className="absolute inset-0 opacity-100 group-hover:opacity-30 transition-opacity duration-500" style={{ backgroundColor: config.bgHex }} />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />
                    <div className="absolute inset-0 flex items-center px-8 gap-6">
                      <Icon size={40} className="shrink-0 drop-shadow-lg" />
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