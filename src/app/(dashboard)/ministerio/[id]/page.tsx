import { currentUser } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import Announcements from "@/components/Announcements"
import EventCalendarContainer from "@/components/EventCalendarContainer"
import prisma from "@/lib/prisma"
import Image from "next/image"
import Link from "next/link"
import { Users, Calendar, FileText, ArrowLeft, Phone, ChevronRight, Clock, Cake } from "lucide-react"

const mesesPT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]

// Paleta ciclica para os cards — cada ministério recebe uma cor pelo seu id
const palette = [
  { accent: "#6366f1", light: "#eef2ff", dark: "#1e1b4b" },
  { accent: "#16a34a", light: "#f0fdf4", dark: "#14532d" },
  { accent: "#d97706", light: "#fffbeb", dark: "#78350f" },
  { accent: "#db2777", light: "#fdf2f8", dark: "#831843" },
  { accent: "#0d9488", light: "#f0fdfa", dark: "#134e4a" },
  { accent: "#7c3aed", light: "#f5f3ff", dark: "#2e1065" },
  { accent: "#ea580c", light: "#fff7ed", dark: "#7c2d12" },
  { accent: "#0284c7", light: "#f0f9ff", dark: "#0c4a6e" },
]

async function getMinistryData(id: number, userId: string) {
  const ministry = await prisma.ministry.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          member: {
            select: { id: true, name: true, phone: true, gender: true, isActive: true, birthDate: true },
          },
        },
      },
    },
  })

  if (!ministry) return null

  const now = new Date()

  const birthdaysThisMonth = ministry.members
    .filter((mm) => mm.member.birthDate)
    .filter((mm) => new Date(mm.member.birthDate!).getMonth() === now.getMonth())
    .sort((a, b) => new Date(a.member.birthDate!).getDate() - new Date(b.member.birthDate!).getDate())

  const totalDocuments = await prisma.document.count({ where: { ministryId: id } })

  return { ministry, birthdaysThisMonth, totalDocuments }
}

