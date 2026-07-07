import MarketingShell from "@/components/MarketingShell";

const features = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="7" r="4" /><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      </svg>
    ),
    label: "Gestão de Membros",
    desc: "Cadastro completo com foto, histórico de frequência e vínculos com grupos internos.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    label: "Eventos e Calendário",
    desc: "Agenda centralizada por sociedade, com cultos, reuniões e controle de inscrições.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
    label: "Controle de Presença",
    desc: "Frequência por evento com ranking individual e exportação para Excel.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    label: "Finanças",
    desc: "Entradas e saídas por sociedade com relatórios gráficos e balanço mensal.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    label: "Sociedades Internas",
    desc: "UMP, UPA, UPH, SAF, UCP e EBD com diretoria, membros e agenda própria.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    label: "Comunicados",
    desc: "Avisos direcionados a grupos específicos ou a toda a congregação.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" />
      </svg>
    ),
    label: "Painel Administrativo",
    desc: "Visão geral com métricas de crescimento, aniversariantes e próximos eventos.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
      </svg>
    ),
    label: "Documentos",
    desc: "Armazenamento de atas, relatórios anuais e materiais de estudo da igreja.",
  },
];

export default function FuncionalidadesPage() {
  return (
    <MarketingShell>
      <div style={{ marginBottom: 32 }}>
        <p style={{
          color: "#15803d",
          fontSize: "0.75rem",
          fontWeight: 600,
          letterSpacing: "2.5px",
          textTransform: "uppercase",
          margin: "0 0 12px 0",
        }}>O que o Membresia oferece</p>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(2rem, 4vw, 2.8rem)",
          fontWeight: 700,
          color: "#14532d",
          letterSpacing: "-1px",
          lineHeight: 1.15,
          margin: "0 0 14px 0",
        }}>Tudo que sua igreja<br />precisa em um só lugar</h1>
        <p style={{
          color: "#1a4d2e",
          fontSize: "1rem",
          lineHeight: 1.7,
          maxWidth: 460,
          margin: 0,
        }}>
          Do cadastro de membros ao controle financeiro — ferramentas pensadas para igrejas organizadas.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {features.map((f, i) => (
          <div key={i} style={{
            display: "flex",
            gap: 14,
            padding: "16px 18px",
            background: "#fff",
            border: "1px solid #d1fae5",
            borderRadius: 10,
            animation: `fadeUp 0.45s ease ${0.04 + i * 0.06}s both`,
          }}>
            <div style={{
              width: 36, height: 36, flexShrink: 0,
              background: "#f0fdf4",
              borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {f.icon}
            </div>
            <div>
              <p style={{ color: "#14532d", fontSize: "0.88rem", fontWeight: 600, margin: "0 0 4px 0" }}>
                {f.label}
              </p>
              <p style={{ color: "#2d6a4a", fontSize: "0.78rem", margin: 0, lineHeight: 1.5 }}>
                {f.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </MarketingShell>
  );
}
