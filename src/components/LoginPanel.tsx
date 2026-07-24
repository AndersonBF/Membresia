"use client";

import * as Clerk from "@clerk/elements/common";
import * as SignIn from "@clerk/elements/sign-in";
import { useSignIn, useUser, useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export default function LoginPanel() {
  const { isLoaded, signIn } = useSignIn();
  const { user, isLoaded: userLoaded } = useUser();
  const { getToken } = useAuth();
  const [googleError, setGoogleError] = useState(false);
  const [lastGoogleEmail, setLastGoogleEmail] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setGoogleError(params.get("googleError") === "notlinked");
    try {
      setLastGoogleEmail(localStorage.getItem("lastGoogleEmail"));
    } catch {}
  }, []);

  const handleGoogle = async (loginHint?: string) => {
    if (!isLoaded || !signIn) return;
    try {
      // Com oidcLoginHint o Google entra direto com aquele email, sem a tela
      // de "escolher conta". Sem hint, mostra o seletor normalmente.
      const res = await signIn.create({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        actionCompleteRedirectUrl: "/admin",
        ...(loginHint ? { oidcLoginHint: loginHint } : {}),
      });
      const url = res.firstFactorVerification?.externalVerificationRedirectURL;
      if (url) {
        window.location.href = url.toString();
        return;
      }
      throw new Error("sem URL de redirecionamento");
    } catch {
      // Fallback para o fluxo padrão caso algo falhe.
      signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/admin",
      });
    }
  };

  const usarOutraConta = () => {
    try {
      localStorage.removeItem("lastGoogleEmail");
    } catch {}
    setLastGoogleEmail(null);
  };

  // Primeiro acesso: mostra a troca de senha no próprio painel, sem sair do sign-in.
  const mustChangePassword =
    userLoaded && user?.publicMetadata?.mustChangePassword === true;

  return (
    <div className="split-right" style={{
      width: "45%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 56px",
      background: "#0a1f12",
    }}>
      {mustChangePassword ? (
        <NewPasswordForm getToken={getToken} reloadUser={() => user?.reload()} />
      ) : (
      <SignIn.Root path="/sign-in">
        <SignIn.Step name="start" style={{
          width: "100%", maxWidth: 360,
          animation: "fadeUp 0.5s ease both",
        }}>
          <div style={{ marginBottom: 36 }}>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "2rem",
              fontWeight: 700,
              color: "#fff",
              margin: "0 0 8px 0",
              letterSpacing: "-0.5px",
            }}>Bem-vindo de volta</h2>
            <p style={{
              color: "rgba(255,255,255,0.65)",
              fontSize: "1rem",
              fontWeight: 300,
              margin: 0,
            }}>Acesse sua conta para continuar</p>
          </div>

          {/* Mensagem quando o Google não está vinculado a nenhuma conta */}
          {googleError && (
            <div style={{
              display: "flex", gap: 9,
              background: "rgba(248,113,113,0.1)",
              border: "1px solid rgba(248,113,113,0.3)",
              borderRadius: 10,
              padding: "11px 13px",
              marginBottom: 16,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="#fca5a5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span style={{ fontSize: "0.83rem", color: "#fca5a5", lineHeight: 1.5 }}>
                Este email não está vinculado a nenhuma conta. Entre com seu usuário e
                senha e vincule o Google em <strong style={{ color: "#fecaca", fontWeight: 600 }}>Meu
                Perfil</strong> para poder usá-lo no próximo acesso.
              </span>
            </div>
          )}

          <Clerk.GlobalError style={{ fontSize: "0.85rem", color: "#fca5a5", marginBottom: 14 }} />

          <button type="button" onClick={() => handleGoogle(lastGoogleEmail ?? undefined)} disabled={!isLoaded}
            className="login-google-btn" style={{
            width: "100%", padding: "13px 16px",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            background: "#fff",
            color: "#1f2937",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.98rem", fontWeight: 500,
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 10,
            cursor: isLoaded ? "pointer" : "wait",
            transition: "background 0.2s, transform 0.15s, box-shadow 0.2s",
            marginBottom: lastGoogleEmail ? 10 : 24,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
              <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
            </svg>
            {lastGoogleEmail ? (
              <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.25, textAlign: "left" }}>
                <span>Continuar como</span>
                <span style={{ fontSize: "0.8rem", color: "#5f6368", wordBreak: "break-all" }}>
                  {lastGoogleEmail}
                </span>
              </span>
            ) : (
              <span>Entrar com Google</span>
            )}
          </button>

          {lastGoogleEmail && (
            <button type="button" onClick={usarOutraConta} style={{
              width: "100%", background: "none", border: "none",
              color: "rgba(255,255,255,0.75)", fontSize: "0.95rem", fontWeight: 500,
              cursor: "pointer", marginBottom: 24, padding: "4px 0",
              textAlign: "center", textDecoration: "underline",
              textUnderlineOffset: 3,
            }}>
              Entrar com outra conta
            </button>
          )}

          {!googleError && !lastGoogleEmail && (
            <div style={{
              display: "flex", gap: 10,
              background: "rgba(74,222,128,0.08)",
              border: "1px solid rgba(74,222,128,0.2)",
              borderRadius: 10,
              padding: "11px 13px",
              marginBottom: 24,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <p style={{
                color: "rgba(255,255,255,0.72)",
                fontSize: "0.8rem",
                lineHeight: 1.5,
                margin: 0,
              }}>
                <strong style={{ color: "#fff", fontWeight: 600 }}>Primeira vez?</strong> Entre com seu
                usuário e senha e vincule sua conta Google em <strong style={{ color: "#fff", fontWeight: 600 }}>Meu
                Perfil</strong>. Depois disso, você poderá entrar com um clique no Google.
              </p>
            </div>
          )}

          <div style={{
            display: "flex", alignItems: "center", gap: 14,
            marginBottom: 24,
          }}>
            <span style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.12)" }} />
            <span style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}>ou</span>
            <span style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.12)" }} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <Clerk.Field name="identifier">
              <Clerk.Label style={{
                fontSize: "0.78rem", fontWeight: 600,
                color: "rgba(255,255,255,0.7)",
                textTransform: "uppercase", letterSpacing: "1.2px",
                marginBottom: 8, display: "block",
              }}>Usuário</Clerk.Label>
              <Clerk.Input type="text" required placeholder="seu usuário"
                className="login-input"
                style={{
                  width: "100%", padding: "13px 16px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 10, color: "#fff",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "1rem",
                  transition: "border-color 0.2s, background 0.2s",
                  boxSizing: "border-box",
                }}
              />
              <Clerk.FieldError style={{ fontSize: "0.82rem", color: "#fca5a5", marginTop: 5 }} />
            </Clerk.Field>
          </div>

          <div style={{ marginBottom: 28 }}>
            <Clerk.Field name="password">
              <Clerk.Label style={{
                fontSize: "0.78rem", fontWeight: 600,
                color: "rgba(255,255,255,0.7)",
                textTransform: "uppercase", letterSpacing: "1.2px",
                marginBottom: 8, display: "block",
              }}>Senha</Clerk.Label>
              <Clerk.Input type="password" required placeholder="••••••••"
                className="login-input"
                style={{
                  width: "100%", padding: "13px 16px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 10, color: "#fff",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "1rem",
                  transition: "border-color 0.2s, background 0.2s",
                  boxSizing: "border-box",
                }}
              />
              <Clerk.FieldError style={{ fontSize: "0.82rem", color: "#fca5a5", marginTop: 5 }} />
            </Clerk.Field>
          </div>

          <SignIn.Action submit className="login-btn" style={{
            width: "100%", padding: "14px",
            background: "#15803d",
            color: "#fff",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "1rem", fontWeight: 500,
            border: "none", borderRadius: 10,
            cursor: "pointer",
            transition: "background 0.2s, transform 0.15s, box-shadow 0.2s",
            letterSpacing: "0.3px",
          }}>
            Entrar
          </SignIn.Action>

          <p style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: "0.82rem",
            textAlign: "center",
            marginTop: 28,
            lineHeight: 1.6,
          }}>
            Acesso restrito a membros autorizados.<br />
            Dúvidas? Contate o administrador.
          </p>
        </SignIn.Step>
      </SignIn.Root>
      )}
    </div>
  );
}

