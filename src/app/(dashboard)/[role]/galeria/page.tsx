"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft, Plus, X, Upload, ImageIcon,
  Trash2, ChevronLeft, ChevronRight, Grid3X3,
  LayoutGrid, Search, Camera, FolderOpen, Download,
  Pencil, Check,
} from "lucide-react"

interface Photo {
  id: number
  url: string
  caption?: string | null
  albumId: number
  createdAt: string
}

interface Album {
  id: number
  title: string
  description?: string | null
  coverUrl?: string | null
  createdAt: string
  photos: Photo[]
  _count: { photos: number }
}

const roleConfig: Record<string, { label: string; accentColor: string; accentDark: string; accentLight: string }> = {
  ump:        { label: "UMP",        accentColor: "#2563eb", accentLight: "#eff6ff", accentDark: "#1e3a8a" },
  upa:        { label: "UPA",        accentColor: "#d97706", accentLight: "#fffbeb", accentDark: "#78350f" },
  uph:        { label: "UPH",        accentColor: "#ea580c", accentLight: "#fff7ed", accentDark: "#7c2d12" },
  saf:        { label: "SAF",        accentColor: "#db2777", accentLight: "#fdf2f8", accentDark: "#831843" },
  ucp:        { label: "UCP",        accentColor: "#f59e0b", accentLight: "#fefce8", accentDark: "#78350f" },
  diaconia:   { label: "Diaconia",   accentColor: "#0d9488", accentLight: "#f0fdfa", accentDark: "#134e4a" },
  conselho:   { label: "Conselho",   accentColor: "#4f46e5", accentLight: "#eef2ff", accentDark: "#1e1b4b" },
  ministerio: { label: "Ministério", accentColor: "#16a34a", accentLight: "#f0fdf4", accentDark: "#14532d" },
  ebd:        { label: "EBD",        accentColor: "#b45309", accentLight: "#fffbeb", accentDark: "#451a03" },
}

