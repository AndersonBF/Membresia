"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

type Slide = { url: string; caption?: string | null }

// Carrossel full-bleed: preenche 100% do container (usado na metade direita do hero).
export default function HeroCarousel({ images }: { images: Slide[] }) {
  const [i, setI] = useState(0)
  const n = images.length

  useEffect(() => {
    if (n <= 1) return
    const t = setInterval(() => setI((v) => (v + 1) % n), 5000)
    return () => clearInterval(t)
  }, [n])

  if (n === 0) return null

  const go = (dir: number) => setI((v) => (v + dir + n) % n)

  return (
    <div className="absolute inset-0 overflow-hidden">
      {images.map((s, idx) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={idx}
          src={s.url}
          alt={s.caption ?? "Foto da igreja"}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out"
          style={{ opacity: idx === i ? 1 : 0 }}
        />
      ))}

      {/* gradiente sutil para contraste da legenda/controles */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

      {images[i]?.caption && (
        <p className="absolute bottom-6 left-6 right-16 text-white text-base font-medium drop-shadow-lg">
          {images[i].caption}
        </p>
      )}

      {n > 1 && (
        <>
          <button
            onClick={() => go(-1)}
            aria-label="Anterior"
            className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/30 hover:bg-black/55 text-white flex items-center justify-center transition backdrop-blur-sm"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={() => go(1)}
            aria-label="Próxima"
            className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/30 hover:bg-black/55 text-white flex items-center justify-center transition backdrop-blur-sm"
          >
            <ChevronRight size={22} />
          </button>

          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setI(idx)}
                aria-label={`Ir para imagem ${idx + 1}`}
                className={`h-2 rounded-full transition-all ${idx === i ? "w-8 bg-white" : "w-2 bg-white/50 hover:bg-white/80"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