function NewPasswordForm({
  getToken,
  reloadUser,
}: {
  getToken: (opts?: { skipCache?: boolean }) => Promise<string | null>;
  reloadUser: () => Promise<unknown> | undefined;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "13px 16px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10, color: "#fff",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "1rem",
    transition: "border-color 0.2s, background 0.2s",
    boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: "0.78rem", fontWeight: 600,
    color: "rgba(255,255,255,0.7)",
    textTransform: "uppercase", letterSpacing: "1.2px",
    marginBottom: 8, display: "block",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) {
      setError("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirm) {
      setError("As senhas não conferem.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/first-access/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao alterar a senha.");

      // Atualiza usuário e token para o middleware liberar o acesso.
      await reloadUser();
      await getToken({ skipCache: true });
      window.location.href = "/";
    } catch (err: any) {
      setError(err.message ?? "Erro ao alterar a senha.");
      setLoading(false);
    }
  };

  return (
    <div style={{ width: "100%", maxWidth: 360, animation: "fadeUp 0.5s ease both" }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "2rem", fontWeight: 700, color: "#fff",
          margin: "0 0 8px 0", letterSpacing: "-0.5px",
        }}>Crie sua nova senha</h2>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "1rem", fontWeight: 300, margin: 0 }}>
          Por segurança, no primeiro acesso você precisa trocar a senha que recebeu.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Nova senha</label>
          <div style={{ position: "relative" }}>
            <input
              type={show ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="login-input"
              style={{ ...inputStyle, paddingRight: 44 }}
              autoFocus
            />
            <button type="button" onClick={() => setShow((s) => !s)} tabIndex={-1}
              style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer",
                color: "rgba(255,255,255,0.5)", fontSize: "0.78rem", fontWeight: 600,
              }}>
              {show ? "Ocultar" : "Mostrar"}
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Confirmar nova senha</label>
          <input
            type={show ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repita a nova senha"
            className="login-input"
            style={inputStyle}
          />
        </div>

        {error && (
          <p style={{ fontSize: "0.85rem", color: "#fca5a5", marginBottom: 14 }}>{error}</p>
        )}

        <button type="submit" disabled={loading} className="login-btn" style={{
          width: "100%", padding: "14px",
          background: "#15803d", color: "#fff",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "1rem", fontWeight: 500,
          border: "none", borderRadius: 10,
          cursor: loading ? "wait" : "pointer",
          transition: "background 0.2s, transform 0.15s, box-shadow 0.2s",
          letterSpacing: "0.3px", opacity: loading ? 0.7 : 1,
        }}>
          {loading ? "Salvando..." : "Salvar e continuar"}
        </button>
      </form>
    </div>
  );
}
