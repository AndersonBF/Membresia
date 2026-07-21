import { Clock } from "lucide-react"

export const dynamic = "force-dynamic"

export default function EmBrevePage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "linear-gradient(150deg, #0c3d22 0%, #14532d 50%, #166534 100%)", fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-6">
          <Clock size={30} className="text-white" />
        </div>
        <h1 className="text-white text-3xl font-bold mb-3">Em breve</h1>
        <p className="text-white/60 leading-relaxed">
          Este endereço ainda não está disponível. Se você é responsável por uma igreja
          e quer ativar o seu espaço aqui, entre em contato com a equipe do Membresia.
        </p>
      </div>
    </div>
  )
}
