import { currentUser } from "@clerk/nextjs/server"
import prisma from "@/lib/prisma"
import Image from "next/image"
import Link from "next/link"
import { Users } from "lucide-react"

export const dynamic = "force-dynamic"

const societyConfig: Record<string, { color: string; bg: string; description: string; image: string }> = {
  UMP: {
    color: "text-blue-700",
    bg: "bg-blue-600",
    description: "União da Mocidade Presbiteriana. Voltada para jovens que buscam crescimento espiritual, comunhão e serviço.",
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80",
  },
  UPA: {
    color: "text-yellow-700",
    bg: "bg-yellow-500",
    description: "União Presbiteriana de Adolescentes. Espaço de formação cristã e comunhão para os adolescentes da igreja.",
    image: "https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=800&q=80",
  },
  UPH: {
    color: "text-orange-700",
    bg: "bg-orange-500",
    description: "União Presbiteriana de Homens. Promove a comunhão, o estudo bíblico e o serviço entre os homens da igreja.",
    image: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=800&q=80",
  },
  SAF: {
    color: "text-pink-700",
    bg: "bg-pink-600",
    description: "Sociedade Auxiliadora Feminina. Reúne as mulheres da igreja em torno da fé, serviço e cuidado com o próximo.",
    image: "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=800&q=80",
  },
  UCP: {
    color: "text-yellow-700",
    bg: "bg-yellow-500",
    description: "União das Crianças Presbiterianas. Cuida da formação cristã das crianças através de atividades e ensino bíblico.",
    image: "https://images.unsplash.com/photo-1516627145497-ae6968895b40?w=800&q=80",
  },
}

const photoPlaceholders = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80",
]

export default async function InternalSocietyPage() {
  const user = await currentUser()
  const roles = (user?.publicMetadata?.roles as string[]) ?? []
  const isAdmin = roles.includes("admin") || roles.includes("superadmin")

  const societies = await prisma.internalSociety.findMany({
    include: {
      members: {
        include: { member: true },
      },
      events: {
        orderBy: { date: "desc" },
        take: 3,
      },
    },
    orderBy: { name: "asc" },
  })

  if (societies.length === 0) {
    return (
      <div className="p-4">
        <p className="text-gray-500 text-sm">Nenhuma sociedade encontrada.</p>
      </div>
    )
  }

  return (
    <div className="p-4 flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-gray-700">Sociedades Internas</h1>

      <div className="flex flex-col gap-6">
        {societies.map((society) => {
          const config = societyConfig[society.name] ?? {
            color: "text-gray-700",
            bg: "bg-gray-600",
            description: "Sociedade interna da igreja.",
            image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80",
          }

          const roleSlug = society.name.toLowerCase()

          return (
            <div key={society.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">

              {/* Banner */}
              <div className="relative w-full h-36 overflow-hidden">
                <Image
                  src={config.image}
                  alt={society.name}
                  fill
                  className="object-cover"
                />
                <div className={`absolute inset-0 ${config.bg} opacity-75`} />
                <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />
                <div className="absolute inset-0 flex items-center px-8 gap-4">
                  <Users size={36} className="text-white shrink-0 drop-shadow-lg" />
                  <div className="w-px h-10 bg-white/40" />
                  <div>
                    <h2 className="text-white font-bold text-2xl drop-shadow-lg">{society.name}</h2>
                    <span className="text-white/70 text-sm">{society.members.length} membros</span>
                  </div>
                </div>
              </div>

              {/* Conteúdo */}
              <div className="p-6 flex flex-col gap-5">

                {/* Descrição */}
                <p className="text-gray-500 text-sm leading-relaxed">{config.description}</p>

                {/* Membros */}
                {society.members.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-3">Membros</h3>
                    <div className="flex flex-wrap gap-4">
                      {society.members.slice(0, 5).map((ms, index) => (
                        <div key={ms.id} className="flex flex-col items-center gap-1 w-16">
                          <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-gray-100">
                            <Image
                              src={photoPlaceholders[index % photoPlaceholders.length]}
                              alt={ms.member.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <span className="text-xs text-gray-600 text-center leading-tight line-clamp-2">
                            {ms.member.name.split(" ")[0]}
                          </span>
                        </div>
                      ))}
                      {society.members.length > 5 && (
                        <div className="flex flex-col items-center gap-1 w-16">
                          <div className="w-12 h-12 rounded-full bg-gray-100 ring-2 ring-gray-100 flex items-center justify-center">
                            <span className="text-xs font-semibold text-gray-500">+{society.members.length - 5}</span>
                          </div>
                          <span className="text-xs text-gray-400">outros</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Eventos recentes */}
                {society.events.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">Eventos recentes</h3>
                    <div className="flex flex-col gap-1">
                      {society.events.map((event) => (
                        <div key={event.id} className="flex items-center justify-between text-sm text-gray-500 py-1 border-b border-gray-50 last:border-0">
                          <span>{event.title}</span>
                          <span className="text-xs text-gray-400">{new Date(event.date).toLocaleDateString("pt-BR")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rodapé */}
                <div className="flex justify-end pt-2 border-t border-gray-100">
                  <Link
                    href={`/${roleSlug}`}
                    className={`text-sm font-medium ${config.color} hover:underline`}
                  >
                    Ver painel completo →
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}