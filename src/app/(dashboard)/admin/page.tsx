import AttendanceChart from "@/components/AttendanceChart"
import UserCard from "@/components/UserCard"
import FinanceChart from "@/components/FinanceChart"
import Announcements from "@/components/Announcements"
import EventCalendarContainer from "@/components/EventCalendarContainer"
import CountChartContainer from "@/components/CountChartContainer"
import { currentUser } from "@clerk/nextjs/server"
import Link from "next/link"
import Image from "next/image"
import { 
  Users, Shield, HandHelping, Music, Baby, UserCircle, GraduationCap
} from "lucide-react"

const UMPIcon = ({ size }: { size?: number }) => (
  <Image src="/UMP.png" alt="UMP" width={(size ?? 32) + 16} height={(size ?? 32) + 16} className="object-contain" />
)

const UPAIcon = ({ size }: { size?: number }) => (
  <Image src="/UPA.png" alt="UPA" width={(size ?? 32) + 16} height={(size ?? 32) + 16} className="object-contain" />
)

const roleConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  admin:      { label: "Admin", icon: UserCircle, color: "bg-gray-700" },
  ump:        { label: "UMP", icon: UMPIcon, color: "bg-blue-600" },
  upa:        { label: "UPA", icon: UPAIcon, color: "bg-yellow-500" },
  uph:        { label: "UPH", icon: Users, color: "bg-orange-500" },
  saf:        { label: "SAF", icon: Users, color: "bg-pink-600" },
  ucp:        { label: "UCP", icon: Baby, color: "bg-yellow-500" },
  diaconia:   { label: "Diaconia", icon: HandHelping, color: "bg-teal-600" },
  conselho:   { label: "Conselho", icon: Shield, color: "bg-indigo-600" },
  ministerio: { label: "Ministério", icon: Music, color: "bg-green-600" },
  ebd:        { label: "EBD", icon: GraduationCap, color: "bg-amber-600" },
}

const allRoles = Object.keys(roleConfig)

const AdminPage = async ({
  searchParams,
}: {
  searchParams: { [keys: string]: string | undefined };
}) => {
  const user = await currentUser()
  const roles = (user?.publicMetadata?.roles as string[]) ?? []

  // superadmin vê todos os roles, outros veem apenas os seus
  const visibleRoles = roles.includes("superadmin") 
    ? allRoles 
    : roles.filter((r) => r !== "member" && r !== "superadmin")

  return (
    <div className='p-4 flex gap-4 flex-col md:flex-row'>
      <div className="w-full lg:w-2/3 flex flex-col gap-8">

        {/* CARDS DE ROLES */}
        {visibleRoles.length > 0 && (
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-gray-600">Meus Grupos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleRoles.map((role) => {
                const config = roleConfig[role]
                if (!config) return null
                const Icon = config.icon
                return (
                  <Link
                    key={role}
                    href={`/${role}`}
                    className={`${config.color} text-white rounded-xl px-6 py-5 flex items-center justify-center gap-4 shadow-md hover:opacity-90 active:scale-95 active:brightness-90 transition-all duration-150 w-full`}
                  >
                    <Icon size={32} className="shrink-0" />
                    <span className="font-bold text-xl">{config.label}</span>
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
      </div>
    </div>
  )
}

export default AdminPage