import AttendanceChart from "@/components/AttendanceChart"
import UserCard from "@/components/UserCard"
import FinanceChart from "@/components/FinanceChart"
import Announcements from "@/components/Announcements"
import EventCalendarContainer from "@/components/EventCalendarContainer"
import CountChartContainer from "@/components/CountChartContainer"
import { currentUser } from "@clerk/nextjs/server"
import { cache } from "react"
import Link from "next/link"
import Image from "next/image"
import { roleConfig } from "@/lib/roleConfig"
import Aniversariantes from "@/components/Aniversariantes"

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

  return (
    <div className='p-4 flex gap-4 flex-col md:flex-row'>
      <div className="w-full lg:w-2/3 flex flex-col gap-8">

        {/* CARDS DE ROLES */}
        {visibleRoles.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-gray-600">Meus Grupos</h2>
            <div className="flex flex-col gap-4">
              {visibleRoles.map((role) => {
                const config = roleConfig[role]
                if (!config) return null
                const Icon = config.icon  // ícone normal, com cores originais
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
                        className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-out"
                      />
                    ) : (
                      <Image
                        src={config.image}
                        alt={config.label}
                        fill
                        sizes="(max-width: 768px) 100vw, 66vw"
                        className="object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-out"
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

        {/* CARDS DE CONTAGEM */}
        <div className="flex gap-4 justify-between flex-wrap">
          <UserCard type="member"/>
          <UserCard type="diaconate"/>
          <UserCard type="council"/>
          <UserCard type="internalsociety"/>
        </div>

        <div className="flex gap-4 flex-col lg:flex-row">
          <div className="w-full lg:w-1/3 h-[450px]">
            <CountChartContainer/>
          </div>
          <div className="w-full lg:w-2/3 h-[450px]">
            <AttendanceChart/>
          </div>
        </div>

        <div className="w-full h-[500px]">
          <FinanceChart/>
        </div>
      </div>

      <div className="w-full lg:w-1/3 flex flex-col gap-8">
        <EventCalendarContainer searchParams={searchParams}/>
        <Announcements/>
        <Aniversariantes/>
      </div>
    </div>
  )
}

export default AdminPage