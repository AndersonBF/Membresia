"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import {
  Users, FileText, Camera, ArrowLeft,
  ChevronRight, Phone, Layers, Search,
  BookOpen, Megaphone, Heart, Mic2,
  Baby, Globe, HandHelping, Star,
} from "lucide-react"

const ac = "#16a34a"
const al = "#f0fdf4"
const ad = "#14532d"

// Ícone genérico baseado em palavras-chave do nome
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

interface Ministry {
  id: number
  name: string
  membersCount: number
  documentsCount: number
  albumsCount: number
}

interface Member {
  id: number
  name: string
  phone?: string | null
  gender?: string | null
  isActive: boolean
  profileImageUrl?: string | null
}

interface MinistryDetail {
  id: number
  name: string
  members: Member[]
  documents: { id: number; title: string; fileUrl: string; createdAt: string }[]
}

export default function MinistryClient({ ministries }: { ministries: Ministry[] }) {
  const [search, setSearch] = useState("")
  const [active, setActive] = useState<MinistryDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<"membros" | "documentos">("membros")

  async function openMinistry(m: Ministry) {
    setLoading(true)
    const res = await fetch(`/api/ministerio/${m.id}`)
    if (res.ok) setActive(await res.json())
    setLoading(false)
    setTab("membros")
  }

  const filtered = ministries.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 rounded-full border-2 border-gray-200 animate-spin" style={{ borderTopColor: ac }} />
      </div>
    )
  }

  // ── Detail view ──────────────────────────────────────────────────────────
  if (active) {
    const Icon = getMinistryIcon(active.name)
    return (
      <div style={{ animation: "mp-in 0.35s cubic-bezier(.22,1,.36,1) both" }}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActive(null)}
              className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:border-gray-400 transition bg-white">
              <ArrowLeft size={15} />
            </button>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: al }}>
              <Icon size={20} style={{ color: ac }} />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-xl">{active.name}</h2>
              <p className="text-gray-400 text-xs">{active.members.length} membro{active.members.length !== 1 ? "s" : ""}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden text-sm">
            {(["membros", "documentos"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className="px-4 py-2 font-medium transition capitalize"
                style={{
                  background: tab === t ? al : "",
                  color: tab === t ? ac : "#9ca3af",
                }}>
                {t === "membros" ? `Membros (${active.members.length})` : `Docs (${active.documents.length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Tab: Membros */}
        {tab === "membros" && (
          active.members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: al }}>
                <Users size={28} style={{ color: ac }} />
              </div>
              <p className="text-gray-600 font-semibold">Nenhum membro neste ministério</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {active.members.map((m, i) => (
                <div key={m.id}
                  className={`flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-gray-50 ${i < active.members.length - 1 ? "border-b border-gray-50" : ""}`}>
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
          )
        )}

        {/* Tab: Documentos */}
        {tab === "documentos" && (
          active.documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: al }}>
                <FileText size={28} style={{ color: ac }} />
              </div>
              <p className="text-gray-600 font-semibold">Nenhum documento neste ministério</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {active.documents.map((doc, i) => (
                <a key={doc.id} href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                  className={`flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition ${i < active.documents.length - 1 ? "border-b border-gray-50" : ""}`}>
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
          )
        )}
      </div>
    )
  }

  // ── List view ────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-green-400 bg-white"
          placeholder="Buscar ministério..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: al }}>
            <Layers size={28} style={{ color: ac }} />
          </div>
          <p className="text-gray-600 font-semibold">Nenhum ministério encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(m => {
            const Icon = getMinistryIcon(m.name)
            return (
              <button
                key={m.id}
                onClick={() => openMinistry(m)}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-start gap-4">
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: al }}>
                  <Icon size={22} style={{ color: ac }} />
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-base truncate">{m.name}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Users size={11} /> {m.membersCount} membro{m.membersCount !== 1 ? "s" : ""}
                    </span>
                    {m.documentsCount > 0 && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <FileText size={11} /> {m.documentsCount} doc{m.documentsCount !== 1 ? "s" : ""}
                      </span>
                    )}
                    {m.albumsCount > 0 && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Camera size={11} /> {m.albumsCount} álbum{m.albumsCount !== 1 ? "ns" : ""}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-300 flex-shrink-0 mt-1" />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}