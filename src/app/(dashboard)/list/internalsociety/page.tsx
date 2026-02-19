import { currentUser } from "@clerk/nextjs/server"
import prisma from "@/lib/prisma"
import Image from "next/image"
import Link from "next/link"
import { Users, Baby } from "lucide-react"

export const dynamic = "force-dynamic"

const societyConfig: Record<string, { bg: string; textColor: string; description: string; image: string; icon: React.ElementType }> = {
  UMP: { bg: "bg-blue-600",   textColor: "text-blue-700",   description: "União da Mocidade Presbiteriana. Voltada para jovens que buscam crescimento espiritual, comunhão e serviço.", image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80", icon: Users },
  UPA: { bg: "bg-yellow-500", textColor: "text-yellow-700", description: "União Presbiteriana de Adolescentes. Espaço de formação cristã e comunhão para os adolescentes.", image: "https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=800&q=80", icon: Users },
  UPH: { bg: "bg-orange-500", textColor: "text-orange-700", description: "União Presbiteriana de Homens. Promove a comunhão e o serviço entre os homens da igreja.", image: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=800&q=80", icon: Users },
  SAF: { bg: "bg-pink-600",   textColor: "text-pink-700",   description: "Sociedade Auxiliadora Feminina. Reúne as mulheres da igreja em torno da fé e serviço.", image: "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=800&q=80", icon: Users },
  UCP: { bg: "bg-yellow-500", textColor: "text-yellow-700", description: "União das Crianças Presbiterianas. Formação cristã das crianças através de ensino bíblico.", image: "https://images.unsplash.com/photo-1516627145497-ae6968895b40?w=800&q=80", icon: Baby },
}

const UMPIcon = () => (
  <Image src="/UMP.png" alt="UMP" width={52} height={52} className="object-contain drop-shadow-lg" />
)

const UPAIcon = () => (
  <Image src="/UPA.png" alt="UPA" width={52} height={52} className="object-contain drop-shadow-lg" />
)

const photoPlaceholders = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80",
]

function getSocietyIcon(name: string) {
  if (name === "UMP") return <UMPIcon />
  if (name === "UPA") return <UPAIcon />
  const config = societyConfig[name]
  if (!config) return <Users size={48} className="text-white drop-shadow-lg" />
  const Icon = config.icon
  return <Icon size={48} className="text-white drop-shadow-lg" />
}

export default async function InternalSocietyPage() {
  const societies = await prisma.internalSociety.findMany({
    include: {
      members: {
        include: { member: true },
        take: 5,
      },
    },
    orderBy: { name: "asc" },
  })

  return (
    <div className="p-4 flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-gray-700">Sociedades Internas</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {societies.map((society) => {
          const config = societyConfig[society.name] ?? {
            bg: "bg-gray-600", textColor: "text-gray-700",
            description: "Sociedade interna da igreja.",
            image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80",
            icon: Users,
          }

          return (
            <div key={society.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">

              {/* Banner */}
              <div className="relative w-full h-28 overflow-hidden">
                <Image src={config.image} alt={society.name} fill className="object-cover" />
                <div className={`absolute inset-0 ${config.bg} opacity-80`} />
                <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />
                <div className="absolute inset-0 flex items-center px-6 gap-4">
                  {getSocietyIcon(society.name)}
                  <div className="w-px h-12 bg-white/40" />
                  <div>
                    <h2 className="text-white font-bold text-2xl drop-shadow-lg">{society.name}</h2>
                    <span className="text-white/70 text-xs">{society.members.length} membros</span>
                  </div>
                </div>
              </div>

              <div className="p-5 flex flex-col gap-4">
                {/* Descrição */}
                <p className="text-gray-500 text-sm leading-relaxed">{config.description}</p>

               {society.members.length > 0 && (
  <div className="flex gap-3 justify-between">
    {society.members.map((ms, index) => (
      <div key={ms.id} className="flex flex-col items-center gap-1 flex-1">
        <div className="relative w-20 h-20 rounded-full overflow-hidden ring-2 ring-gray-100">
          <Image
            src={photoPlaceholders[index % photoPlaceholders.length]}
            alt={ms.member.name}
            fill
            className="object-cover"
          />
        </div>
        <p className="text-xs font-semibold text-gray-700 text-center truncate w-full">
          {ms.member.name.split(" ")[0]}
        </p>
        <p className="text-xs text-gray-400 text-center">{ms.member.phone ?? "-"}</p>
      </div>
    ))}
  </div>
)}

                <Link
                  href={`/${society.name.toLowerCase()}`}
                  className={`text-xs font-medium ${config.textColor} hover:underline text-right`}
                >
                  Ver painel completo →
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}