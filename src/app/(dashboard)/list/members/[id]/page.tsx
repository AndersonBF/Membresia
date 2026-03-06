// src/app/(dashboard)/list/members/[id]/page.tsx
"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Camera, Phone, Mail, Calendar,
  Users, Shield, HandHelping, Layers, BookOpen,
  CheckCircle, XCircle, Loader2, User, Hash,
  ClipboardList,
} from "lucide-react"

interface MemberDetail {
  id: number
  name: string
  username: string | null
  email: string | null
  phone: string | null
  birthDate: string | null
  gender: string | null
  isActive: boolean
  profileImageUrl: string | null
  createdAt: string
  societies: { societyId: number; cargo: string | null; society: { name: string } }[]
  council: { councilId: number } | null
  diaconate: { diaconateId: number } | null
  ministries: { ministry: { name: string } }[]
  bibleSchoolClass: { name: string } | null
  attendances: { isPresent: boolean; event: { title: string; date: string } | null }[]
}

export default function MemberDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [member, setMember] = useState<MemberDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/members/${params.id}`)
      .then((r) => r.json())
      .then((data) => setMember(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [params.id])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !member) return

    setPreviewUrl(URL.createObjectURL(file))
    setUploading(true)
    setUploadError("")
    setUploadSuccess(false)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch(`/api/members/${params.id}/upload-photo`, {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Erro ao enviar foto")
      }

      const { url } = await res.json()
      setMember((prev) => prev ? { ...prev, profileImageUrl: url } : prev)
      setUploadSuccess(true)
      setTimeout(() => setUploadSuccess(false), 3000)
    } catch (err: any) {
      setUploadError(err.message ?? "Erro desconhecido")
      setPreviewUrl(null)
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-green-600" size={32} />
      </div>
    )
  }

  if (!member) {
    return (
      <div className="p-6 text-center text-gray-500">
        Membro não encontrado.{" "}
        <Link href="/list/members" className="text-green-600 hover:underline">Voltar</Link>
      </div>
    )
  }

  const photoUrl = previewUrl ?? member.profileImageUrl
  const age = member.birthDate
    ? Math.floor((Date.now() - new Date(member.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  const totalPresent = member.attendances.filter((a) => a.isPresent).length
  const totalEvents = member.attendances.length
  const presenceRate = totalEvents > 0 ? Math.round((totalPresent / totalEvents) * 100) : null

  const groups = [
    ...member.societies.map((s) => ({
      label: s.society.name,
      sub: s.cargo,
      color: "bg-blue-100 text-blue-800",
      icon: Users,
    })),
    ...(member.council ? [{ label: "Conselho", sub: null, color: "bg-indigo-100 text-indigo-800", icon: Shield }] : []),
    ...(member.diaconate ? [{ label: "Diaconia", sub: null, color: "bg-teal-100 text-teal-800", icon: HandHelping }] : []),
    ...member.ministries.map((m) => ({
      label: m.ministry.name,
      sub: null,
      color: "bg-green-100 text-green-800",
      icon: Layers,
    })),
    ...(member.bibleSchoolClass ? [{ label: member.bibleSchoolClass.name, sub: "EBD", color: "bg-amber-100 text-amber-800", icon: BookOpen }] : []),
  ]

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto flex flex-col gap-6">

      {/* Voltar */}
      <Link href="/list/members" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 w-fit transition">
        <ArrowLeft size={16} /> Voltar para membros
      </Link>

      {/* Card principal */}
      <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col md:flex-row gap-6 items-center md:items-start">

        {/* Foto + upload */}
        <div className="flex flex-col items-center gap-3 shrink-0">
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-green-100 bg-gray-100 flex items-center justify-center">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} alt={member.name} className="w-full h-full object-cover" />
              ) : (
                <User size={52} className="text-gray-300" />
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                  <Loader2 className="animate-spin text-white" size={28} />
                </div>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-9 h-9 bg-green-600 hover:bg-green-700 text-white rounded-full flex items-center justify-center shadow-md transition disabled:opacity-50"
              title="Alterar foto"
            >
              <Camera size={16} />
            </button>
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

          {uploadSuccess && (
            <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
              <CheckCircle size={13} /> Foto atualizada!
            </div>
          )}
          {uploadError && (
            <div className="flex items-center gap-1 text-xs text-red-500">
              <XCircle size={13} /> {uploadError}
            </div>
          )}

          {/* Status */}
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${member.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
            {member.isActive ? "Ativo" : "Inativo"}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{member.name}</h1>
            {member.username && <p className="text-sm text-gray-400 mt-0.5">@{member.username}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
            {member.email && (
              <div className="flex items-center gap-2">
                <Mail size={15} className="text-green-600 shrink-0" />
                <span className="truncate">{member.email}</span>
              </div>
            )}
            {member.phone && (
              <div className="flex items-center gap-2">
                <Phone size={15} className="text-green-600 shrink-0" />
                <a href={`tel:${member.phone}`} className="hover:text-green-700">{member.phone}</a>
              </div>
            )}
            {member.birthDate && (
              <div className="flex items-center gap-2">
                <Calendar size={15} className="text-green-600 shrink-0" />
                <span>
                  {new Date(member.birthDate).toLocaleDateString("pt-BR")}
                  {age !== null && <span className="text-gray-400 ml-1">({age} anos)</span>}
                </span>
              </div>
            )}
            {member.gender && (
              <div className="flex items-center gap-2">
                <User size={15} className="text-green-600 shrink-0" />
                <span>{member.gender === "MASCULINO" ? "Masculino" : "Feminino"}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Hash size={15} className="text-green-600 shrink-0" />
              <span className="text-gray-400">ID #{member.id}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={15} className="text-green-600 shrink-0" />
              <span>Cadastrado em {new Date(member.createdAt).toLocaleDateString("pt-BR")}</span>
            </div>
          </div>

          {/* Grupos */}
          {groups.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {groups.map((g, i) => {
                const Icon = g.icon
                return (
                  <div key={i} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${g.color}`}>
                    <Icon size={12} />
                    {g.label}
                    {g.sub && <span className="opacity-60">· {g.sub}</span>}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Presença */}
      {member.attendances.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList size={18} className="text-green-600" />
            <h2 className="text-lg font-semibold text-gray-700">Histórico de Presença</h2>
            {presenceRate !== null && (
              <span className={`ml-auto text-sm font-semibold px-3 py-1 rounded-full ${
                presenceRate >= 75 ? "bg-green-100 text-green-700"
                : presenceRate >= 50 ? "bg-yellow-100 text-yellow-700"
                : "bg-red-100 text-red-600"
              }`}>
                {presenceRate}% de presença
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
            {member.attendances.slice().reverse().map((a, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="font-medium text-gray-700">{a.event?.title ?? "Evento"}</p>
                  {a.event?.date && (
                    <p className="text-xs text-gray-400">
                      {new Date(a.event.date).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  a.isPresent ? "bg-green-100 text-green-700" : "bg-red-100 text-red-500"
                }`}>
                  {a.isPresent ? "Presente" : "Ausente"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}