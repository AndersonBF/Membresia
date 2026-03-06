"use client"

import { useUser } from "@clerk/nextjs"
import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Camera, Upload, User, Phone, Mail, Calendar,
  Users, CheckCircle, XCircle, Loader2, ArrowLeft,
} from "lucide-react"

interface Member {
  id: number
  name: string
  username: string | null
  email: string | null
  phone: string | null
  birthDate: string | null
  gender: string | null
  isActive: boolean
  profileImageUrl: string | null
  societies: { society: { name: string } }[]
  council: { councilId: number } | null
  diaconate: { diaconateId: number } | null
  ministries: { ministry: { name: string } }[]
  bibleSchoolClass: { name?: string } | null
}

const roleLabels: Record<string, string> = {
  admin: "Admin", superadmin: "Super Admin",
  ump: "UMP", upa: "UPA", uph: "UPH",
  saf: "SAF", ucp: "UCP", diaconia: "Diaconia",
  conselho: "Conselho", ministerio: "Ministério",
  ebd: "EBD", member: "Membro",
}

const roleColors: Record<string, string> = {
  admin: "bg-red-100 text-red-700",
  superadmin: "bg-purple-100 text-purple-700",
  ump: "bg-blue-100 text-blue-700",
  upa: "bg-yellow-100 text-yellow-700",
  uph: "bg-orange-100 text-orange-700",
  saf: "bg-pink-100 text-pink-700",
  ucp: "bg-amber-100 text-amber-700",
  diaconia: "bg-teal-100 text-teal-700",
  conselho: "bg-indigo-100 text-indigo-700",
  ministerio: "bg-green-100 text-green-700",
  ebd: "bg-brown-100 text-yellow-800",
  member: "bg-gray-100 text-gray-600",
}

