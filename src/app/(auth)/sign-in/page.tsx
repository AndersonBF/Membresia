"use client";

export const dynamic = "force-dynamic";

import * as Clerk from "@clerk/elements/common";
import * as SignIn from "@clerk/elements/sign-in";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const LoginPage = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      router.push("/admin");
    }
  }, [user, router, isLoaded, isSignedIn]);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background: "linear-gradient(135deg, #030f07, #061a0d, #0a2614, #061a0d, #030f07, #08200f)",
        backgroundSize: "400% 400%",
        animation: "breathe 12s ease infinite",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500&display=swap');
            @keyframes breathe {
              0%   { background-position: 0% 50%; }
              50%  { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            @keyframes fadeUp {
              from { opacity: 0; transform: translateY(24px); }
              to   { opacity: 1; transform: translateY(0); }
            }
            .login-card { animation: fadeUp 0.6s ease forwards; }
            .login-input::placeholder { color: rgba(255,255,255,0.25); }
            .login-input:focus {
              border-color: rgba(74,222,128,0.5) !important;
              background: rgba(255,255,255,0.12) !important;
            }
            .login-btn:hover {
              opacity: 0.88;
              transform: translateY(-1px);
              box-shadow: 0 8px 28px rgba(22,163,74,0.5) !important;
            }
            .login-btn:active { transform: scale(0.98); }
          `,
        }}
      />

      <SignIn.Root>
        <SignIn.Step
          name="start"
          className="login-card"
          style={{
            background: "#1a3a25",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 20,
            padding: "48px 44px",
            width: "100%",
            maxWidth: 420,
            boxShadow: "0 40px 80px rgba(0,0,0,0.6)",
          }}
        >
          <div style={{
            width: 40, height: 3,
            background: "linear-gradient(90deg, #4ade80, #16a34a)",
            borderRadius: 99,
            marginBottom: 28,
          }} />

          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "2.2rem",
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: "-0.5px",
            marginBottom: 4,
            lineHeight: 1.1,
          }}>
            Membresia
          </h1>

          <p style={{
            color: "rgba(255,255,255,0.55)",
            fontSize: "0.875rem",
            fontWeight: 300,
            marginBottom: 32,
          }}>
            Acesse sua conta
          </p>

          <Clerk.GlobalError style={{ fontSize: "0.75rem", color: "#fca5a5", marginBottom: 16 }} />

          <div style={{ display: "flex", flexDirection: "column", marginBottom: 20 }}>
            <Clerk.Field name="identifier">
              <Clerk.Label style={{
                fontSize: "0.72rem", fontWeight: 500,
                color: "rgba(255,255,255,0.55)",
                textTransform: "uppercase", letterSpacing: "1px",
                marginBottom: 8, display: "block",
              }}>Usuário</Clerk.Label>
              <Clerk.Input
                type="text"
                required
                placeholder="seu usuário"
                className="login-input"
                style={{
                  width: "100%", padding: "12px 16px",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 10, color: "#ffffff",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.95rem", outline: "none",
                  transition: "border-color 0.2s, background 0.2s",
                  marginBottom: 4, boxSizing: "border-box",
                }}
              />
              <Clerk.FieldError style={{ fontSize: "0.75rem", color: "#fca5a5", marginTop: 4 }} />
            </Clerk.Field>
          </div>

          <div style={{ display: "flex", flexDirection: "column", marginBottom: 20 }}>
            <Clerk.Field name="password">
              <Clerk.Label style={{
                fontSize: "0.72rem", fontWeight: 500,
                color: "rgba(255,255,255,0.55)",
                textTransform: "uppercase", letterSpacing: "1px",
                marginBottom: 8, display: "block",
              }}>Senha</Clerk.Label>
              <Clerk.Input
                type="password"
                required
                placeholder="••••••••"
                className="login-input"
                style={{
                  width: "100%", padding: "12px 16px",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 10, color: "#ffffff",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.95rem", outline: "none",
                  transition: "border-color 0.2s, background 0.2s",
                  marginBottom: 4, boxSizing: "border-box",
                }}
              />
              <Clerk.FieldError style={{ fontSize: "0.75rem", color: "#fca5a5", marginTop: 4 }} />
            </Clerk.Field>
          </div>

          <SignIn.Action
            submit
            className="login-btn"
            style={{
              width: "100%", padding: 13, marginTop: 8,
              background: "linear-gradient(135deg, #16a34a, #15803d)",
              color: "#ffffff",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.95rem", fontWeight: 500,
              border: "none", borderRadius: 10,
              cursor: "pointer",
              transition: "opacity 0.2s, transform 0.15s, box-shadow 0.2s",
              boxShadow: "0 4px 20px rgba(22,163,74,0.4)",
              letterSpacing: "0.3px",
            }}
          >
            Entrar
          </SignIn.Action>
        </SignIn.Step>
      </SignIn.Root>
    </div>
  );
};

export default LoginPage;