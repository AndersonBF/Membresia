import { currentUser } from "@clerk/nextjs/server"
import { Clock } from "lucide-react"

export const dynamic = "force-dynamic"

const agenda = [
  {
    dia: "Segunda",
    eventos: [
      { hora: "20:00", titulo: "UPH", descricao: "União Presbiteriana de Homens", color: "bg-orange-500", border: "border-orange-400" },
      { hora: "20:00", titulo: "SAF", descricao: "Sociedade Auxiliadora Feminina", color: "bg-pink-600", border: "border-pink-400" },
    ],
  },
  {
    dia: "Terça",
    eventos: [
      { hora: "14:00", titulo: "SAF", descricao: "Sociedade Auxiliadora Feminina", color: "bg-pink-600", border: "border-pink-400" },
    ],
  },
  {
    dia: "Quarta",
    eventos: [
      { hora: "19:30", titulo: "Culto de Oração", descricao: "Culto semanal de oração e estudos", color: "bg-indigo-600", border: "border-indigo-400" },
    ],
  },
  {
    dia: "Quinta",
    eventos: [],
  },
  {
    dia: "Sexta",
    eventos: [
      { hora: "", titulo: "Ministério de Intercessão", descricao: "Reunião do ministério", color: "bg-green-600", border: "border-green-400" },
    ],
  },
  {
    dia: "Sábado",
    eventos: [
      { hora: "18:00", titulo: "UPA", descricao: "União Presbiteriana de Adolescentes", color: "bg-yellow-500", border: "border-yellow-400" },
      { hora: "19:30", titulo: "UMP", descricao: "União da Mocidade Presbiteriana", color: "bg-blue-600", border: "border-blue-400" },
    ],
  },
  {
    dia: "Domingo",
    eventos: [
      { hora: "09:00", titulo: "EBD", descricao: "Escola Bíblica Dominical", color: "bg-amber-500", border: "border-amber-400" },
      { hora: "18:00", titulo: "Culto", descricao: "Culto de adoração", color: "bg-indigo-600", border: "border-indigo-400" },
    ],
  },
]

export default async function AgendaPage() {
  const hoje = new Date()
  const diaHojeIndex = hoje.getDay() // 0 = domingo
  const diasMap: Record<string, number> = {
    "Domingo": 0, "Segunda": 1, "Terça": 2, "Quarta": 3,
    "Quinta": 4, "Sexta": 5, "Sábado": 6,
  }

  return (
    <div className="p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-700">Agenda Semanal</h1>
        <span className="text-sm text-gray-400">
          {hoje.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {agenda.map((item) => {
          const isHoje = diasMap[item.dia] === diaHojeIndex

          return (
            <div
              key={item.dia}
              className={`bg-white rounded-xl shadow-sm overflow-hidden ${isHoje ? "ring-2 ring-indigo-400" : ""}`}
            >
              {/* Header */}
              <div className={`px-4 py-2.5 flex items-center justify-between ${isHoje ? "bg-indigo-600" : "bg-gray-50"}`}>
                <h2 className={`font-bold text-sm ${isHoje ? "text-white" : "text-gray-600"}`}>
                  {item.dia}
                  {isHoje && <span className="ml-2 text-xs font-normal opacity-80">— Hoje</span>}
                </h2>
                {item.eventos.length === 0 && (
                  <span className={`text-xs ${isHoje ? "text-white/60" : "text-gray-400"}`}>Sem eventos</span>
                )}
              </div>

              {/* Eventos */}
              {item.eventos.length > 0 && (
                <div className="divide-y divide-gray-50">
                  {item.eventos.map((evento, index) => (
                    <div key={index} className={`flex items-center gap-3 px-4 py-3 border-l-4 ${evento.border}`}>
                      <div className={`${evento.color} w-2 h-2 rounded-full shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-700">{evento.titulo}</p>
                        <p className="text-xs text-gray-400 truncate">{evento.descricao}</p>
                      </div>
                      {evento.hora && (
                        <div className="flex items-center gap-1 shrink-0">
                          <Clock size={11} className="text-gray-400" />
                          <span className="text-xs font-medium text-gray-500">{evento.hora}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}