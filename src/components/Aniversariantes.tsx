import prisma from "@/lib/prisma"
import { Cake } from "lucide-react"

const Aniversariantes = async () => {
  const hoje = new Date()
  const mes = hoje.getMonth() + 1

  const membros = await prisma.member.findMany({
    where: {
      isActive: true,
      birthDate: { not: null },
    },
    select: {
      id: true,
      name: true,
      birthDate: true,
    },
  })

  const aniversariantes = membros
    .filter((m) => {
      if (!m.birthDate) return false
      return new Date(m.birthDate).getMonth() + 1 === mes
    })
    .sort((a, b) => {
      const diaA = new Date(a.birthDate!).getDate()
      const diaB = new Date(b.birthDate!).getDate()
      return diaA - diaB
    })

  if (aniversariantes.length === 0) return null

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Cake size={20} className="text-pink-500" />
        <h2 className="text-lg font-semibold text-gray-700">
          Aniversariantes de {hoje.toLocaleString("pt-BR", { month: "long" })}
        </h2>
      </div>

      <div className="flex flex-col gap-2">
        {aniversariantes.map((m) => {
          const dia = new Date(m.birthDate!).getDate()
          const isHoje = dia === hoje.getDate()
          return (
            <div
              key={m.id}
              className={`flex items-center justify-between px-4 py-3 rounded-xl transition
                ${isHoje
                  ? "bg-pink-50 border border-pink-200"
                  : "bg-gray-50 hover:bg-gray-100"
                }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0
                  ${isHoje ? "bg-pink-500 text-white" : "bg-gray-200 text-gray-600"}`}>
                  {dia}
                </div>
                <span className={`font-medium ${isHoje ? "text-pink-700" : "text-gray-700"}`}>
                  {m.name}
                </span>
              </div>
              {isHoje && (
                <span className="text-xs bg-pink-500 text-white px-2 py-0.5 rounded-full font-medium">
                  Hoje! 🎂
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Aniversariantes