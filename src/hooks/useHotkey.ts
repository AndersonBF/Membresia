// src/hooks/useHotkey.ts
//
// Atalhos de teclado de tecla única (ex.: "n" = novo registro).
//
// Regras de segurança para não atrapalhar quem está digitando:
//  - ignora quando o foco está num input, textarea, select ou contenteditable;
//  - ignora quando há Ctrl/Cmd/Alt pressionado (não rouba atalhos do navegador);
//  - ignora quando o atalho está desabilitado (ex.: modal já aberto).

import { useEffect } from "react"

/** O usuário está digitando em algum campo? */
export function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el) return false
  const tag = el.tagName
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable === true
  )
}

type Options = {
  /** Desliga o atalho sem remexer na ordem dos hooks (ex.: modal aberto). */
  enabled?: boolean
  /** Dispara mesmo com o foco num campo de texto (usado pelo Esc). */
  allowWhileTyping?: boolean
}

/**
 * Registra um atalho de tecla única.
 *
 * @param key    tecla, sem diferenciar maiúscula/minúscula (ex.: "n", "/", "Escape")
 * @param handler ação executada
 */
export function useHotkey(
  key: string,
  handler: () => void,
  { enabled = true, allowWhileTyping = false }: Options = {}
) {
  useEffect(() => {
    if (!enabled) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key.toLowerCase() !== key.toLowerCase()) return
      if (!allowWhileTyping && isTypingTarget(e.target)) return

      e.preventDefault()
      handler()
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [key, handler, enabled, allowWhileTyping])
}
