"use client"

// src/app/(dashboard)/sermons/page.tsx

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Youtube, PlayCircle, ExternalLink, Search,
  ChevronLeft, ChevronRight, Calendar, AlertCircle,
  Loader2, X, Settings,
} from "lucide-react"

interface Video {
  id: string
  title: string
  published: string
  thumbnail: string
  url: string
  description: string
}

const PAGE_SIZE = 6

function formatDate(dateStr: string) {
  if (!dateStr) return ""
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
  })
}

function VideoCard({ video, featured = false }: { video: Video; featured?: boolean }) {
  if (featured) {
    return (
      <a
        href={video.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative bg-black rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 col-span-full"
      >
        <div className="relative w-full overflow-hidden" style={{ maxHeight: 400 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://i.ytimg.com/vi/${video.id}/maxresdefault.jpg`}
            onError={(e) => { (e.target as HTMLImageElement).src = video.thumbnail }}
            alt={video.title}
            className="w-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
            style={{ aspectRatio: "16/9" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            Mais recente
          </div>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-2xl opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300">
              <PlayCircle size={36} className="text-white" />
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h2 className="text-white font-bold text-xl leading-tight line-clamp-2 mb-2">
              {video.title}
            </h2>
            <div className="flex items-center gap-2 text-white/70 text-sm">
              <Calendar size={13} />
              {formatDate(video.published)}
              {video.description && (
                <>
                  <span className="mx-1">·</span>
                  <span className="line-clamp-1 flex-1 hidden sm:block">{video.description}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </a>
    )
  }

  return (
    <a
      href={video.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="relative overflow-hidden bg-gray-100" style={{ aspectRatio: "16/9" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
          <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
            <PlayCircle size={22} className="text-white" />
          </div>
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug mb-2 group-hover:text-green-700 transition-colors">
          {video.title}
        </h3>
        {video.description && (
          <p className="text-xs text-gray-400 line-clamp-2 mb-3 leading-relaxed">
            {video.description}
          </p>
        )}
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Calendar size={11} />
          {formatDate(video.published)}
        </div>
      </div>
    </a>
  )
}

export default function SermonsPage() {
  const [allVideos, setAllVideos]     = useState<Video[]>([])
  const [channelUrl, setChannelUrl]   = useState("")
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [search, setSearch]           = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetch("/api/sermons")
      .then((r) => r.json())
      .then((data) => {
        setAllVideos(data.videos ?? [])
        setChannelUrl(data.channelUrl ?? "")
        if (data.error) setError(data.error)
      })
      .catch(() => setError("internal_error"))
      .finally(() => setLoading(false))
  }, [])

  // Filtra por busca
  const filtered = search
    ? allVideos.filter((v) => v.title.toLowerCase().includes(search.toLowerCase()))
    : allVideos

  // Paginação client-side
  const totalPages  = Math.ceil(filtered.length / PAGE_SIZE)
  const startIndex  = (currentPage - 1) * PAGE_SIZE
  const pageVideos  = filtered.slice(startIndex, startIndex + PAGE_SIZE)

  // Destaque só na primeira página sem busca
  const featuredVideo = currentPage === 1 && !search ? pageVideos[0] : null
  const gridVideos    = featuredVideo ? pageVideos.slice(1) : pageVideos

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
    setCurrentPage(1)
  }

  function clearSearch() {
    setSearchInput("")
    setSearch("")
    setCurrentPage(1)
  }

  function goToPage(page: number) {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Gera array de páginas para o paginador
  function getPageNumbers() {
    const pages: (number | "...")[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push("...")
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i)
      }
      if (currentPage < totalPages - 2) pages.push("...")
      pages.push(totalPages)
    }
    return pages
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Youtube size={26} className="text-red-600" />
            <h1 className="text-2xl font-bold text-gray-900">Sermões</h1>
          </div>
          <p className="text-sm text-gray-400">
            Assista às mensagens e pregações da nossa igreja
            {allVideos.length > 0 && (
              <span className="ml-2 text-gray-300">· {allVideos.length} vídeos recentes</span>
            )}
          </p>
        </div>

        {channelUrl && (
          <a
            href={channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm shrink-0"
          >
            <Youtube size={16} />
            Visitar Canal
            <ExternalLink size={12} />
          </a>
        )}
      </div>

      {/* BUSCA */}
      {allVideos.length > 0 && (
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar sermão por título..."
              className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-300 bg-white text-gray-700 placeholder:text-gray-400"
            />
            {searchInput && (
              <button type="button" onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={15} />
              </button>
            )}
          </div>
          {search && (
            <p className="mt-2 text-xs text-gray-400">
              {filtered.length} resultado{filtered.length !== 1 ? "s" : ""} para{" "}
              <strong className="text-gray-600">"{search}"</strong>
              <button onClick={clearSearch} className="ml-2 text-red-500 hover:underline">limpar</button>
            </p>
          )}
        </form>
      )}

      {/* LOADING */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={32} className="text-green-500 animate-spin" />
        </div>
      )}

      {/* SEM CANAL */}
      {!loading && !channelUrl && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <Youtube size={52} className="text-gray-200 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Canal do YouTube não configurado</h2>
          <p className="text-sm text-gray-400 max-w-sm mx-auto mb-5">
            Um administrador precisa informar a URL do canal da igreja nas configurações.
          </p>
          <Link href="/settings" className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors">
            <Settings size={15} />
            Ir para Configurações
          </Link>
        </div>
      )}

      {/* ERRO */}
      {!loading && channelUrl && error === "channel_not_found" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <AlertCircle size={48} className="text-amber-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Não foi possível carregar os vídeos</h2>
          <p className="text-sm text-gray-400 max-w-sm mx-auto mb-5">Verifique se a URL do canal está correta nas configurações.</p>
          <div className="flex items-center justify-center gap-3">
            <a href={channelUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors">
              <Youtube size={15} />Abrir no YouTube
            </a>
            <Link href="/settings" className="inline-flex items-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-600 px-5 py-2.5 rounded-xl font-medium text-sm transition-colors">
              Configurações
            </Link>
          </div>
        </div>
      )}

      {/* SEM VÍDEOS */}
      {!loading && !error && channelUrl && allVideos.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <PlayCircle size={52} className="text-gray-200 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Nenhum vídeo encontrado</h2>
        </div>
      )}

      {/* SEM RESULTADO NA BUSCA */}
      {!loading && !error && search && filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <Search size={40} className="text-gray-200 mx-auto mb-4" />
          <h2 className="text-base font-semibold text-gray-700 mb-2">Nenhum vídeo encontrado para "{search}"</h2>
          <button onClick={clearSearch} className="mt-2 text-sm text-green-600 hover:underline">Limpar busca</button>
        </div>
      )}

      {/* GRID */}
      {!loading && pageVideos.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featuredVideo && <VideoCard video={featuredVideo} featured />}
            {gridVideos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>

          {/* PAGINAÇÃO */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-1.5">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={16} />
              </button>

              {getPageNumbers().map((page, i) =>
                page === "..." ? (
                  <span key={`dots-${i}`} className="px-2 text-gray-400 text-sm">...</span>
                ) : (
                  <button
                    key={page}
                    onClick={() => goToPage(page as number)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
                      currentPage === page
                        ? "bg-green-600 text-white shadow-sm"
                        : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Link canal */}
          {channelUrl && (
            <div className="mt-6 text-center">
              <a href={channelUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-red-500 hover:text-red-600 font-medium">
                <Youtube size={14} />
                Ver canal completo no YouTube
                <ExternalLink size={12} />
              </a>
            </div>
          )}
        </>
      )}
    </div>
  )
}