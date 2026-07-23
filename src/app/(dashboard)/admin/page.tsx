import Announcements from "@/components/Announcements"
import EventCalendarContainer from "@/components/EventCalendarContainer"
import { currentUser } from "@clerk/nextjs/server"
import { cache } from "react"
import Link from "next/link"
import Image from "next/image"
import { roleConfig } from "@/lib/roleConfig"
import Aniversariantes from "@/components/Aniversariantes"
import prisma from "@/lib/prisma"
import { getAllGroupCovers } from "@/lib/groupCovers"

const getCachedUser = cache(async () => {
  return await currentUser()
})

const allRoles = Object.keys(roleConfig)

const AdminPage = async ({
  searchParams,
}: {
  searchParams: { [keys: string]: string | undefined };
}) => {
  const user = await getCachedUser()
  const roles = (user?.publicMetadata?.roles as string[]) ?? []

  const visibleRoles = roles.includes("superadmin")
    ? allRoles
    : roles.filter((r) => r !== "member" && r !== "superadmin")

  const pastorCover = visibleRoles.includes("pastor")
    ? (await prisma.churchSettings.findFirst({ select: { pastorCoverUrl: true } }))?.pastorCoverUrl ?? null
    : null
  const covers = await getAllGroupCovers()

  return (
    <div className='p-4 flex gap-4 flex-col md:flex-row md:items-start'>
      <div className="w-full md:w-3/5 lg:w-2/3 flex flex-col gap-8">

        {/* CARDS DE ROLES */}
        {visibleRoles.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-gray-600">Meus Grupos</h2>
            <div className="flex flex-col gap-4">
              {visibleRoles.map((role) => {
                const config = roleConfig[role]
                if (!config) return null
                const Icon = config.icon  // ícone normal, com cores originais
                const image =
                  role === "pastor"
                    ? (pastorCover ?? config.image)
                    : (covers[role] ?? config.image)
                return (
                  <Link
                    key={role}
                    href={role === "admin" ? "/admin/ferramentas" : `/${role}`}
                    className="group relative w-full h-24 sm:h-28 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 ease-out"
                  >
                    {image.startsWith("/") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={image}
                        alt={config.label}
                        className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-out"
                      />
                    ) : (
                      <Image
                        src={image}
                        alt={config.label}
                        fill
                        sizes="(max-width: 768px) 100vw, 66vw"
                        className="object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-out"
                      />
                    )}
                    <div className="absolute inset-0 opacity-100 group-hover:opacity-30 transition-opacity duration-500" style={{ backgroundColor: config.bgHex }} />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />
                    <div className="absolute inset-0 flex items-center px-4 sm:px-8 gap-3 sm:gap-6">
                      {/* Wrapper dimensiona o ícone: os ícones customizados (UMP/UPA/…) ignoram className. */}
                      <span className="shrink-0 drop-shadow-lg flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 [&_svg]:w-full [&_svg]:h-full [&_img]:w-full [&_img]:h-full [&_img]:object-contain">
                        <Icon size={40} />
                      </span>
                      <div className="w-px h-9 sm:h-12 bg-white/40" />
                      <div className="min-w-0">
                        <span className="text-white font-bold text-xl sm:text-2xl drop-shadow-lg block truncate">{config.label}</span>
                        <span className="text-white/70 text-xs sm:text-sm group-hover:text-white transition-colors">
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

      </div>

      <div className="w-full md:w-2/5 lg:w-1/3 flex flex-col gap-8">
        <EventCalendarContainer searchParams={searchParams}/>
        <Announcements/>
        <Aniversariantes/>
      </div>
    </div>
  )
}

export default AdminPage