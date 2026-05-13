import MarketingShell from "@/components/MarketingShell";

const features = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="7" r="4" /><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      </svg>
    ),
    label: "Gestão de Membros",
    desc: "Cadastro completo com foto, histórico de frequência, vínculos familiares e grupos internos. Busca e filtros avançados por nome, função e sociedade.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    label: "Eventos e Calendário",
    desc: "Agenda centralizada com eventos por sociedade, cultos e reuniões especiais. Controle de datas, horários e inscrições.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
    label: "Controle de Presença",
    desc: "Registro de frequência por evento com ranking de presença, histórico individual e exportação para Excel com um clique.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    label: "Finanças",
    desc: "Gestão de entradas e saídas por sociedade. Relatórios gráficos, histórico de transações e balanço mensal.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    label: "Sociedades Internas",
    desc: "Suporte completo a UMP, UPA, UPH, SAF, UCP e EBD. Cada sociedade com sua diretoria, membros e agenda própria.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    label: "Comunicados",
    desc: "Transmissões e avisos direcionados a grupos específicos ou toda a congregação. Controle de leitura e confirmações.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" />
      </svg>
    ),
    label: "Painel Administrativo",
    desc: "Visão geral da igreja com métricas de crescimento, aniversariantes do mês, próximos eventos e resumo financeiro.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
      </svg>
    ),
    label: "Documentos",
    desc: "Armazenamento e organização de documentos da igreja, atas de reunião, relatórios anuais e materiais de estudo.",
  },
];

export default function FuncionalidadesPage() {
  return (
    <MarketingShell>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <p style={{
          color: "rgba(74,222,128,0.75)",
          fontSize: "0.68rem",
          fontWeight: 500,
          letterSpacing: "2.5px",
          textTransform: "uppercase",
          margin: "0 0 10px 0",
        }}>O que o Membresia oferece</p>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "2rem",
          fontWeight: 700,
          color: "#fff",
          letterSpacing: "-0.6px",
          lineHeight: 1.15,
          margin: "0 0 14px 0",
        }}>Tudo que sua igreja<br />precisa em um só lugar</h1>
        <p style={{
          color: "rgba(255,255,255,0.5)",
          fontSize: "0.88rem",
          lineHeight: 1.7,
          maxWidth: 460,
          margin: 0,
        }}>
          Do cadastro de membros ao controle financeiro — ferramentas pensadas para igrejas que querem crescer com organização.
        </p>
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {features.map((f, i) => (
          <div key={i} style={{
            display: "flex",
            gap: 14,
            padding: "16px 18px",
            background: "#1e3f28",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10,
            animation: `fadeUp 0.45s ease ${0.04 + i * 0.06}s both`,
            transition: "border-color 0.2s, background 0.2s",
            cursor: "default",
          }}>
            <div style={{
              width: 38, height: 38, flexShrink: 0,
              background: "rgba(74,222,128,0.12)",
              border: "1px solid rgba(74,222,128,0.18)",
              borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {f.icon}
            </div>
            <div>
              <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "0.83rem", fontWeight: 500, margin: "0 0 4px 0" }}>
                {f.label}
              </p>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.74rem", margin: 0, lineHeight: 1.5 }}>
                {f.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </MarketingShell>
  );
}