export default function ProfilePage() {
  const { user, isLoaded } = useUser()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const [members, setMembers] = useState<Member[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [memberSearch, setMemberSearch] = useState("")

  const roles = (user?.publicMetadata?.roles as string[]) ?? []
  const isAdmin = roles.includes("admin") || roles.includes("superadmin")
  const displayRoles = roles.filter((r) => r !== "member")

  // Carrega membros se for admin
  useEffect(() => {
    if (!isAdmin) return
    setLoadingMembers(true)
    fetch("/api/members-list")
      .then((r) => r.json())
      .then((data) => setMembers(data))
      .catch(console.error)
      .finally(() => setLoadingMembers(false))
  }, [isAdmin])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Preview local imediato
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    setUploading(true)
    setUploadError("")
    setUploadSuccess(false)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/profile/upload-photo", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Erro ao enviar foto")
      }

      // Recarrega o usuário do Clerk para pegar a nova foto
      await user?.reload()
      setUploadSuccess(true)
      setTimeout(() => setUploadSuccess(false), 3000)
    } catch (err: any) {
      setUploadError(err.message ?? "Erro desconhecido")
      setPreviewUrl(null)
    } finally {
      setUploading(false)
    }
  }

  const currentPhotoUrl =
    previewUrl ?? user?.imageUrl ?? null

  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    (m.email ?? "").toLowerCase().includes(memberSearch.toLowerCase()) ||
    (m.phone ?? "").includes(memberSearch)
  )

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-green-600" size={32} />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 flex flex-col gap-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-700">Meu Perfil</h1>
      </div>

      {/* Card principal do perfil */}
      <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col md:flex-row gap-6 items-center md:items-start">

        {/* Foto de perfil */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-green-100 bg-gray-100 flex items-center justify-center">
              {currentPhotoUrl ? (
                <Image
                  src={currentPhotoUrl}
                  alt="Foto de perfil"
                  width={112}
                  height={112}
                  className="object-cover w-full h-full"
                />
              ) : (
                <User size={48} className="text-gray-300" />
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                  <Loader2 className="animate-spin text-white" size={28} />
                </div>
              )}
            </div>

            {/* Botão câmera */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-9 h-9 bg-green-600 hover:bg-green-700 text-white rounded-full flex items-center justify-center shadow-md transition disabled:opacity-50"
              title="Alterar foto"
            >
              <Camera size={16} />
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 text-sm text-green-700 hover:text-green-900 font-medium transition disabled:opacity-50"
          >
            <Upload size={14} />
            {uploading ? "Enviando..." : "Alterar foto"}
          </button>

          {uploadSuccess && (
            <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
              <CheckCircle size={14} />
              Foto atualizada!
            </div>
          )}
          {uploadError && (
            <div className="flex items-center gap-1 text-xs text-red-500">
              <XCircle size={14} />
              {uploadError}
            </div>
          )}
        </div>

        {/* Info do usuário */}
        <div className="flex-1 flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="text-sm text-gray-400">@{user?.username}</p>
          </div>

          {/* Roles */}
          {displayRoles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {displayRoles.map((role) => (
                <span
                  key={role}
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${roleColors[role] ?? "bg-gray-100 text-gray-600"}`}
                >
                  {roleLabels[role] ?? role}
                </span>
              ))}
            </div>
          )}

          {/* Dados */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {user?.primaryEmailAddress && (
              <div className="flex items-center gap-2 text-gray-600">
                <Mail size={15} className="text-green-600 shrink-0" />
                <span className="truncate">{user.primaryEmailAddress.emailAddress}</span>
              </div>
            )}
            {user?.createdAt && (
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar size={15} className="text-green-600 shrink-0" />
                <span>Membro desde {new Date(user.createdAt).toLocaleDateString("pt-BR")}</span>
              </div>
            )}
          </div>

          {/* Links rápidos para seus grupos */}
          {displayRoles.filter(r => !["admin","superadmin"].includes(r)).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
              {displayRoles
                .filter(r => !["admin","superadmin"].includes(r))
                .map((role) => (
                  <Link
                    key={role}
                    href={`/${role}`}
                    className="text-xs text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg font-medium transition"
                  >
                    Ver painel {roleLabels[role] ?? role} →
                  </Link>
                ))}
              {isAdmin && (
                <Link
                  href="/list/members"
                  className="text-xs text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg font-medium transition"
                >
                  Ver todos os membros →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lista de membros — apenas para admin */}
      {isAdmin && (
        <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Users size={20} className="text-green-700" />
              <h2 className="text-lg font-semibold text-gray-700">
                Membros da Igreja
              </h2>
              {!loadingMembers && (
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {filteredMembers.length} membros
                </span>
              )}
            </div>

            <input
              type="text"
              placeholder="Buscar por nome, email ou telefone..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-green-300"
            />
          </div>

          {loadingMembers ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="animate-spin text-green-600" size={28} />
            </div>
          ) : filteredMembers.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">
              Nenhum membro encontrado.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-100 text-xs uppercase tracking-wide">
                    <th className="pb-3 pr-4">Membro</th>
                    <th className="pb-3 pr-4 hidden md:table-cell">Contato</th>
                    <th className="pb-3 pr-4 hidden lg:table-cell">Grupos</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredMembers.map((member) => {
                    const groups = [
                      ...(member.societies?.map((s) => s.society.name) ?? []),
                      ...(member.council ? ["Conselho"] : []),
                      ...(member.diaconate ? ["Diaconia"] : []),
                      ...(member.ministries?.map((m) => m.ministry.name) ?? []),
                      ...(member.bibleSchoolClass ? ["EBD"] : []),
                    ]

                    return (
                      <tr key={member.id} className="hover:bg-gray-50 transition">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                              {member.profileImageUrl ? (
                                <Image
                                  src={member.profileImageUrl}
                                  alt={member.name}
                                  width={36}
                                  height={36}
                                  className="object-cover w-full h-full"
                                />
                              ) : (
                                <User size={18} className="text-gray-300" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800">{member.name}</p>
                              {member.username && (
                                <p className="text-xs text-gray-400">@{member.username}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 pr-4 hidden md:table-cell">
                          <div className="flex flex-col gap-0.5 text-gray-500">
                            {member.email && (
                              <span className="flex items-center gap-1 text-xs">
                                <Mail size={11} />
                                {member.email}
                              </span>
                            )}
                            {member.phone && (
                              <span className="flex items-center gap-1 text-xs">
                                <Phone size={11} />
                                {member.phone}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 pr-4 hidden lg:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {groups.length > 0 ? groups.map((g) => (
                              <span key={g} className="px-2 py-0.5 rounded-full text-xs bg-green-50 text-green-700 font-medium">
                                {g}
                              </span>
                            )) : (
                              <span className="text-gray-300 text-xs">—</span>
                            )}
                          </div>
                        </td>

                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            member.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-600"
                          }`}>
                            {member.isActive ? "Ativo" : "Inativo"}
                          </span>
                        </td>

                        <td className="py-3 text-right">
                          <Link
                            href={`/list/members/${member.id}`}
                            className="text-xs text-green-700 hover:text-green-900 font-medium"
                          >
                            Ver →
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}