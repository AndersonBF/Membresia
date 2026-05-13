import MarketingShell from "@/components/MarketingShell";

const values = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
    label: "Serviço com propósito",
    desc: "Acreditamos que tecnologia bem aplicada libera líderes para se dedicarem ao que realmente importa: pessoas.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    label: "Simplicidade antes de tudo",
    desc: "Ferramentas poderosas não precisam ser complicadas. Cada funcionalidade foi pensada para quem não é técnico.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    label: "Confiança e privacidade",
    desc: "Os dados da sua congregação são sagrados. Seguimos os mais altos padrões de segurança e conformidade com a LGPD.",
  },
];

const stats = [
  { value: "200+", label: "Igrejas ativas" },
  { value: "40k+", label: "Membros cadastrados" },
  { value: "99,9%", label: "Disponibilidade" },
  { value: "2022", label: "Ano de fundação" },
];

export default function SobrePage() {
  return (
    <MarketingShell>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p style={{
          color: "rgba(74,222,128,0.75)",
          fontSize: "0.68rem",
          fontWeight: 500,
          letterSpacing: "2.5px",
          textTransform: "uppercase",
          margin: "0 0 10px 0",
        }}>Quem somos</p>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "2rem",
          fontWeight: 700,
          color: "#fff",
          letterSpacing: "-0.6px",
          lineHeight: 1.15,
          margin: "0 0 16px 0",
        }}>Nascemos dentro<br />da igreja</h1>
        <p style={{
          color: "rgba(255,255,255,0.5)",
          fontSize: "0.88rem",
          lineHeight: 1.75,
          maxWidth: 500,
          margin: 0,
          borderLeft: "2px solid rgba(74,222,128,0.3)",
          paddingLeft: 16,
        }}>
          O Membresia surgiu da necessidade real de líderes que enfrentavam planilhas desorganizadas, listas perdidas e comunicação fragmentada. Somos uma equipe que vive a realidade da congregação e construímos a ferramenta que gostaríamos de ter tido.
        </p>
      </div>

      {/* Stats */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 10,
        marginBottom: 28,
      }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            padding: "16px 12px",
            background: "#1e3f28",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10,
            textAlign: "center",
            animation: `fadeUp 0.45s ease ${0.08 + i * 0.08}s both`,
          }}>
            <p style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#4ade80",
              margin: "0 0 4px 0",
            }}>{s.value}</p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem", margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Valores */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {values.map((v, i) => (
          <div key={i} style={{
            display: "flex",
            gap: 16,
            padding: "16px 18px",
            background: "#1e3f28",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10,
            animation: `fadeUp 0.45s ease ${0.35 + i * 0.1}s both`,
          }}>
            <div style={{
              width: 38, height: 38, flexShrink: 0,
              background: "rgba(74,222,128,0.12)",
              border: "1px solid rgba(74,222,128,0.18)",
              borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {v.icon}
            </div>
            <div>
              <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "0.84rem", fontWeight: 500, margin: "0 0 4px 0" }}>
                {v.label}
              </p>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.77rem", margin: 0, lineHeight: 1.55 }}>
                {v.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </MarketingShell>
  );
}
