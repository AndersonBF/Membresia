"use client"

import { useRef, useState } from "react"
import { ImagePlus, Loader2 } from "lucide-react"

// Botão para trocar a capa (imagem de fundo) de um grupo.
// Sobe a imagem pelo mesmo endpoint da Galeria e salva a URL em GroupCover.
export default function GroupCoverEditor({ role }: { role: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    try {
      // 1) sobe a imagem (mesmo endpoint da Galeria)
      const fd = new FormData()
      fd.append("file", file)
      const up = await fetch("/api/gallery/upload", { method: "POST", body: fd })
      if (!up.ok) throw new Error("upload")
      const { url } = await up.json()

      // 2) salva a URL como capa do grupo (permissão checada no servidor)
      const save = await fetch("/api/group/cover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, coverImageUrl: url }),
      })
      if (!save.ok) throw new Error("save")

      location.reload()
    } catch {
      alert("Não foi possível atualizar a capa. Tente novamente.")
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <>
      <button
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-xs bg-white/10 hover:bg-white/20 rounded-lg px-3 py-1.5 transition disabled:opacity-60"
      >
        {busy ? <Loader2 size={13} className="animate-spin" /> : <ImagePlus size={13} />}
        {busy ? "Enviando..." : "Alterar capa"}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
    </>
  )
}
