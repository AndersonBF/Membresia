// src/components/MemberDrawerWrapper.tsx
"use client"

import { useState, useRef, useEffect } from "react"
import {
  X, Camera, Phone, Mail, Calendar, User, Hash,
  CheckCircle, XCircle, Loader2, Users, Shield,
  HandHelping, Layers, BookOpen, Eye,
} from "lucide-react"
import MemberAvatar from "@/components/MemberAvatar"
import Link from "next/link"

interface MemberBasic {
  id: number
  name: string
  username: string | null
  profileImageUrl: string | null
  gender: string | null
  isActive: boolean
  phone: string | null
  email: string | null
  birthDate: string | null
  createdAt: string
  societies: { societyId: number; cargo: string | null; society: { name: string } }[]
  council: { councilId: number } | null
  diaconate: { diaconateId: number } | null
  ministries: { ministry: { name: string } }[]
  bibleSchoolClass: { name: string } | null
}

interface DetailMember extends MemberBasic {
  attendances: { isPresent: boolean; event: { title: string; date: string } | null }[]
}

const accentMap: Record<string, string> = {
  ump: "#2563eb", upa: "#d97706", uph: "#ea580c", saf: "#db2777",
  ucp: "#f59e0b", diaconia: "#0d9488", conselho: "#4f46e5",
  ministerio: "#16a34a", ebd: "#b45309",
}

// ── Drawer ────────────────────────────────────────────────────────────────────

