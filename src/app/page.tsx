import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import Link from "next/link"
import fs from "fs"
import path from "path"
import prisma from "@/lib/prisma"
import ChurchPresentation from "@/components/public/ChurchPresentation"
import VisitForm from "@/components/public/VisitForm"
import HeroCarousel from "@/components/public/HeroCarousel"
import MembresiaLanding from "@/components/public/MembresiaLanding"
import { getCurrentSubdomain, } from "@/lib/tenant-server"
import { getDemoTenants } from "@/lib/tenant"
import { ChevronDown } from "lucide-react"

export const dynamic = "force-dynamic"

const groupRoles = ["ump", "upa", "uph", "saf", "ucp", "diaconia", "conselho", "ministerio", "ebd"]

// Lê TODAS as imagens da pasta public/carrossel — qualquer arquivo colocado lá
// aparece automaticamente no carrossel.
function getCarouselSlides() {
  try {
    const dir = path.join(process.cwd(), "public", "carrossel")
    return fs
      .readdirSync(dir)
      .filter((f) => /\.(jpe?g|png|webp|gif|avif)$/i.test(f))
      .sort()
      .map((f) => ({ url: `/carrossel/${encodeURIComponent(f)}`, caption: null }))
  } catch {
    return []
  }
}

// Detecta um logo da IPB em public/ (use um destes nomes de arquivo). Aparece
// como marca d'água no fundo do hero. Se nenhum existir, mostra só o degradê.
function findLogo() {
  const candidates = ["ipb-logo.png", "ipb-logo.svg", "ipb.png", "ipb.svg", "logo-ipb.png"]
  for (const c of candidates) {
    try {
      if (fs.existsSync(path.join(process.cwd(), "public", c))) return `/${c}`
    } catch {}
  }
  return null
}

export default async function RootPage() {
  const { userId, sessionClaims } = await auth()

  // ── Logado: mantém os redirects por papel ──
  if (userId) {
    const roles = (sessionClaims?.metadata as { roles?: string[] })?.roles ?? []
    if (roles.includes("pastor")) redirect("/pastor")
    if (roles.includes("superadmin") || roles.includes("admin")) redirect("/admin")
    const firstGroup = roles.find((r) => groupRoles.includes(r))
    if (firstGroup) redirect(`/${firstGroup}`)
    redirect("/member")
  }

  // ── Subdomínio de demonstração → homepage do produto Membresia ──
  const sub = getCurrentSubdomain()
  if (sub && getDemoTenants().includes(sub)) {
    return <MembresiaLanding />
  }

  // ── Deslogado: home pública (visitante da igreja) ──
  const settings = await prisma.churchSettings.findFirst({ select: { whatsapp: true, phone: true } })
  const whatsapp = settings?.whatsapp || settings?.phone || "554530546767"
  const slides = getCarouselSlides()
  const logo = findLogo()

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        @keyframes fadeUp { from { opacity:0; transform: translateY(16px);} to {opacity:1; transform:translateY(0);} }
        @keyframes floatDown { 0%,100%{ transform: translateY(0);} 50%{ transform: translateY(6px);} }
      `}} />

      {/* ── HERO: tela dividida ao meio ── */}
      <section className="min-h-screen grid lg:grid-cols-2">
        {/* ESQUERDA: apresentação */}
        <div
          className="relative flex flex-col px-6 md:px-12 py-6 overflow-hidden"
          style={{ background: "linear-gradient(150deg, #0c3d22 0%, #14532d 45%, #166534 100%)" }}
        >
          {/* logo da IPB grande no fundo — metade saindo pela esquerda, com degradê na própria logo */}
          {logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo}
              alt=""
              aria-hidden
              className="pointer-events-none select-none absolute top-1/2"
              style={{
                left: 0,
                transform: "translate(-38%, -50%)",
                width: "clamp(820px, 125vw, 1600px)",
                filter: "brightness(0) invert(1)",       // logo em branco
                opacity: 0.14,
                // degradê na logo: some da esquerda para a direita
                WebkitMaskImage: "linear-gradient(to right, #000 0%, #000 40%, transparent 82%)",
                maskImage: "linear-gradient(to right, #000 0%, #000 40%, transparent 82%)",
              }}
            />
          )}

          <header className="relative z-10">
            <span className="text-white font-semibold tracking-wide">IPB Toledo</span>
          </header>

          {/* centro: chamada */}
          <div className="relative z-10 flex-1 flex flex-col justify-center py-12 max-w-xl" style={{ animation: "fadeUp 0.5s ease both" }}>
            <p className="text-green-200/70 text-xs font-semibold uppercase tracking-[2.5px] mb-4">
              Desde 1996 · Toledo, Paraná
            </p>
            <h1
              className="text-white font-bold leading-[1.05] mb-6"
              style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2.4rem,5vw,4rem)" }}
            >
              Igreja Presbiteriana<br />de Toledo
            </h1>
            <p className="text-white/60 text-base md:text-lg leading-relaxed mb-9">
              Confessionais, Reformados e centrados na Bíblia Sagrada. Venha nos conhecer —
              você e sua família serão muito bem-vindos. 💚
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <VisitForm whatsapp={whatsapp} />
              <a
                href="#sobre"
                className="inline-flex items-center gap-2 text-white/80 hover:text-white border border-white/20 hover:border-white/40 px-6 py-3 rounded-xl text-sm font-medium transition"
              >
                Ver horários de culto
              </a>
            </div>

            {/* login abaixo dos CTAs */}
            <p className="text-white/70 text-lg mt-7">
              Você já é membro?{" "}
              <Link
                href="/sign-in"
                className="text-white font-semibold underline underline-offset-4 decoration-2 decoration-green-400/70 hover:decoration-white transition"
              >
                Entre
              </Link>
            </p>
          </div>

          {/* seta descer */}
          <a href="#sobre" className="hidden lg:flex justify-start text-white/40 hover:text-white/70 transition pb-2">
            <ChevronDown size={22} style={{ animation: "floatDown 1.8s ease-in-out infinite" }} />
          </a>
        </div>

        {/* DIREITA: carrossel grande (full-bleed) */}
        <div className="relative min-h-[55vh] lg:min-h-screen bg-green-950">
          <HeroCarousel images={slides} />
        </div>
      </section>

      {/* ── Apresentação completa da igreja (sem o versículo) ── */}
      <div id="sobre">
        <ChurchPresentation showHero={false} showVerse={false} />
      </div>
    </div>
  )
}
