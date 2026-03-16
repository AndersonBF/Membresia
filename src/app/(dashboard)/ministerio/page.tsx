// src/app/(dashboard)/ministerio/page.tsx
import { currentUser } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Users, FileText, Layers, Calendar, ChevronRight, BookOpen, Megaphone, Heart, Mic2, Baby, Globe, HandHelping, Star } from "lucide-react"
import EventCalendarContainer from "@/components/EventCalendarContainer"
import Announcements from "@/components/Announcements"

const ac = "#16a34a"
const al = "#f0fdf4"
const ad = "#14532d"

function getMinistryIcon(name: string) {
  const n = name.toLowerCase()
  if (n.includes("louvor") || n.includes("adora") || n.includes("música") || n.includes("musica")) return Mic2
  if (n.includes("infant") || n.includes("crian")) return Baby
  if (n.includes("intercess") || n.includes("oração") || n.includes("oracao")) return Heart
  if (n.includes("comunic") || n.includes("mídia") || n.includes("midia") || n.includes("social")) return Globe
  if (n.includes("evange") || n.includes("missão") || n.includes("missao")) return Megaphone
  if (n.includes("diaconia") || n.includes("social") || n.includes("cuidado")) return HandHelping
  if (n.includes("ensino") || n.includes("discip") || n.includes("escola")) return BookOpen
  return Star
}

export default async function MinisterioPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined }
}) {
  const user = await currentUser()
  const roles = (user?.publicMetadata?.roles as string[]) ?? []
  const isSuperAdmin = roles.includes("superadmin")
  const isAdmin = roles.includes("admin") || isSuperAdmin

  if (!isSuperAdmin && !isAdmin && !roles.includes("ministerio")) {
    notFound()
  }

  const backHref = isAdmin ? "/admin" : "/member"

  // Dados da role ministerio
  const memberWhere = { ministries: { some: {} } }

  const [totalMembers, totalDocuments, recentMembers, upcomingEvents, ministries] = await Promise.all([
    prisma.member.count({ where: memberWhere }),
    prisma.document.count({ where: { ministryId: { not: null } } }),
    prisma.member.findMany({
      where: memberWhere,
      orderBy: { name: "asc" },
      take: 8,
      select: { id: true, name: true, gender: true, isActive: true, profileImageUrl: true },
    }),
    prisma.event.findMany({
      where: { date: { gte: new Date() }, isPublic: true },
      orderBy: { date: "asc" },
      take: 3,
    }),
    prisma.ministry.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { members: true, documents: true, albums: true } },
      },
    }),
  ])

  const mesesPT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"]

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        .rp { font-family: 'DM Sans', sans-serif; }
        @keyframes rp-in { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .rp-in { animation: rp-in 0.4s cubic-bezier(.22,1,.36,1) both; }
        .d1{animation-delay:.03s}.d2{animation-delay:.08s}.d3{animation-delay:.13s}.d4{animation-delay:.18s}
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
                <p className="text-white/40 text-xs uppercase tracking-widest mb-2 font-light">Área do Ministério</p>
                <h1 className="text-white font-bold leading-[0.9]" style={{ fontSize: "clamp(3rem,8vw,5rem)" }}>
                  Ministérios
                </h1>
              </div>
              <div className="flex divide-x divide-white/10 overflow-hidden rounded-xl" style={{ background: "rgba(255,255,255,0.06)" }}>
                {[
                  { n: ministries.length, l: "Ministérios" },
                  { n: totalMembers, l: "Membros" },
                  { n: totalDocuments, l: "Documentos" },
                ].map((s, i) => (
                  <div key={i} className="px-5 py-4 text-center">
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
        <div className="p-4 md:p-6 flex flex-col lg:flex-row gap-6">

          {/* LEFT */}
          <div className="flex-1 flex flex-col gap-6">

            {/* MINISTÉRIOS */}
            <section className="rp-in d2">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Ministérios</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ministries.map(m => {
                  const Icon = getMinistryIcon(m.name)
                  return (
                    <Link
                      key={m.id}
                      href={`/ministerio/${m.id}`}
                      className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-start gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: al }}>
                        <Icon size={18} style={{ color: ac }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{m.name}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Users size={10} /> {m._count.members}
                          </span>
                          {m._count.documents > 0 && (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <FileText size={10} /> {m._count.documents}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-gray-300 flex-shrink-0 mt-1" />
                    </Link>
                  )
                })}
                {ministries.length === 0 && (
                  <div className="col-span-2 text-center py-12 text-gray-400 text-sm">
                    Nenhum ministério cadastrado
                  </div>
                )}
              </div>
            </section>

            {/* MEMBROS RECENTES */}
            {recentMembers.length > 0 && (
              <section className="rp-in d3">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Membros</h2>
                  <Link href="/ministerio/membros" className="text-xs font-medium hover:underline" style={{ color: ac }}>
                    Ver todos
                  </Link>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  {recentMembers.map((m, i) => (
                    <div key={m.id}
                      className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition ${i < recentMembers.length - 1 ? "border-b border-gray-50" : ""}`}>
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                        <Image
                          src={m.profileImageUrl ?? "/profile.png"}
                          alt={m.name} width={32} height={32} className="object-cover w-full h-full" />
                      </div>
                      <p className="flex-1 text-sm font-medium text-gray-800 truncate">{m.name}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${m.isActive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                        {m.isActive ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* PRÓXIMOS EVENTOS */}
            {upcomingEvents.length > 0 && (
              <section className="rp-in d4">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Próximos Eventos</h2>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  {upcomingEvents.map((ev, i) => {
                    const d = new Date(ev.date)
                    return (
                      <div key={ev.id}
                        className={`flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition ev-row ${i < upcomingEvents.length - 1 ? "border-b border-gray-50" : ""}`}>
                        <div className="w-10 h-10 rounded-lg flex flex-col items-center justify-center flex-shrink-0 text-white text-center" style={{ background: ac }}>
                          <span className="text-[10px] font-medium leading-none">{mesesPT[d.getMonth()]}</span>
                          <span className="text-base font-bold leading-none mt-0.5">{d.getDate()}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-800 truncate">{ev.title}</p>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}
          </div>

          {/* SIDEBAR */}
          <div className="w-full lg:w-80 flex flex-col gap-6">
            <EventCalendarContainer searchParams={searchParams} />
            <Announcements />
          </div>
        </div>
      </div>
    </>
  )
}