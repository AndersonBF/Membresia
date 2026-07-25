"use client"

import { useEffect, useRef, useState } from "react"
import { ImagePlus, X, Loader2, Info } from "lucide-react"

// Gerencia as fotos do carrossel da home pública da igreja.
// Upload → Cloudinary (/api/gallery/upload); persistência → /api/home-photos.
export default function HomePhotosManager() {
  const [photos, setPhotos] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch("/api/home-photos")
      .then((r) => r.json())
      .then((d) => setPhotos(Array.isArray(d.photos) ? d.photos : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function save(next: string[]) {
    setPhotos(next)
    await fetch("/api/home-photos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photos: next }),
    }).catch(() => {})
  }

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const urls: string[] = []
      for (const file of Array.from(files)) {
        const fd = new FormData()
        fd.append("file", file)
        const res = await fetch("/api/gallery/upload", { method: "POST", body: fd })
        const data = await res.json().catch(() => ({}))
        if (res.ok && data.url) urls.push(data.url)
      }
      if (urls.length) await save([...photos, ...urls].slice(0, 12))
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const remove = (url: string) => save(photos.filter((p) => p !== url))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
        <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-700 leading-relaxed">
          Estas fotos aparecem no carrossel da página inicial pública da sua igreja.
          Sem fotos aqui, mostramos imagens genéricas de igreja.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Carregando…</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((url) => (
            <div key={url} className="relative group aspect-video rounded-xl overflow-hidden border border-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="Foto da home" className="w-full h-full object-cover" />
              <button
                onClick={() => remove(url)}
                aria-label="Remover foto"
                className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/50 hover:bg-red-600 text-white flex items-center justify-center transition"
              >
                <X size={14} />
              </button>
            </div>
          ))}

          {photos.length < 12 && (
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="aspect-video rounded-xl border-2 border-dashed border-gray-200 hover:border-green-400 text-gray-400 hover:text-green-600 flex flex-col items-center justify-center gap-1.5 transition disabled:opacity-60"
            >
              {uploading ? <Loader2 size={20} className="animate-spin" /> : <ImagePlus size={20} />}
              <span className="text-xs font-medium">{uploading ? "Enviando…" : "Adicionar fotos"}</span>
            </button>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => onFiles(e.target.files)}
      />
    </div>
  )
}
