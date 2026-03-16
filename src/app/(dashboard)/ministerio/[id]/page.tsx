// src/app/(dashboard)/ministerio/[id]/page.tsx
import { currentUser } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowLeft, Users, FileText, ChevronRight, Phone,
  BookOpen, Megaphone, Heart, Mic2, Baby, Globe, HandHelping, Star
} from "lucide-react"

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

export default async function MinistryDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const user = await currentUser()
  const roles = (user?.publicMetadata?.roles as string[]) ?? []
  const isSuperAdmin = roles.includes("superadmin")
  const isAdmin = roles.includes("admin") || isSuperAdmin

  if (!isSuperAdmin && !isAdmin && !roles.includes("ministerio")) {
    notFound()
  }

  const id = parseInt(params.id)
  if (isNaN(id)) notFound()

  const ministry = await prisma.ministry.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          member: {
            select: {
              id: true,
              name: true,
              phone: true,
              gender: true,
              isActive: true,
              profileImageUrl: true,
            },
          },
        },
      },
      documents: {
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, fileUrl: true, createdAt: true },
      },
    },
  })

  if (!ministry) notFound()

  const Icon = getMinistryIcon(ministry.name)
  const members = ministry.members.map(mm => mm.member)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        .rp { font-family: 'DM Sans', sans-serif; }
        @keyframes rp-in { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .rp-in { animation: rp-in 0.4s cubic-bezier(.22,1,.36,1) both; }
        .d1{animation-delay:.03s}.d2{animation-delay:.08s}.d3{animation-delay:.13s}
      `}} />

      <div className="rp bg-gray-50 min-h-screen">

        {/* HERO */}
        <div className="rp-in d1" style={{ background: ad }}>
          <div className="px-6 md:px-10 pt-6 pb-10">
            <Link href="/ministerio"
              className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs transition mb-8">
              <ArrowLeft size={13} /> Voltar para Ministérios
            </Link>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)" }}>
                <Icon size={26} className="text-white" />
              </div>
              <div>
                <p className="text-white/40 text-xs uppercase tracking-widest mb-1 font-light">Ministério</p>
                <h1 className="text-white font-bold text-3xl md:text-4xl">{ministry.name}</h1>
              </div>
            </div>
            <div className="flex gap-6 mt-6">
              <div>
                <p className="text-white text-xl font-semibold">{members.length}</p>
                <p className="text-white/40 text-xs mt-0.5">Membros</p>
              </div>
              <div>
                <p className="text-white text-xl font-semibold">{ministry.documents.length}</p>
                <p className="text-white/40 text-xs mt-0.5">Documentos</p>
              </div>
            </div>
          </div>
          <div style={{ height: 2, background: `linear-gradient(90deg, ${ac}, ${ac}55, transparent)` }} />
        </div>

        {/* BODY */}
        <div className="p-4 md:p-6 flex flex-col gap-6">

          {/* MEMBROS */}
          <section className="rp-in d2">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Users size={14} style={{ color: ac }} /> Membros ({members.length})
            </h2>
            {members.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 text-center py-12 text-gray-400 text-sm">
                Nenhum membro neste ministério
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {members.map((m, i) => (
                  <div key={m.id}
                    className={`flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition ${i < members.length - 1 ? "border-b border-gray-50" : ""}`}>
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                      <Image
                        src={m.profileImageUrl ?? "/profile.png"}
                        alt={m.name} width={36} height={36} className="object-cover w-full h-full" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{m.name}</p>
                      {m.phone && (
                        <a href={`tel:${m.phone}`} className="text-xs text-gray-400 flex items-center gap-1 hover:text-gray-600 transition mt-0.5">
                          <Phone size={9} />{m.phone}
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                        style={{
                          background: m.gender === "MASCULINO" ? "#eff6ff" : m.gender === "FEMININO" ? "#fdf2f8" : "#f3f4f6",
                          color: m.gender === "MASCULINO" ? "#1d4ed8" : m.gender === "FEMININO" ? "#be185d" : "#9ca3af",
                        }}>
                        {m.gender === "MASCULINO" ? "M" : m.gender === "FEMININO" ? "F" : "—"}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${m.isActive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                        {m.isActive ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* DOCUMENTOS */}
          <section className="rp-in d3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <FileText size={14} style={{ color: ac }} /> Documentos ({ministry.documents.length})
            </h2>
            {ministry.documents.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 text-center py-12 text-gray-400 text-sm">
                Nenhum documento neste ministério
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {ministry.documents.map((doc, i) => (
                  <a key={doc.id} href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                    className={`flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition ${i < ministry.documents.length - 1 ? "border-b border-gray-50" : ""}`}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: al }}>
                      <FileText size={16} style={{ color: ac }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{doc.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(doc.createdAt).toLocaleDateString("pt-BR")}</p>
                    </div>
                    <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
                  </a>
                ))}
              </div>
            )}
          </section>

        </div>
      </div>
    </>
  )
}