function MemberDrawer({
  member,
  isAdmin,
  accentColor,
  onClose,
  onPhotoUpdated,
}: {
  member: MemberBasic
  isAdmin: boolean
  accentColor: string
  onClose: () => void
  onPhotoUpdated: (id: number, url: string) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadOk, setUploadOk]   = useState(false)
  const [uploadErr, setUploadErr] = useState("")
  const [preview, setPreview]     = useState<string | null>(null)
  const [detail, setDetail]       = useState<DetailMember | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(true)

  useEffect(() => {
    setLoadingDetail(true)
    fetch(`/api/members/${member.id}`)
      .then(r => r.json())
      .then(d => setDetail(d))
      .catch(console.error)
      .finally(() => setLoadingDetail(false))
  }, [member.id])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setUploading(true); setUploadErr(""); setUploadOk(false)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch(`/api/members/${member.id}/upload-photo`, { method: "POST", body: fd })
      if (!res.ok) throw new Error((await res.json()).error ?? "Erro")
      const { url } = await res.json()
      onPhotoUpdated(member.id, url)
      setUploadOk(true)
      setTimeout(() => setUploadOk(false), 3000)
    } catch (err: any) {
      setUploadErr(err.message)
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  const data     = detail ?? member
  const photoUrl = preview ?? data.profileImageUrl
  const age      = data.birthDate
    ? Math.floor((Date.now() - new Date(data.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  const attendances  = detail?.attendances ?? []
  const totalPresent = attendances.filter(a => a.isPresent).length
  const presenceRate = attendances.length > 0
    ? Math.round((totalPresent / attendances.length) * 100) : null

  const groups = [
    ...data.societies.map(s => ({ label: s.society.name, sub: s.cargo, icon: Users, color: "bg-blue-100 text-blue-800" })),
    ...(data.council   ? [{ label: "Conselho", sub: null, icon: Shield,      color: "bg-indigo-100 text-indigo-800" }] : []),
    ...(data.diaconate ? [{ label: "Diaconia", sub: null, icon: HandHelping, color: "bg-teal-100 text-teal-800"    }] : []),
    ...data.ministries.map(m => ({ label: m.ministry.name, sub: null, icon: Layers, color: "bg-green-100 text-green-800" })),
    ...(data.bibleSchoolClass ? [{ label: data.bibleSchoolClass.name, sub: "EBD", icon: BookOpen, color: "bg-amber-100 text-amber-800" }] : []),
  ]

  return (
    <>
      <style>{`
        @keyframes drawer-in {
          from { transform: translateX(110%); }
          to   { transform: translateX(0); }
        }
      `}</style>

      <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col overflow-hidden"
        style={{ animation: "drawer-in 0.25s cubic-bezier(.22,1,.36,1)" }}>

        {/* header */}
        <div className="px-5 pt-5 pb-6 flex items-start gap-4 shrink-0" style={{ background: accentColor }}>
          <button onClick={onClose}
            className="mt-0.5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition shrink-0">
            <X size={16} />
          </button>

          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-white/30 bg-white/10">
              {photoUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={photoUrl} alt={data.name} className="w-full h-full object-cover" />
                : <MemberAvatar name={data.name} size={80} />
              }
              {uploading && (
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                  <Loader2 className="animate-spin text-white" size={20} />
                </div>
              )}
            </div>
            {isAdmin && (
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md disabled:opacity-50 transition hover:scale-110"
                style={{ color: accentColor }} title="Trocar foto">
                <Camera size={14} />
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>

          <div className="flex-1 min-w-0 mt-1">
            <h2 className="text-white font-bold text-lg leading-tight truncate">{data.name}</h2>
            {data.username && <p className="text-white/60 text-xs mt-0.5">@{data.username}</p>}
            <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
              data.isActive ? "bg-white/20 text-white" : "bg-red-400/30 text-white"
            }`}>
              {data.isActive ? "Ativo" : "Inativo"}
            </span>
          </div>
        </div>

        {(uploadOk || uploadErr) && (
          <div className={`px-5 py-2 text-xs flex items-center gap-1.5 shrink-0 ${uploadOk ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
            {uploadOk ? <CheckCircle size={13} /> : <XCircle size={13} />}
            {uploadOk ? "Foto atualizada!" : uploadErr}
          </div>
        )}

        {/* corpo */}
        <div className="flex-1 overflow-y-auto">
          {loadingDetail ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-gray-300" size={28} />
            </div>
          ) : (
            <div className="p-5 flex flex-col gap-5">

              <section>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Dados pessoais</p>
                <div className="flex flex-col gap-2.5 text-sm text-gray-700">
                  {data.email && (
                    <div className="flex items-center gap-2.5">
                      <Mail size={15} style={{ color: accentColor }} className="shrink-0" />
                      <span className="truncate">{data.email}</span>
                    </div>
                  )}
                  {data.phone && (
                    <div className="flex items-center gap-2.5">
                      <Phone size={15} style={{ color: accentColor }} className="shrink-0" />
                      <a href={`tel:${data.phone}`} className="hover:underline">{data.phone}</a>
                    </div>
                  )}
                  {data.birthDate && (
                    <div className="flex items-center gap-2.5">
                      <Calendar size={15} style={{ color: accentColor }} className="shrink-0" />
                      <span>
                        {new Date(data.birthDate).toLocaleDateString("pt-BR")}
                        {age !== null && <span className="text-gray-400 ml-1">({age} anos)</span>}
                      </span>
                    </div>
                  )}
                  {data.gender && (
                    <div className="flex items-center gap-2.5">
                      <User size={15} style={{ color: accentColor }} className="shrink-0" />
                      <span>{data.gender === "MASCULINO" ? "Masculino" : "Feminino"}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2.5 text-gray-400 text-xs">
                    <Hash size={13} className="shrink-0" />
                    <span>ID #{data.id} · Cadastrado em {new Date(data.createdAt).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
              </section>

              {groups.length > 0 && (
                <section>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Grupos</p>
                  <div className="flex flex-wrap gap-2">
                    {groups.map((g, i) => {
                      const Icon = g.icon
                      return (
                        <div key={i} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold ${g.color}`}>
                          <Icon size={11} />
                          {g.label}
                          {g.sub && <span className="opacity-60">· {g.sub}</span>}
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}

              {attendances.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Presença</p>
                    {presenceRate !== null && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        presenceRate >= 75 ? "bg-green-100 text-green-700"
                        : presenceRate >= 50 ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-600"
                      }`}>
                        {presenceRate}% · {totalPresent}/{attendances.length}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
                    {attendances.slice().reverse().map((a, i) => (
                      <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50 last:border-0">
                        <div>
                          <p className="font-medium text-gray-700">{a.event?.title ?? "Evento"}</p>
                          {a.event?.date && <p className="text-gray-400">{new Date(a.event.date).toLocaleDateString("pt-BR")}</p>}
                        </div>
                        <span className={`px-2 py-0.5 rounded-full font-semibold ${a.isPresent ? "bg-green-100 text-green-700" : "bg-red-100 text-red-500"}`}>
                          {a.isPresent ? "✓" : "✗"}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

            </div>
          )}
        </div>

        {/* rodapé */}
        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between shrink-0 bg-gray-50">
          <Link href={`/list/members/${data.id}`}
            className="text-xs font-medium flex items-center gap-1.5 hover:underline"
            style={{ color: accentColor }}>
            <Eye size={13} /> Ver página completa
          </Link>
          <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600">Fechar</button>
        </div>
      </div>
    </>
  )
}

// ── Wrapper ───────────────────────────────────────────────────────────────────

export default function MemberDrawerWrapper({
  members,
  isAdmin,
  role,
}: {
  members: MemberBasic[]
  isAdmin: boolean
  role: string
}) {
  const [selected, setSelected] = useState<MemberBasic | null>(null)
  const [localMembers, setLocalMembers] = useState(members)
  const accentColor = accentMap[role] ?? "#16a34a"

  // event delegation — escuta cliques em botões com data-drawer na página inteira
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const btn = (e.target as Element).closest("[data-drawer]")
      if (!btn) return
      const id = Number(btn.getAttribute("data-drawer"))
      const member = localMembers.find(m => m.id === id)
      if (member) setSelected(member)
    }
    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [localMembers])

  function handlePhotoUpdated(id: number, url: string) {
    setLocalMembers(prev => prev.map(m => m.id === id ? { ...m, profileImageUrl: url } : m))
    setSelected(prev => prev?.id === id ? { ...prev, profileImageUrl: url } : prev)
  }

  return selected ? (
    <MemberDrawer
      member={selected}
      isAdmin={isAdmin}
      accentColor={accentColor}
      onClose={() => setSelected(null)}
      onPhotoUpdated={handlePhotoUpdated}
    />
  ) : null
}