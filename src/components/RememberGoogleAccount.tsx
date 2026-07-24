"use client"

import { useUser } from "@clerk/nextjs"
import { useEffect } from "react"

/**
 * Memoriza no navegador o email do Google vinculado à conta do usuário logado,
 * para que a tela de login possa oferecer "Continuar como <email>" na próxima vez.
 * Não renderiza nada.
 */
export default function RememberGoogleAccount() {
  const { user, isLoaded } = useUser()

  useEffect(() => {
    if (!isLoaded) return
    const google = user?.externalAccounts?.find((a) => a.provider === "google")
    try {
      if (google?.emailAddress) {
        localStorage.setItem("lastGoogleEmail", google.emailAddress)
      } else {
        localStorage.removeItem("lastGoogleEmail")
      }
    } catch {}
  }, [isLoaded, user])

  return null
}