export default function GalleryPage({ params }: { params: { role: string } }) {
  const { role } = params
  const config = roleConfig[role]
  const ac = config?.accentColor ?? "#2563eb"
  const ad = config?.accentDark  ?? "#1e3a8a"
  const al = config?.accentLight ?? "#eff6ff"

  const [albums, setAlbums]               = useState<Album[]>([])
  const [loading, setLoading]             = useState(true)
  const [activeAlbum, setActiveAlbum]     = useState<Album | null>(null)
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null)
  const [lightboxIdx, setLightboxIdx]     = useState(0)
  const [search, setSearch]               = useState("")
  const [view, setView]                   = useState<"grid" | "masonry">("grid")

  const [showCreateAlbum, setShowCreateAlbum] = useState(false)
  const [newAlbumTitle, setNewAlbumTitle]     = useState("")
  const [newAlbumDesc, setNewAlbumDesc]       = useState("")
  const [creating, setCreating]               = useState(false)

  // ── Rename state ──────────────────────────────────────────────────────────
  const [showRenameAlbum, setShowRenameAlbum] = useState(false)
  const [renameTitle, setRenameTitle]         = useState("")
  const [renameDesc, setRenameDesc]           = useState("")
  const [renaming, setRenaming]               = useState(false)
  const renameTitleRef = useRef<HTMLInputElement>(null)

  const [showAddPhoto, setShowAddPhoto]     = useState(false)
  const [photoCaption, setPhotoCaption]     = useState("")
  const [addingPhoto, setAddingPhoto]       = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError]       = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles]   = useState<File[]>([])
  const [previews, setPreviews]             = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ─── Helpers ──────────────────────────────────────────────────────────────

  async function fetchAlbums(): Promise<Album[]> {
    setLoading(true)
    try {
      const res = await fetch(`/api/gallery/albums?role=${role}`)
      if (res.ok) {
        const data: Album[] = await res.json()
        setAlbums(data)
        return data
      }
    } finally {
      setLoading(false)
    }
    return []
  }

  useEffect(() => { fetchAlbums() }, [role])

  function clearSelection() {
    setSelectedFiles([])
    setPreviews(prev => { prev.forEach(u => URL.revokeObjectURL(u)); return [] })
    setPhotoCaption("")
    setUploadProgress(0)
    setAddingPhoto(false)
    setUploadError(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    previews.forEach(u => URL.revokeObjectURL(u))
    setSelectedFiles(files)
    setPreviews(files.map(f => URL.createObjectURL(f)))
    setUploadError(null)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"))
    if (!files.length) return
    previews.forEach(u => URL.revokeObjectURL(u))
    setSelectedFiles(files)
    setPreviews(files.map(f => URL.createObjectURL(f)))
    setUploadError(null)
  }

  // ─── Upload direto para Cloudinary (bypassa limite da Vercel) ─────────────

  async function uploadToCloudinary(file: File): Promise<string> {
    const credRes = await fetch("/api/gallery/upload")
    if (!credRes.ok) throw new Error("Não foi possível obter credenciais de upload")
    const { cloudName, uploadPreset } = await credRes.json()

    const formData = new FormData()
    formData.append("file", file)
    formData.append("upload_preset", uploadPreset)
    formData.append("folder", "gallery")

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err?.error?.message ?? `Upload falhou (${res.status})`)
    }

    const data = await res.json()
    return data.secure_url as string
  }

  // ─── Álbuns ───────────────────────────────────────────────────────────────

  async function handleCreateAlbum() {
    if (!newAlbumTitle.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/gallery/albums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newAlbumTitle, description: newAlbumDesc, role }),
      })
      if (res.ok) {
        setNewAlbumTitle("")
        setNewAlbumDesc("")
        setShowCreateAlbum(false)
        await fetchAlbums()
      }
    } finally {
      setCreating(false)
    }
  }

  function openRenameModal() {
    if (!activeAlbum) return
    setRenameTitle(activeAlbum.title)
    setRenameDesc(activeAlbum.description ?? "")
    setShowRenameAlbum(true)
    // foca o input após o modal abrir
    setTimeout(() => renameTitleRef.current?.focus(), 50)
  }

  async function handleRenameAlbum() {
    if (!renameTitle.trim() || !activeAlbum) return
    setRenaming(true)
    try {
      const res = await fetch(`/api/gallery/albums/${activeAlbum.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: renameTitle.trim(), description: renameDesc.trim() || null }),
      })
      if (res.ok) {
        setShowRenameAlbum(false)
        const all = await fetchAlbums()
        // atualiza o álbum ativo com os novos dados
        setActiveAlbum(all.find(a => a.id === activeAlbum.id) ?? null)
      }
    } finally {
      setRenaming(false)
    }
  }

  async function handleDeleteAlbum(id: number) {
    if (!confirm("Excluir este álbum e todas as fotos?")) return
    await fetch(`/api/gallery/albums/${id}`, { method: "DELETE" })
    setActiveAlbum(null)
    await fetchAlbums()
  }

  // ─── Fotos ────────────────────────────────────────────────────────────────

  async function handleAddPhotos() {
    if (!selectedFiles.length || !activeAlbum) return

    setAddingPhoto(true)
    setUploadProgress(0)
    setUploadError(null)

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const url = await uploadToCloudinary(selectedFiles[i])

        await fetch("/api/gallery/photos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            albumId: activeAlbum.id,
            url,
            caption: photoCaption || null,
          }),
        })

        setUploadProgress(Math.round(((i + 1) / selectedFiles.length) * 100))
      }

      const all = await fetchAlbums()
      setActiveAlbum(all.find(a => a.id === activeAlbum.id) ?? null)
      setShowAddPhoto(false)
      clearSelection()
    } catch (err: any) {
      setUploadError(err?.message ?? "Erro desconhecido durante o upload")
      setAddingPhoto(false)
      setUploadProgress(0)
    }
  }

  async function handleDeletePhoto(photoId: number) {
    if (!confirm("Excluir esta foto?")) return
    setLightboxPhoto(null)
    await fetch(`/api/gallery/photos?id=${photoId}`, { method: "DELETE" })
    const all = await fetchAlbums()
    setActiveAlbum(all.find(a => a.id === activeAlbum?.id) ?? null)
  }

  async function handleDownload(photo: Photo) {
    const res = await fetch(photo.url)
    const blob = await res.blob()
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = blobUrl
    a.download = photo.caption ? `${photo.caption}.jpg` : `foto-${photo.id}.jpg`
    a.click()
    URL.revokeObjectURL(blobUrl)
  }

  // ─── Lightbox ─────────────────────────────────────────────────────────────

  function openLightbox(photo: Photo, idx: number) {
    setLightboxPhoto(photo)
    setLightboxIdx(idx)
  }

  function lightboxNext() {
    if (!activeAlbum) return
    const next = (lightboxIdx + 1) % activeAlbum.photos.length
    setLightboxIdx(next)
    setLightboxPhoto(activeAlbum.photos[next])
  }

  function lightboxPrev() {
    if (!activeAlbum) return
    const prev = (lightboxIdx - 1 + activeAlbum.photos.length) % activeAlbum.photos.length
    setLightboxIdx(prev)
    setLightboxPhoto(activeAlbum.photos[prev])
  }

  // ─── Derived ──────────────────────────────────────────────────────────────

  const filteredAlbums = albums.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    (a.description ?? "").toLowerCase().includes(search.toLowerCase())
  )

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        .gal { font-family: 'DM Sans', sans-serif; }
        @keyframes gal-in { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .gal-in { animation: gal-in 0.35s cubic-bezier(.22,1,.36,1) both; }
        @keyframes fade-in { from{opacity:0} to{opacity:1} }
        .fade-in { animation: fade-in 0.2s ease both; }
        .album-card { transition: box-shadow .2s, transform .2s; cursor: pointer; }
        .album-card:hover { box-shadow: 0 8px 28px rgba(0,0,0,.12); transform: translateY(-3px); }
        .photo-tile { transition: transform .2s, box-shadow .2s; cursor: pointer; overflow:hidden; }
        .photo-tile:hover { transform: scale(1.02); box-shadow: 0 4px 20px rgba(0,0,0,.15); }
        .photo-tile img { transition: transform .3s; }
        .photo-tile:hover img { transform: scale(1.06); }
        .del-btn { opacity:0; transition: opacity .15s; }
        .photo-tile:hover .del-btn { opacity:1; }
        .modal-backdrop { backdrop-filter: blur(6px); }
        .lightbox-nav { transition: background .15s, transform .15s; }
        .lightbox-nav:hover { background: rgba(255,255,255,.15); transform: scale(1.05); }
        .inp { width:100%; border:1.5px solid #e5e7eb; border-radius:10px; padding:10px 14px; font-size:14px; outline:none; transition: border-color .15s; font-family:'DM Sans',sans-serif; }
        .inp:focus { border-color: var(--ac); }
        .btn-primary { display:inline-flex; align-items:center; gap:6px; background:var(--ac); color:#fff; border:none; border-radius:10px; padding:10px 20px; font-size:14px; font-weight:600; cursor:pointer; transition: opacity .15s, transform .15s; font-family:'DM Sans',sans-serif; }
        .btn-primary:hover { opacity:.88; transform:translateY(-1px); }
        .btn-primary:disabled { opacity:.5; cursor:not-allowed; transform:none; }
        .btn-ghost { display:inline-flex; align-items:center; gap:6px; background:transparent; color:#6b7280; border:1.5px solid #e5e7eb; border-radius:10px; padding:9px 16px; font-size:13px; font-weight:500; cursor:pointer; transition: all .15s; font-family:'DM Sans',sans-serif; }
        .btn-ghost:hover { border-color:#9ca3af; color:#374151; }
        .masonry { columns: 2; column-gap: 12px; }
        @media(min-width:640px) { .masonry { columns: 3; } }
        @media(min-width:768px) { .masonry { columns: 4; } }
        .masonry-item { break-inside: avoid; margin-bottom: 12px; }
        .drop-zone { border: 2px dashed #e5e7eb; border-radius: 14px; transition: border-color .2s, background .2s; }
        .drop-zone.over { border-color: var(--ac); background: var(--al); }
        .preview-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 8px; max-height: 240px; overflow-y: auto; }
        .preview-item { position: relative; aspect-ratio: 1; border-radius: 8px; overflow: hidden; background: #f3f4f6; }
        .preview-item img { width:100%; height:100%; object-fit:cover; }
        .preview-remove { position:absolute; top:3px; right:3px; width:18px; height:18px; border-radius:50%; background:rgba(0,0,0,0.6); color:white; display:flex; align-items:center; justify-content:center; cursor:pointer; border:none; }
      `}</style>

      <div className="gal bg-gray-50 min-h-screen" style={{ "--ac": ac, "--al": al } as any}>

        {/* HERO */}
        <div style={{ background: ad }}>
          <div className="px-6 md:px-10 pt-6 pb-8">
            <Link href={`/${role}`} className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs transition mb-6">
              <ArrowLeft size={13} /> Voltar
            </Link>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <Camera size={28} className="text-white/60" />
                  <h1 className="text-white font-bold text-4xl">Galeria</h1>
                </div>
                <p className="text-white/40 text-sm">{config?.label} — álbuns de fotos</p>
              </div>
              <div className="flex items-center gap-2" style={{ background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "6px 14px" }}>
                <span className="text-white text-xl font-semibold">{albums.length}</span>
                <span className="text-white/35 text-xs">álbuns</span>
                <span className="text-white/20 mx-2">·</span>
                <span className="text-white text-xl font-semibold">{albums.reduce((s, a) => s + a._count.photos, 0)}</span>
                <span className="text-white/35 text-xs">fotos</span>
              </div>
            </div>
          </div>
          <div style={{ height: 2, background: `linear-gradient(90deg, ${ac}, ${ac}55, transparent)` }} />
        </div>

        {/* BODY */}
        <div className="p-4 md:p-6">

          {/* Albums list */}
          {!activeAlbum && (
            <div className="gal-in">
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input className="inp pl-9" placeholder="Buscar álbuns..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <button className="btn-primary" onClick={() => setShowCreateAlbum(true)}>
                  <Plus size={15} /> Novo Álbum
                </button>
              </div>

              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse">
                      <div className="bg-gray-200" style={{ aspectRatio: "4/3" }} />
                      <div className="p-3 space-y-2">
                        <div className="bg-gray-200 h-3 rounded-full w-3/4" />
                        <div className="bg-gray-100 h-2.5 rounded-full w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredAlbums.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5" style={{ background: al }}>
                    <FolderOpen size={32} style={{ color: ac }} />
                  </div>
                  <p className="text-gray-800 font-semibold text-lg">Nenhum álbum ainda</p>
                  <p className="text-gray-400 text-sm mt-1 mb-5">Crie o primeiro álbum para começar</p>
                  <button className="btn-primary" onClick={() => setShowCreateAlbum(true)}><Plus size={14} /> Criar álbum</button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {filteredAlbums.map(album => (
                    <div key={album.id} className="album-card bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm" onClick={() => setActiveAlbum(album)}>
                      <div className="relative overflow-hidden bg-gray-100" style={{ aspectRatio: "4/3" }}>
                        {album.coverUrl || album.photos[0]?.url ? (
                          <img src={album.coverUrl ?? album.photos[0]?.url} alt={album.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-2" style={{ background: al }}>
                            <ImageIcon size={28} style={{ color: ac }} />
                            <span className="text-xs" style={{ color: ac }}>Sem fotos</span>
                          </div>
                        )}
                        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full text-xs font-semibold text-white" style={{ background: "rgba(0,0,0,0.55)" }}>
                          {album._count.photos} foto{album._count.photos !== 1 ? "s" : ""}
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="font-semibold text-gray-800 text-sm truncate">{album.title}</p>
                        {album.description && <p className="text-gray-400 text-xs mt-0.5 truncate">{album.description}</p>}
                        <p className="text-gray-300 text-[10px] mt-1.5">{new Date(album.createdAt).toLocaleDateString("pt-BR")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Album detail */}
          {activeAlbum && (
            <div className="gal-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <button onClick={() => setActiveAlbum(null)} className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:border-gray-400 transition bg-white">
                    <ArrowLeft size={15} />
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-gray-900 text-xl">{activeAlbum.title}</h2>
                      {/* Botão renomear inline */}
                      <button
                        onClick={openRenameModal}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition"
                        title="Renomear álbum"
                      >
                        <Pencil size={13} />
                      </button>
                    </div>
                    {activeAlbum.description && <p className="text-gray-400 text-sm">{activeAlbum.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <button onClick={() => setView("grid")} className="p-2.5 transition" style={{ background: view === "grid" ? al : "", color: view === "grid" ? ac : "#9ca3af" }}><Grid3X3 size={15} /></button>
                    <button onClick={() => setView("masonry")} className="p-2.5 transition" style={{ background: view === "masonry" ? al : "", color: view === "masonry" ? ac : "#9ca3af" }}><LayoutGrid size={15} /></button>
                  </div>
                  <button className="btn-primary" onClick={() => { clearSelection(); setShowAddPhoto(true) }}>
                    <Upload size={14} /> Adicionar fotos
                  </button>
                  <button onClick={() => handleDeleteAlbum(activeAlbum.id)} className="w-9 h-9 rounded-xl border border-red-100 flex items-center justify-center text-red-400 hover:bg-red-50 hover:border-red-200 transition bg-white">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {activeAlbum.photos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5" style={{ background: al }}>
                    <Camera size={32} style={{ color: ac }} />
                  </div>
                  <p className="text-gray-800 font-semibold text-lg">Nenhuma foto ainda</p>
                  <p className="text-gray-400 text-sm mt-1 mb-5">Adicione fotos a este álbum</p>
                  <button className="btn-primary" onClick={() => { clearSelection(); setShowAddPhoto(true) }}>
                    <Upload size={14} /> Adicionar fotos
                  </button>
                </div>
              ) : view === "grid" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {activeAlbum.photos.map((photo, idx) => (
                    <div key={photo.id} className="photo-tile rounded-xl overflow-hidden relative aspect-square bg-gray-100 shadow-sm">
                      <img src={photo.url} alt={photo.caption ?? ""} className="w-full h-full object-cover" onClick={() => openLightbox(photo, idx)} />
                      <button className="del-btn absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md" onClick={e => { e.stopPropagation(); handleDeletePhoto(photo.id) }}>
                        <X size={12} />
                      </button>
                      {photo.caption && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5">
                          <p className="text-white text-[10px] truncate">{photo.caption}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="masonry">
                  {activeAlbum.photos.map((photo, idx) => (
                    <div key={photo.id} className="masonry-item photo-tile rounded-xl overflow-hidden relative bg-gray-100 shadow-sm">
                      <img src={photo.url} alt={photo.caption ?? ""} className="w-full h-auto" onClick={() => openLightbox(photo, idx)} />
                      <button className="del-btn absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md" onClick={e => { e.stopPropagation(); handleDeletePhoto(photo.id) }}>
                        <X size={12} />
                      </button>
                      {photo.caption && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5">
                          <p className="text-white text-[10px] truncate">{photo.caption}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL: Create Album */}
        {showCreateAlbum && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setShowCreateAlbum(false)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 fade-in" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-gray-900 text-lg">Novo Álbum</h3>
                <button onClick={() => setShowCreateAlbum(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition">
                  <X size={15} />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Nome do álbum *</label>
                  <input
                    className="inp"
                    placeholder="Ex: Retiro 2025"
                    value={newAlbumTitle}
                    onChange={e => setNewAlbumTitle(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleCreateAlbum()}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Descrição</label>
                  <textarea className="inp resize-none" rows={3} placeholder="Descreva este álbum..." value={newAlbumDesc} onChange={e => setNewAlbumDesc(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-2 mt-5 justify-end">
                <button className="btn-ghost" onClick={() => setShowCreateAlbum(false)}>Cancelar</button>
                <button className="btn-primary" onClick={handleCreateAlbum} disabled={creating || !newAlbumTitle.trim()}>
                  {creating ? "Criando..." : <><Plus size={14} /> Criar álbum</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: Rename Album */}
        {showRenameAlbum && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={() => { if (!renaming) setShowRenameAlbum(false) }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 fade-in" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: al }}>
                    <Pencil size={14} style={{ color: ac }} />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">Renomear Álbum</h3>
                </div>
                {!renaming && (
                  <button onClick={() => setShowRenameAlbum(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition">
                    <X size={15} />
                  </button>
                )}
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Nome do álbum *</label>
                  <input
                    ref={renameTitleRef}
                    className="inp"
                    placeholder="Ex: Retiro 2025"
                    value={renameTitle}
                    onChange={e => setRenameTitle(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleRenameAlbum()}
                    disabled={renaming}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Descrição</label>
                  <textarea
                    className="inp resize-none"
                    rows={3}
                    placeholder="Descreva este álbum..."
                    value={renameDesc}
                    onChange={e => setRenameDesc(e.target.value)}
                    disabled={renaming}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-5 justify-end">
                <button className="btn-ghost" onClick={() => setShowRenameAlbum(false)} disabled={renaming}>Cancelar</button>
                <button className="btn-primary" onClick={handleRenameAlbum} disabled={renaming || !renameTitle.trim()}>
                  {renaming ? "Salvando..." : <><Check size={14} /> Salvar</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: Add Photos */}
        {showAddPhoto && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={() => { if (!addingPhoto) { setShowAddPhoto(false); clearSelection() } }}
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 fade-in" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-gray-900 text-lg">Adicionar Fotos</h3>
                {!addingPhoto && (
                  <button onClick={() => { setShowAddPhoto(false); clearSelection() }} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition">
                    <X size={15} />
                  </button>
                )}
              </div>

              {previews.length === 0 ? (
                <div
                  className="drop-zone p-10 flex flex-col items-center justify-center gap-3 cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add("over") }}
                  onDragLeave={e => e.currentTarget.classList.remove("over")}
                  onDrop={e => { e.currentTarget.classList.remove("over"); handleDrop(e) }}
                >
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: al }}>
                    <Upload size={26} style={{ color: ac }} />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-700">Clique ou arraste as fotos aqui</p>
                    <p className="text-gray-400 text-xs mt-1">JPG, PNG, WEBP — múltiplos arquivos permitidos</p>
                  </div>
                  <button className="btn-primary" style={{ fontSize: 13, padding: "8px 18px" }}>
                    Selecionar do computador
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="preview-grid">
                    {previews.map((src, i) => (
                      <div key={i} className="preview-item">
                        <img src={src} alt="" />
                        {!addingPhoto && (
                          <button className="preview-remove" onClick={() => {
                            URL.revokeObjectURL(previews[i])
                            setSelectedFiles(f => f.filter((_, idx) => idx !== i))
                            setPreviews(p => p.filter((_, idx) => idx !== i))
                          }}>
                            <X size={10} />
                          </button>
                        )}
                      </div>
                    ))}
                    {!addingPhoto && (
                      <div
                        className="preview-item flex items-center justify-center cursor-pointer border-2 border-dashed border-gray-200 hover:border-gray-400 transition rounded-lg"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Plus size={20} className="text-gray-300" />
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-gray-400">
                    {selectedFiles.length} foto{selectedFiles.length !== 1 ? "s" : ""} selecionada{selectedFiles.length !== 1 ? "s" : ""}
                  </p>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Legenda (opcional)</label>
                    <input
                      className="inp"
                      placeholder="Ex: Retiro de verão 2025"
                      value={photoCaption}
                      onChange={e => setPhotoCaption(e.target.value)}
                      disabled={addingPhoto}
                    />
                  </div>

                  {addingPhoto && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Enviando para o Cloudinary...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div className="h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%`, background: ac }} />
                      </div>
                    </div>
                  )}

                  {uploadError && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl p-3">
                      <X size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-red-600 text-xs font-semibold">Erro no upload</p>
                        <p className="text-red-500 text-xs mt-0.5">{uploadError}</p>
                        <p className="text-red-400 text-xs mt-1">Verifique se o Upload Preset está configurado como <strong>Unsigned</strong> no Cloudinary.</p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 justify-end">
                    {!addingPhoto && (
                      <button className="btn-ghost" onClick={() => { setShowAddPhoto(false); clearSelection() }}>Cancelar</button>
                    )}
                    <button className="btn-primary" onClick={handleAddPhotos} disabled={addingPhoto || !selectedFiles.length}>
                      {addingPhoto
                        ? `Enviando ${uploadProgress}%...`
                        : <><Upload size={14} /> Enviar {selectedFiles.length} foto{selectedFiles.length !== 1 ? "s" : ""}</>
                      }
                    </button>
                  </div>
                </div>
              )}

              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
            </div>
          </div>
        )}

        {/* LIGHTBOX */}
        {lightboxPhoto && activeAlbum && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center fade-in"
            style={{ background: "rgba(0,0,0,0.92)" }}
            onClick={() => setLightboxPhoto(null)}
          >
            <button
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition"
              onClick={() => setLightboxPhoto(null)}
            >
              <X size={18} />
            </button>

            {activeAlbum.photos.length > 1 && (
              <button
                className="lightbox-nav absolute left-4 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center"
                onClick={e => { e.stopPropagation(); lightboxPrev() }}
              >
                <ChevronLeft size={20} />
              </button>
            )}

            <div className="max-w-5xl max-h-screen p-4 flex flex-col items-center gap-3" onClick={e => e.stopPropagation()}>
              <img
                src={lightboxPhoto.url}
                alt={lightboxPhoto.caption ?? ""}
                className="max-h-[80vh] max-w-full rounded-lg object-contain shadow-2xl"
              />
              {lightboxPhoto.caption && (
                <p className="text-white/70 text-sm text-center">{lightboxPhoto.caption}</p>
              )}
              <p className="text-white/30 text-xs">{lightboxIdx + 1} / {activeAlbum.photos.length}</p>
              <div className="flex items-center gap-4">
                <button onClick={() => handleDownload(lightboxPhoto)} className="flex items-center gap-1.5 text-white/60 hover:text-white text-xs transition">
                  <Download size={11} /> Baixar foto
                </button>
                <button onClick={() => handleDeletePhoto(lightboxPhoto.id)} className="flex items-center gap-1.5 text-red-400 hover:text-red-300 text-xs transition">
                  <Trash2 size={11} /> Excluir foto
                </button>
              </div>
            </div>

            {activeAlbum.photos.length > 1 && (
              <button
                className="lightbox-nav absolute right-4 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center"
                onClick={e => { e.stopPropagation(); lightboxNext() }}
              >
                <ChevronRight size={20} />
              </button>
            )}
          </div>
        )}
      </div>
    </>
  )
}