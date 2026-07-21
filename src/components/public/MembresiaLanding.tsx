import Link from "next/link"
import {
  Users, Church, GraduationCap, Wallet, ClipboardCheck,
  Megaphone, BarChart3, BookMarked, Check,
} from "lucide-react"

// Homepage do produto Membresia — renderizada no domínio raiz (e no subdomínio demo).
// Copy específica (módulos reais do sistema), identidade verde, CTA "Experimentar".
// `demoLoginUrl` leva o visitante ao ambiente de demonstração (dados fictícios).
export default function MembresiaLanding({ demoLoginUrl = "/sign-in" }: { demoLoginUrl?: string }) {
  const modulos = [
    { icon: Users, titulo: "Membros e famílias", texto: "Cadastro completo com contato, aniversários, foto e histórico. Filtre por sociedade, gênero, faixa etária ou situação." },
    { icon: Church, titulo: "Sociedades internas", texto: "UMP, UPA, UPH, SAF e UCP com diretoria, cargos e eventos próprios. Cada líder gerencia o seu grupo." },
    { icon: GraduationCap, titulo: "Escola Bíblica Dominical", texto: "Turmas, professores e chamada por domingo. Superintendente vê tudo; professora vê só a sua classe." },
    { icon: Wallet, titulo: "Financeiro e dízimos", texto: "Entradas e saídas por mês, por sociedade ou pelo conselho. Saldo e gráficos sem planilha." },
    { icon: ClipboardCheck, titulo: "Presença em cultos e eventos", texto: "Marque presença rápido e acompanhe quem está se afastando — sinal para o cuidado pastoral." },
    { icon: Megaphone, titulo: "Avisos e comunicação", texto: "Comunicados que chegam ao celular de cada membro, no lugar do mural que ninguém lê." },
    { icon: BarChart3, titulo: "Relatórios", texto: "Crescimento, frequência, perfil da congregação e finanças — prontos para a assembleia." },
    { icon: BookMarked, titulo: "Painel do Pastor", texto: "Diário de visitas e atividades, com registros confidenciais que só o pastor enxerga." },
  ]

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#07110b", color: "#fff", minHeight: "100vh" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        @keyframes mfade { from { opacity:0; transform: translateY(16px);} to { opacity:1; transform: translateY(0);} }
        .m-serif { font-family: 'Playfair Display', serif; }
        .m-card { transition: transform .18s, border-color .18s, background .18s; }
        .m-card:hover { transform: translateY(-3px); border-color: rgba(74,222,128,.35); background: rgba(74,222,128,.04); }
        .m-btn { transition: transform .15s, box-shadow .2s, background .2s; }
        .m-btn:hover { transform: translateY(-1px); background: #fffdf8 !important; box-shadow: 0 8px 22px rgba(0,0,0,.28); }
      `}} />

      {/* NAV */}
      <header className="flex items-center justify-between px-6 md:px-12 h-16 border-b border-white/10 sticky top-0 z-30" style={{ background: "rgba(7,17,11,.85)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: "#15803d" }}>
            <Church size={15} className="text-white" />
          </div>
          <span className="m-serif text-lg font-bold tracking-tight">Membresia</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm text-white/55">
          <Link href="/funcionalidades" className="hover:text-white transition">Funcionalidades</Link>
          <Link href="/precos" className="hover:text-white transition">Preços</Link>
          <Link href="/sobre" className="hover:text-white transition">Sobre</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/sign-in" className="text-sm text-white/60 hover:text-white transition px-3 py-2">Entrar</Link>
          <a href={demoLoginUrl} className="m-btn text-sm font-semibold px-4 py-2 rounded-lg" style={{ background: "#f5f0e8", color: "#0b3d24" }}>
            Experimentar
          </a>
        </div>
      </header>

      {/* HERO — texto à esquerda, mosaico de fotos à direita */}
      <section className="px-6 md:px-12 lg:px-16 pt-16 pb-24">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-12 xl:gap-16 items-center max-w-7xl mx-auto">
          {/* Texto */}
          <div className="max-w-2xl" style={{ animation: "mfade .5s ease both" }}>
            <div className="flex items-center gap-3 mb-7">
              <span className="h-px w-8" style={{ background: "rgba(74,222,128,.55)" }} />
              <span className="text-white/45 text-sm">Sistema de gestão para igrejas</span>
            </div>
            <h1 className="m-serif font-semibold tracking-[-0.02em]" style={{ fontSize: "clamp(2.6rem,5.2vw,4.6rem)", lineHeight: 1.02 }}>
              A secretaria da sua igreja em um só lugar.
            </h1>
            <p className="text-white/55 text-lg leading-relaxed mt-7 max-w-xl">
              Membros, sociedades, Escola Bíblica, finanças, presença e comunicação — organizados
              do jeito que uma igreja funciona de verdade, com conselho, diaconia e as sociedades internas.
            </p>
            <div className="flex flex-wrap items-center gap-6 mt-10">
              <a href={demoLoginUrl} className="m-btn font-semibold px-7 py-3.5 rounded-lg" style={{ background: "#f5f0e8", color: "#0b3d24" }}>
                Experimentar o sistema
              </a>
              <Link href="/precos" className="text-white/70 hover:text-white transition underline underline-offset-4 decoration-white/25 hover:decoration-white/70">
                Ver planos
              </Link>
            </div>
            <p className="text-white/35 text-sm mt-6 max-w-md">
              Você entra com uma conta de teste e navega com dados de exemplo — é só para conhecer.
            </p>
          </div>

          {/* Grid preenchendo o campo — igrejas tradicionais + pessoas na igreja, com degradê */}
          <div
            className="hidden md:block relative rounded-2xl overflow-hidden mt-6 lg:mt-0 h-[520px] lg:h-[620px]"
            style={{ animation: "mfade .7s ease both" }}
          >
            <div className="grid grid-cols-2 grid-rows-3 gap-1.5 h-full">
              {/* eslint-disable @next/next/no-img-element */}
              {[
                { id: "1438032005730-c779502df39b", alt: "Interior de igreja com vitrais" },
                { id: "1478147427282-58a87a120781", alt: "Mãos levantadas em oração" },
                { id: "1529070538774-1843cb3265df", alt: "Congregação durante o culto" },
                { id: "1473177104440-ffee2f376098", alt: "Interior de igreja tradicional" },
                { id: "1507692049790-de58290a4334", alt: "Pessoas em adoração" },
                { id: "1516550893923-42d28e5677af", alt: "Igreja vista da cidade" },
              ].map((img) => (
                <img
                  key={img.id}
                  src={`https://images.unsplash.com/photo-${img.id}?w=600&q=80`}
                  alt={img.alt}
                  className="w-full h-full object-cover"
                />
              ))}
              {/* eslint-enable @next/next/no-img-element */}
            </div>
            {/* Degradê por cima — mescla com o fundo e deixa as fotos discretas */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(90deg, #07110b 0%, rgba(7,17,11,0) 42%)," +
                  "linear-gradient(180deg, rgba(7,17,11,0) 58%, #07110b 100%)," +
                  "rgba(7,17,11,0.38)",
              }}
            />
          </div>
        </div>
      </section>

      {/* MÓDULOS */}
      <section className="px-6 md:px-12 py-16 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-12">
            <h2 className="m-serif text-3xl md:text-4xl font-bold">Tudo o que a igreja precisa acompanhar</h2>
            <p className="text-white/55 mt-3 leading-relaxed">
              Cada módulo foi pensado a partir de como uma igreja funciona de verdade — com conselho, diaconia,
              sociedades e Escola Dominical.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {modulos.map(({ icon: Icon, titulo, texto }) => (
              <div key={titulo} className="m-card rounded-2xl border border-white/10 p-6" style={{ background: "rgba(255,255,255,.02)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(34,197,94,.12)" }}>
                  <Icon size={19} className="text-green-400" />
                </div>
                <h3 className="font-semibold text-[15px] mb-1.5">{titulo}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PERFIS / ACESSOS */}
      <section className="px-6 md:px-12 py-16 border-t border-white/10">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="m-serif text-3xl md:text-4xl font-bold leading-tight">Cada pessoa vê o que é dela</h2>
            <p className="text-white/55 mt-4 leading-relaxed">
              O pastor, o tesoureiro, a presidente da SAF e a professora da EBD não precisam da mesma tela.
              O Membresia entrega o acesso certo para cada função — nada de tudo na mão de uma pessoa.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {[
              "Administração com visão completa da igreja",
              "Pastor com diário de visitas e relatórios",
              "Líderes de sociedade gerindo o próprio grupo",
              "Superintendente e professoras na Escola Bíblica",
              "Membro com sua agenda, avisos e aniversariantes",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-xl border border-white/10 px-4 py-3.5" style={{ background: "rgba(255,255,255,.02)" }}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(34,197,94,.18)" }}>
                  <Check size={12} className="text-green-400" />
                </span>
                <span className="text-white/80 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="px-6 md:px-12 py-20 border-t border-white/10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="m-serif text-3xl md:text-4xl font-bold">Veja por dentro antes de decidir</h2>
          <p className="text-white/55 mt-4 leading-relaxed">
            Entre no ambiente de demonstração e navegue como se fosse a sua igreja. Quando fizer sentido,
            a gente configura o espaço da sua congregação.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 mt-9">
            <a href={demoLoginUrl} className="m-btn font-semibold px-7 py-3.5 rounded-lg" style={{ background: "#f5f0e8", color: "#0b3d24" }}>
              Experimentar o sistema
            </a>
            <Link href="/contato" className="text-white/70 hover:text-white transition underline underline-offset-4 decoration-white/25 hover:decoration-white/70">
              Falar com a gente
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-6 md:px-12 py-8 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-white/40">
          <span className="m-serif text-white/70 font-bold">Membresia</span>
          <span>Gestão de igrejas · feito com cuidado, não com pressa.</span>
        </div>
      </footer>
    </div>
  )
}
