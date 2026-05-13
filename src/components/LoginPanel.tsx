"use client";

import * as Clerk from "@clerk/elements/common";
import * as SignIn from "@clerk/elements/sign-in";

export default function LoginPanel() {
  return (
    <div className="split-right" style={{
      width: "33%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 28px",
      background: "#080f0a",
    }}>
      <SignIn.Root>
        <SignIn.Step name="start" style={{
          width: "100%", maxWidth: 300,
          animation: "fadeUp 0.5s ease both",
        }}>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "1.45rem",
              fontWeight: 700,
              color: "#fff",
              margin: "0 0 5px 0",
              letterSpacing: "-0.3px",
            }}>Bem-vindo de volta</h2>
            <p style={{
              color: "rgba(255,255,255,0.3)",
              fontSize: "0.83rem",
              fontWeight: 300,
              margin: 0,
            }}>Acesse sua conta para continuar</p>
          </div>

          <Clerk.GlobalError style={{ fontSize: "0.73rem", color: "#fca5a5", marginBottom: 14 }} />

          <div style={{ marginBottom: 16 }}>
            <Clerk.Field name="identifier">
              <Clerk.Label style={{
                fontSize: "0.68rem", fontWeight: 500,
                color: "rgba(255,255,255,0.38)",
                textTransform: "uppercase", letterSpacing: "1px",
                marginBottom: 7, display: "block",
              }}>Usuário</Clerk.Label>
              <Clerk.Input type="text" required placeholder="seu usuário"
                className="login-input"
                style={{
                  width: "100%", padding: "11px 13px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  borderRadius: 8, color: "#fff",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.88rem",
                  transition: "border-color 0.2s, background 0.2s",
                  boxSizing: "border-box",
                }}
              />
              <Clerk.FieldError style={{ fontSize: "0.71rem", color: "#fca5a5", marginTop: 4 }} />
            </Clerk.Field>
          </div>

          <div style={{ marginBottom: 24 }}>
            <Clerk.Field name="password">
              <Clerk.Label style={{
                fontSize: "0.68rem", fontWeight: 500,
                color: "rgba(255,255,255,0.38)",
                textTransform: "uppercase", letterSpacing: "1px",
                marginBottom: 7, display: "block",
              }}>Senha</Clerk.Label>
              <Clerk.Input type="password" required placeholder="••••••••"
                className="login-input"
                style={{
                  width: "100%", padding: "11px 13px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  borderRadius: 8, color: "#fff",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.88rem",
                  transition: "border-color 0.2s, background 0.2s",
                  boxSizing: "border-box",
                }}
              />
              <Clerk.FieldError style={{ fontSize: "0.71rem", color: "#fca5a5", marginTop: 4 }} />
            </Clerk.Field>
          </div>

          <SignIn.Action submit className="login-btn" style={{
            width: "100%", padding: "12px",
            background: "#15803d",
            color: "#fff",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.88rem", fontWeight: 500,
            border: "none", borderRadius: 8,
            cursor: "pointer",
            transition: "background 0.2s, transform 0.15s, box-shadow 0.2s",
            letterSpacing: "0.3px",
          }}>
            Entrar
          </SignIn.Action>

          <p style={{
            color: "rgba(255,255,255,0.18)",
            fontSize: "0.71rem",
            textAlign: "center",
            marginTop: 24,
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
