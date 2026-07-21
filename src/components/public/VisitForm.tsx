"use client"

import { useState } from "react"
import { X, MessageCircle, Loader2, HeartHandshake, Check } from "lucide-react"

/** Normaliza um número para o formato do wa.me (só dígitos, com DDI 55 do Brasil). */
function toWaNumber(raw: string): string {
  const digits = (raw || "").replace(/\D/g, "")
  if (!digits) return ""
  // Se já vier com DDI (12–13 dígitos começando por 55), usa como está.
  if (digits.startsWith("55") && digits.length >= 12) return digits
  // Caso contrário assume número BR (DDD + número) e prefixa 55.
  return `55${digits}`
}

export default function VisitForm({
  whatsapp,
  triggerClassName,
  triggerLabel = "Quero conhecer / visitar",
}: {
  whatsapp: string
  triggerClassName?: string
  triggerLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)

  const wa = toWaNumber(whatsapp)

  async function submit() {
    if (!name.trim()) return
    setSending(true)
    try {
      // 1) salva o contato no sistema (não bloqueia o WhatsApp se falhar)
      await fetch("/api/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, message }),
      }).catch(() => {})

      // 2) abre o WhatsApp da igreja com mensagem pronta
      const txt =
        `Olá! Meu nome é ${name.trim()}. ` +
        `Gostaria de conhecer/visitar a igreja.` +
        (message.trim() ? ` ${message.trim()}` : "")
      if (wa) {
        window.open(`https://wa.me/${wa}?text=${encodeURIComponent(txt)}`, "_blank")
      }
      setDone(true)
    } finally {
      setSending(false)
    }
  }

  function close() {
    setOpen(false)
    // reseta depois de fechar
    setTimeout(() => {
      setDone(false); setName(""); setPhone(""); setMessage("")
    }, 200)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={triggerClassName ??
          "inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-green-950 font-semibold px-6 py-3 rounded-xl transition shadow-lg"}
      >
        <HeartHandshake size={18} /> {triggerLabel}
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          <div className="bg-white rounded-2xl relative w-full max-w-md p-6">
            <button onClick={close} className="absolute top-3 right-3 text-gray-500 hover:text-black transition">
              <X size={20} />
            </button>

            {done ? (
              <div className="flex flex-col items-center text-center gap-3 py-4">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                  <Check size={26} className="text-green-700" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Recebemos seu contato!</h2>
                <p className="text-sm text-gray-500">
                  Se o WhatsApp abriu, é só enviar a mensagem. Em breve alguém da igreja falará com você. 🙏
                </p>
                <button onClick={close} className="mt-2 text-sm font-medium text-green-700">Fechar</button>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Quero conhecer a igreja</h2>
                <p className="text-sm text-gray-500 mb-4">
                  Deixe seu contato — retornaremos para receber você. Será um prazer! 💚
                </p>

                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm text-gray-600 font-medium">Seu nome</span>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Como podemos te chamar?"
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm text-gray-600 font-medium">Telefone / WhatsApp <span className="text-gray-400 font-normal">(opcional)</span></span>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(45) 9 9999-9999"
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm text-gray-600 font-medium">Mensagem <span className="text-gray-400 font-normal">(opcional)</span></span>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      placeholder="Ex.: gostaria de visitar no próximo domingo."
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-green-500 resize-none"
                    />
                  </div>

                  <button
                    onClick={submit}
                    disabled={sending || !name.trim()}
                    className="bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-md text-sm font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {sending ? <Loader2 size={15} className="animate-spin" /> : <MessageCircle size={15} />}
                    Enviar e abrir WhatsApp
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
