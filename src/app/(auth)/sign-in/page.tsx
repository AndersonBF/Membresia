"use client";

export const dynamic = "force-dynamic";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import MarketingShell from "@/components/MarketingShell";

const features = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="7" r="4" /><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      </svg>
    ),
    label: "Gestão de membros",
    desc: "Perfis completos com histórico, fotos e vínculos com grupos",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    label: "Eventos e Calendário",
    desc: "Agenda geral, eventos por sociedade e controle de datas",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
    label: "Controle de Presença",
    desc: "Frequência por evento com rankings e exportação para Excel",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    label: "Finanças",
    desc: "Entradas e saídas por sociedade com gráficos e relatórios",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    label: "Sociedades Internas",
    desc: "UMP, UPA, UPH, SAF, UCP — diretorias e membros por grupo",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    label: "Comunicados",
    desc: "Transmissões e avisos para grupos específicos ou toda a igreja",
  },
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
      {/* Ícone + título */}
      <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 32 }}>
        <div style={{
          width: 72, height: 72, flexShrink: 0,
          background: "#1e3f28",
          border: "1px solid rgba(74,222,128,0.18)",
          borderRadius: 18,
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative",
        }}>
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none"
            stroke="#4ade80" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="7" r="4" />
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          </svg>
          <div style={{
            position: "absolute", bottom: -4, right: -4,
            width: 18, height: 18,
            background: "#4ade80",
            borderRadius: "50%",
            border: "2px solid #162d1e",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none"
              stroke="#0b140d" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>
        <div>
          <p style={{
            color: "rgba(74,222,128,0.75)",
            fontSize: "0.68rem",
            fontWeight: 500,
            letterSpacing: "2.5px",
            textTransform: "uppercase",
            margin: "0 0 6px 0",
          }}>Sistema de Gestão de Igreja</p>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "2.2rem",
            fontWeight: 700,
            color: "#fff",
            letterSpacing: "-0.8px",
            lineHeight: 1,
            margin: 0,
          }}>Membresia</h1>
        </div>
      </div>

      {/* Frase */}
      <p style={{
        color: "rgba(255,255,255,0.55)",
        fontSize: "0.92rem",
        fontWeight: 300,
        lineHeight: 1.75,
        maxWidth: 480,
        marginBottom: 40,
        borderLeft: "2px solid rgba(74,222,128,0.35)",
        paddingLeft: 16,
      }}>
        "Uma igreja bem organizada é uma igreja livre para cumprir sua missão — cuide do seu rebanho com excelência."
      </p>

      {/* Grid de funcionalidades */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {features.map((f, i) => (
          <div key={i} className="feat-card" style={{
            display: "flex",
            gap: 12,
            padding: "14px 16px",
            background: "#1e3f28",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10,
            animation: `fadeUp 0.45s ease ${0.05 + i * 0.07}s both`,
            transition: "border-color 0.2s, background 0.2s",
          }}>
            <div style={{
              width: 32, height: 32, flexShrink: 0,
              background: "rgba(74,222,128,0.12)",
              border: "1px solid rgba(74,222,128,0.18)",
              borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {f.icon}
            </div>
            <div>
              <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "0.82rem", fontWeight: 500, margin: "0 0 2px 0" }}>
                {f.label}
              </p>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.75rem", margin: 0, lineHeight: 1.4 }}>
                {f.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Rodapé — sociedades */}
      <div style={{
        marginTop: 28,
        paddingTop: 20,
        borderTop: "1px solid rgba(255,255,255,0.1)",
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
      }}>
        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem" }}>Sociedades suportadas:</span>
        {["UMP", "UPA", "UPH", "SAF", "UCP", "EBD"].map((s) => (
          <span key={s} style={{
            background: "rgba(74,222,128,0.1)",
            border: "1px solid rgba(74,222,128,0.2)",
            color: "rgba(74,222,128,0.75)",
            fontSize: "0.7rem",
            fontWeight: 500,
            padding: "2px 9px",
            borderRadius: 99,
            letterSpacing: "0.5px",
          }}>{s}</span>
        ))}
      </div>
    </MarketingShell>
  );
};

export default LoginPage;
