"use client";

export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useClerk } from "@clerk/nextjs";

/**
 * Rota de retorno do OAuth (Google).
 *
 * - Se o email já estiver vinculado a uma conta → login concluído → vai para /admin
 *   (o middleware redireciona para o painel correto conforme o papel do usuário).
 * - Se o email NÃO estiver vinculado → como o cadastro é restrito, o login não se
 *   completa. Nesse caso voltamos para /sign-in com um aviso explicando que é preciso
 *   vincular a conta Google no perfil antes de usá-la para entrar.
 */
export default function SSOCallbackPage() {
  const { handleRedirectCallback } = useClerk();

  useEffect(() => {
    const naoVinculado = "/sign-in?googleError=notlinked";

    handleRedirectCallback({
      // Impede o "cadastro silencioso": se a conta não existe, não cria uma nova.
      transferable: false,
      // Sucesso no login → painel.
      signInForceRedirectUrl: "/admin",
      // Falha (conta não vinculada) → volta para a NOSSA tela de login com o aviso,
      // em vez do portal hospedado do Clerk.
      signInUrl: naoVinculado,
      signUpUrl: naoVinculado,
      continueSignUpUrl: naoVinculado,
    }).catch(() => {
      window.location.href = naoVinculado;
    });
  }, [handleRedirectCallback]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 18,
      background: "#0a1f12",
    }}>
      <div style={{
        width: 40, height: 40,
        border: "3px solid rgba(255,255,255,0.15)",
        borderTopColor: "#4ade80",
        borderRadius: "50%",
        animation: "sso-spin 0.8s linear infinite",
      }} />
      <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "1rem", margin: 0 }}>
        Concluindo o login com Google…
      </p>
      <style>{`@keyframes sso-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
