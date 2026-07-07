"use client";

import * as Clerk from "@clerk/elements/common";
import * as SignIn from "@clerk/elements/sign-in";

export default function LoginPanel() {
  return (
    <div className="split-right" style={{
      width: "45%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 56px",
      background: "#0a1f12",
    }}>
      <SignIn.Root>
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

          <Clerk.GlobalError style={{ fontSize: "0.85rem", color: "#fca5a5", marginBottom: 14 }} />

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
    </div>
  );
}
