"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Users, FileText, Camera,
  ChevronRight, Layers, Search,
  BookOpen, Megaphone, Heart, Mic2,
  Baby, Globe, HandHelping, Star,
} from "lucide-react"

const ac = "#16a34a"
const al = "#f0fdf4"

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

export default function MinistryClient({ ministries }: { ministries: Ministry[] }) {
  const [search, setSearch] = useState("")

  const filtered = ministries.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
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
              <Link
                key={m.id}
                href={`/ministerio/${m.id}`}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: al }}>
                  <Icon size={22} style={{ color: ac }} />
                </div>
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
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}