import { currentUser } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import prisma from "@/lib/prisma"
import { ArrowLeft, Users, FileText, ChevronRight, Layers } from "lucide-react"
import MinistryClient from "./MinistryClient"

const ac = "#16a34a"
const ad = "#14532d"
const al = "#f0fdf4"

export default async function MinisterioPage() {
  const user = await currentUser()
  const roles = (user?.publicMetadata?.roles as string[]) ?? []
  const isSuperAdmin = roles.includes("superadmin")

  if (!isSuperAdmin && !roles.includes("ministerio")) {
    notFound()
  }

  const isAdmin = roles.includes("admin") || isSuperAdmin
  const backHref = isAdmin ? "/admin" : "/member"

  // Busca todos os ministérios com contagem de membros e documentos
  const ministries = await prisma.ministry.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          members: true,
          documents: true,
          albums: true,
        },
      },
    },
  })

  const totalMembers = await prisma.member.count({
    where: { ministries: { some: {} } },
  })

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        .mp { font-family: 'DM Sans', sans-serif; }
        @keyframes mp-in { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .mp-in { animation: mp-in 0.4s cubic-bezier(.22,1,.36,1) both; }
        .d1{animation-delay:.03s}.d2{animation-delay:.08s}.d3{animation-delay:.13s}
      ` }} />

      <div className="mp bg-gray-50 min-h-screen">
        {/* HERO */}
        <div style={{ background: ad }}>
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
                <p className="text-white/40 text-sm mt-3 font-light">Ministérios da Igreja</p>
              </div>
              <div className="flex divide-x divide-white/10 overflow-hidden rounded-xl" style={{ background: "rgba(255,255,255,0.06)" }}>
                {[
                  { n: ministries.length, l: "Ministérios" },
                  { n: totalMembers,      l: "Membros" },
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
        <div className="p-4 md:p-6">
          <MinistryClient
            ministries={ministries.map(m => ({
              id: m.id,
              name: m.name,
              membersCount: m._count.members,
              documentsCount: m._count.documents,
              albumsCount: m._count.albums,
            }))}
          />
        </div>
      </div>
    </>
  )
}