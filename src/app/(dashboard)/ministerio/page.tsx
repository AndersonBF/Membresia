import { currentUser } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import Link from "next/link"
import { ArrowLeft, Users, ChevronRight } from "lucide-react"
import Image from "next/image"

const ac = "#16a34a"
const al = "#f0fdf4"
const ad = "#14532d"

const ministryPalette = [
  { accent: "#6366f1", light: "#eef2ff", dark: "#1e1b4b" },
  { accent: "#16a34a", light: "#f0fdf4", dark: "#14532d" },
  { accent: "#d97706", light: "#fffbeb", dark: "#78350f" },
  { accent: "#db2777", light: "#fdf2f8", dark: "#831843" },
  { accent: "#0d9488", light: "#f0fdfa", dark: "#134e4a" },
  { accent: "#7c3aed", light: "#f5f3ff", dark: "#2e1065" },
  { accent: "#ea580c", light: "#fff7ed", dark: "#7c2d12" },
  { accent: "#0284c7", light: "#f0f9ff", dark: "#0c4a6e" },
]

const MinistriesPage = async () => {
  const user = await currentUser()
  if (!user) notFound()

  const roles = (user.publicMetadata?.roles as string[]) ?? []
  const isSuperAdmin = roles.includes("superadmin")
  const isAdmin = roles.includes("admin") || isSuperAdmin

  const backHref = isAdmin ? "/admin" : "/member"

  // Admin vê todos; membro vê só os seus
  let ministries
  if (isAdmin) {
    ministries = await prisma.ministry.findMany({
      orderBy: { name: "asc" },
      include: { members: { include: { member: { select: { id: true, name: true } } } } },
    })
  } else {
    const email = user.emailAddresses[0]?.emailAddress
    const member = await prisma.member.findFirst({
      where: { email },
      include: {
        ministries: {
          include: {
            ministry: {
              include: { members: { include: { member: { select: { id: true, name: true } } } } },
            },
          },
        },
      },
    })
    ministries = member?.ministries.map((mm) => mm.ministry) ?? []
  }

  if (!ministries.length) notFound()

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        .rp { font-family: 'DM Sans', sans-serif; }
        @keyframes rp-in { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .rp-in { animation: rp-in 0.4s cubic-bezier(.22,1,.36,1) both; }
        .d1{animation-delay:.03s}.d2{animation-delay:.08s}.d3{animation-delay:.13s}.d4{animation-delay:.18s}.d5{animation-delay:.23s}.d6{animation-delay:.28s}
        .min-card { transition: box-shadow .2s, transform .2s; }
        .min-card:hover { box-shadow: 0 8px 28px rgba(0,0,0,.1); transform: translateY(-3px); }
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
                <h1 className="text-white font-bold leading-[0.9]" style={{ fontSize: "clamp(3.5rem,9vw,6rem)" }}>
                  Ministérios
                </h1>
                <p className="text-white/40 text-sm mt-3 font-light">Ministério de Louvor e Adoração</p>
              </div>
              <div className="flex divide-x divide-white/10 overflow-hidden rounded-xl" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div className="px-6 py-4 text-center">
                  <p className="text-white text-2xl font-semibold leading-none">{ministries.length}</p>
                  <p className="text-white/35 text-[10px] mt-1.5 tracking-wide">Grupos</p>
                </div>
                <div className="px-6 py-4 text-center">
                  <p className="text-white text-2xl font-semibold leading-none">
                    {ministries.reduce((acc, m) => acc + m.members.length, 0)}
                  </p>
                  <p className="text-white/35 text-[10px] mt-1.5 tracking-wide">Membros</p>
                </div>
              </div>
            </div>
          </div>
          <div style={{ height: 2, background: `linear-gradient(90deg, ${ac}, ${ac}55, transparent)` }} />
        </div>

        {/* GRID DE MINISTÉRIOS */}
        <div className="p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 rp-in d2">
            {ministries.map((ministry, idx) => {
              const pal = ministryPalette[(ministry.id - 1) % ministryPalette.length]
              const avatarList = ministry.members.slice(0, 5)
              const extra = ministry.members.length - 5

              return (
                <Link
                  key={ministry.id}
                  href={`/ministerio/${ministry.id}`}
                  className="min-card bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col"
                >
                  {/* Topo colorido com barra */}
                  <div className="h-1.5 w-full" style={{ background: pal.accent }} />

                  <div className="p-5 flex flex-col gap-4 flex-1">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: pal.light }}
                      >
                        <Users size={20} style={{ color: pal.accent }} />
                      </div>
                      <div
                        className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full"
                        style={{ background: pal.light, color: pal.accent }}
                      >
                        {ministry.members.length} membro{ministry.members.length !== 1 ? "s" : ""}
                      </div>
                    </div>

                    {/* Nome */}
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg leading-tight">{ministry.name}</h3>
                    </div>

                    {/* Avatares empilhados */}
                    {ministry.members.length > 0 && (
                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
                        <div className="flex -space-x-2">
                          {avatarList.map((mm, i) => (
                            <div
                              key={mm.id}
                              className="w-7 h-7 rounded-full overflow-hidden border-2 border-white bg-gray-100"
                              style={{ zIndex: avatarList.length - i }}
                              title={mm.member.name}
                            >
                              <Image src="/profile.png" alt={mm.member.name} width={28} height={28} className="object-cover" />
                            </div>
                          ))}
                          {extra > 0 && (
                            <div
                              className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold"
                              style={{ background: pal.light, color: pal.accent, zIndex: 0 }}
                            >
                              +{extra}
                            </div>
                          )}
                        </div>
                        <span className="flex items-center gap-1 text-xs font-medium" style={{ color: pal.accent }}>
                          Ver <ChevronRight size={12} />
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}

export default MinistriesPage