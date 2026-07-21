import Link from "next/link"
import { ShieldAlert } from "lucide-react"

export const dynamic = "force-dynamic"

export default function AcessoNegadoPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "linear-gradient(150deg, #3d0c0c 0%, #7f1d1d 55%, #991b1b 100%)", fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-6">
          <ShieldAlert size={30} className="text-white" />
        </div>
        <h1 className="text-white text-3xl font-bold mb-3">Acesso negado</h1>
        <p className="text-white/70 leading-relaxed mb-6">
          Sua conta pertence a outra igreja. Acesse pelo endereço da sua própria igreja
          para continuar.
        </p>
        <Link
          href="/sign-in"
          className="inline-flex items-center gap-2 bg-white text-red-900 font-semibold px-6 py-3 rounded-xl text-sm shadow-lg hover:bg-red-50 transition"
        >
          Voltar ao login
        </Link>
      </div>
    </div>
  )
}
