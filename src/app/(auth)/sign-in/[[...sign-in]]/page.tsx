"use client";

export const dynamic = "force-dynamic";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import MarketingShell from "@/components/MarketingShell";

const highlights = [
  "Gestão completa de membros, grupos e diretorias",
  "Controle de presença com relatórios e exportação",
  "Finanças, eventos e comunicados em um só lugar",
];

// Frases em rodízio — uma diferente a cada visita.
const phrases = [
  "A administração da sua igreja em um só lugar.",
  "Deixe a parte chata da administração para nós. Seja igreja.",
  "Cuide do seu rebanho; a organização fica com a gente.",
  "Menos planilhas, mais tempo para o que realmente importa.",
  "Do cadastro ao culto, tudo em um só sistema.",
  "Membros, grupos e diretorias sempre organizados.",
  "Controle de presença com relatórios prontos em segundos.",
  "Finanças, dízimos e ofertas com total transparência.",
  "Eventos, agenda e comunicados que chegam a todos.",
  "Escalas da diaconia montadas automaticamente.",
  "Sermões e estudos organizados para o seu ministério.",
  "Galeria de fotos para guardar cada momento da igreja.",
];

const LoginPage = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [phraseReady, setPhraseReady] = useState(false);

  // Sorteia a frase no cliente e só então a exibe (sem "flash" da primeira).
  useEffect(() => {
    setPhraseIdx(Math.floor(Math.random() * phrases.length));
    setPhraseReady(true);
  }, []);

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      // Primeiro acesso: fica no próprio sign-in mostrando a troca de senha.
      if (user.publicMetadata?.mustChangePassword === true) return;
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
          minHeight: "2.6em",
          opacity: phraseReady ? 1 : 0,
          transition: "opacity 0.35s ease",
        }}>
          {phrases[phraseIdx]}
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