const MinistryPage = async ({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { [key: string]: string | undefined }
}) => {
  const user = await currentUser()
  if (!user) notFound()

  const roles = (user?.publicMetadata?.roles as string[]) ?? []
  const isSuperAdmin = roles.includes("superadmin")
  const isAdmin = roles.includes("admin") || isSuperAdmin

  const ministryId = parseInt(params.id)
  if (isNaN(ministryId)) notFound()

  const data = await getMinistryData(ministryId, user.id)
  if (!data) notFound()

  const { ministry, birthdaysThisMonth, totalDocuments } = data

  // Verifica se o usuário é membro deste ministério (ou admin)
  // Busca o membro pelo clerkId ou email
  const memberRecord = await prisma.member.findFirst({
    where: { email: user.emailAddresses[0]?.emailAddress },
    include: { ministries: true },
  })

  const isMember = memberRecord?.ministries.some((mm) => mm.ministryId === ministryId)

  if (!isSuperAdmin && !isAdmin && !isMember) notFound()

  const backHref = isAdmin ? "/admin" : "/member"

  // Cor baseada no id do ministério (ciclica)
  const pal = palette[(ministryId - 1) % palette.length]
  const ac = pal.accent
  const al = pal.light
  const ad = pal.dark

  const hoje = new Date()
  const mesAtual = mesesPT[hoje.getMonth()]

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        .rp { font-family: 'DM Sans', sans-serif; }
        @keyframes rp-in { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .rp-in { animation: rp-in 0.4s cubic-bezier(.22,1,.36,1) both; }
        .d1{animation-delay:.03s}.d2{animation-delay:.08s}.d3{animation-delay:.13s}.d4{animation-delay:.18s}.d5{animation-delay:.23s}.d6{animation-delay:.28s}
        .ql-btn { transition: box-shadow .15s, transform .15s; }
        .ql-btn:hover { box-shadow: 0 4px 14px rgba(0,0,0,.1); transform: translateY(-1px); }
        .m-row:hover { background: rgba(0,0,0,0.03); }
        .bday-card { transition: box-shadow .15s, transform .15s; }
        .bday-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.08); transform: translateY(-1px); }
      `}} />

      <div className="rp bg-gray-50 min-h-screen">

        {/* HERO */}
        <div className="rp-in d1" style={{ background: ad }}>
          <div className="px-6 md:px-10 pt-6 pb-10">
            <Link href={backHref}
              className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs transition mb-8">
              <ArrowLeft size={13} /> Voltar
            </Link>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h1 className="text-white font-bold leading-[0.9]" style={{ fontSize: "clamp(2.5rem,8vw,5rem)" }}>
                  {ministry.name}
                </h1>
                <p className="text-white/40 text-sm mt-3 font-light">Ministério da Igreja</p>
              </div>

              <div className="flex divide-x divide-white/10 overflow-hidden rounded-xl" style={{ background: "rgba(255,255,255,0.06)" }}>
                {[
                  { n: ministry.members.length, l: "Membros" },
                  { n: totalDocuments,           l: "Docs"    },
                ].map((s, i) => (
                  <div key={i} className="px-6 py-4 text-center">
                    <p className="text-white text-2xl font-semibold leading-none">{s.n}</p>
                    <p className="text-white/35 text-[10px] mt-1.5 tracking-wide">{s.l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ height: 2, background: `linear-gradient(90deg, ${ac}, ${ac}55, transparent)` }} />
        </div>

        {/* BODY */}
        <div className="p-4 md:p-6 flex gap-6 flex-col lg:flex-row">
          <div className="w-full lg:w-2/3 flex flex-col gap-8">

            {/* QUICK LINKS */}
            <div className="grid grid-cols-2 gap-3 rp-in d2">
              {[
                { label: "Membros",    icon: Users,    href: `/ministerio/${ministryId}/membros` },
                { label: "Documentos", icon: FileText,  href: `/list/documents?ministryId=${ministryId}&roleContext=ministerio` },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <Link key={item.label} href={item.href}
                    className="ql-btn bg-white rounded-xl py-4 flex flex-col items-center gap-2 border border-gray-100 shadow-sm">
                    <Icon size={18} style={{ color: ac }} />
                    <span className="text-xs font-medium text-gray-500">{item.label}</span>
                  </Link>
                )
              })}
            </div>

            {/* ANIVERSARIANTES DO MÊS */}
            {birthdaysThisMonth.length > 0 && (
              <section className="rp-in d3">
                <div className="flex items-center gap-2.5 mb-5">
                  <span className="w-0.5 h-5 rounded-full block" style={{ background: ac }} />
                  <h2 className="text-xl font-semibold text-gray-900">Aniversariantes</h2>
                  <span className="text-xs text-gray-400 ml-1">— {mesAtual}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {birthdaysThisMonth.map((mm) => {
                    const bd = new Date(mm.member.birthDate!)
                    const dia = bd.getDate()
                    const isHoje = bd.getDate() === hoje.getDate() && bd.getMonth() === hoje.getMonth()

                    return (
                      <div key={mm.id}
                        className={`bday-card rounded-xl p-3 flex flex-col items-center gap-2 border text-center relative overflow-hidden
                          ${isHoje ? "bg-pink-50 border-pink-200 shadow-sm" : "bg-white border-gray-100 shadow-sm"}`}>
                        {isHoje && (
                          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${ac}, #f472b6)` }} />
                        )}
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg text-white shadow-sm"
                          style={{ background: isHoje ? "#f472b6" : ac }}>
                          {dia}
                        </div>
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 ring-2 ring-white shadow-sm">
                          <Image src="/profile.png" alt={mm.member.name} width={48} height={48} className="object-cover" />
                        </div>
                        <p className="text-xs font-semibold text-gray-800 leading-snug line-clamp-2">
                          {mm.member.name.split(" ")[0]}
                        </p>
                        {isHoje && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-pink-600 bg-pink-100 px-2 py-0.5 rounded-full">
                            <Cake size={9} /> Hoje!
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* MEMBROS */}
            <section className="rp-in d4">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <span className="w-0.5 h-5 rounded-full block" style={{ background: ac }} />
                  <h2 className="text-xl font-semibold text-gray-900">Membros</h2>
                  <span className="text-xs text-gray-400 ml-1">— {ministry.members.length} no total</span>
                </div>
                <Link href={`/ministerio/${ministryId}/membros`} className="text-xs flex items-center gap-1" style={{ color: ac }}>
                  Ver todos <ChevronRight size={11} />
                </Link>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {ministry.members.length === 0 ? (
                  <p className="p-8 text-center text-gray-400 text-sm">Nenhum membro neste ministério.</p>
                ) : (
                  ministry.members.map((mm, i) => (
                    <div key={mm.id}
                      className={`m-row flex items-center gap-3 px-5 py-3.5 transition-colors ${i < ministry.members.length - 1 ? "border-b border-gray-50" : ""}`}>
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                        <Image src="/profile.png" alt={mm.member.name} width={32} height={32} className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{mm.member.name}</p>
                        {mm.member.phone && (
                          <a href={`tel:${mm.member.phone}`} className="text-xs text-gray-400 flex items-center gap-1 hover:text-gray-600 transition mt-0.5">
                            <Phone size={9} />{mm.member.phone}
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                          style={{
                            background: mm.member.gender === "MASCULINO" ? "#eff6ff" : mm.member.gender === "FEMININO" ? "#fdf2f8" : "#f3f4f6",
                            color:      mm.member.gender === "MASCULINO" ? "#1d4ed8" : mm.member.gender === "FEMININO" ? "#be185d"  : "#9ca3af",
                          }}>
                          {mm.member.gender === "MASCULINO" ? "M" : mm.member.gender === "FEMININO" ? "F" : "—"}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          mm.member.isActive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
                        }`}>
                          {mm.member.isActive ? "Ativo" : "Inativo"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

          </div>

          {/* SIDEBAR */}
          <div className="w-full lg:w-1/3 flex flex-col gap-6">
            <EventCalendarContainer searchParams={searchParams} />
            <Announcements />
          </div>
        </div>
      </div>
    </>
  )
}

export default MinistryPage