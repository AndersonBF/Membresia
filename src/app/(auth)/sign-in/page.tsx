"use client";

export const dynamic = "force-dynamic";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import MarketingShell from "@/components/MarketingShell";

const highlights = [
  "Gestão completa de membros, grupos e diretorias",
  "Controle de presença com relatórios e exportação",
  "Finanças, eventos e comunicados em um só lugar",
];

const LoginPage = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      router.push("/admin");
    }
  }, [user, router, isLoaded, isSignedIn]);

  return (
    <MarketingShell>
      <div style={{ maxWidth: 560 }}>
        <p style={{
          color: "#15803d",
          fontSize: "0.78rem",
          fontWeight: 600,
          letterSpacing: "2.5px",
          textTransform: "uppercase",
          margin: "0 0 16px 0",
        }}>
          Sistema de Gestão de Igreja
        </p>

        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(4.5rem, 8vw, 7rem)",
          fontWeight: 700,
          color: "#14532d",
          letterSpacing: "-4px",
          lineHeight: 1.0,
          margin: "0 0 28px 0",
        }}>
          Membresia
        </h1>

        <p style={{
          color: "#1a4d2e",
          fontSize: "1.15rem",
          fontWeight: 400,
          lineHeight: 1.7,
          margin: "0 0 44px 0",
        }}>
          Uma plataforma para igrejas que querem organizar bem seu rebanho —
          com clareza, controle e simplicidade.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {highlights.map((text, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ flexShrink: 0 }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span style={{
                color: "#1a4d2e",
                fontSize: "1.05rem",
                fontWeight: 400,
                lineHeight: 1.5,
              }}>
                {text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </MarketingShell>
  );
};

export default LoginPage;
