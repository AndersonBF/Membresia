import MarketingShell from "@/components/MarketingShell";

const plans = [
  {
    name: "Básico",
    price: "Gratuito",
    period: "",
    description: "Ideal para igrejas pequenas que estão começando sua jornada digital.",
    features: [
      "Até 50 membros",
      "Gestão de presença",
      "1 sociedade interna",
      "Comunicados básicos",
      "Suporte por e-mail",
    ],
    cta: "Começar grátis",
    highlight: false,
  },
  {
    name: "Essencial",
    price: "R$ 49",
    period: "/mês",
    description: "Para igrejas em crescimento que precisam de mais controle e organização.",
    features: [
      "Até 300 membros",
      "Todas as sociedades (UMP, UPA, UPH, SAF, UCP, EBD)",
      "Controle financeiro",
      "Calendário completo",
      "Exportação para Excel",
      "Suporte prioritário",
    ],
    cta: "Solicitar acesso",
    highlight: true,
  },
  {
    name: "Completo",
    price: "R$ 99",
    period: "/mês",
    description: "Para igrejas consolidadas que precisam de recursos avançados e sem limites.",
    features: [
      "Membros ilimitados",
      "Múltiplos administradores",
      "Galeria de fotos",
      "Relatórios avançados",
      "API de integração",
      "Suporte dedicado",
    ],
    cta: "Solicitar acesso",
    highlight: false,
  },
];

export default function PrecosPage() {
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
        }}>Planos e preços</p>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "2rem",
          fontWeight: 700,
          color: "#fff",
          letterSpacing: "-0.6px",
          lineHeight: 1.15,
          margin: "0 0 14px 0",
        }}>Invista na organização<br />da sua congregação</h1>
        <p style={{
          color: "rgba(255,255,255,0.5)",
          fontSize: "0.88rem",
          lineHeight: 1.7,
          maxWidth: 460,
          margin: 0,
        }}>
          Planos acessíveis para igrejas de todos os tamanhos. Sem taxas escondidas, sem surpresas.
        </p>
      </div>

      {/* Cards de planos */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        {plans.map((plan, i) => (
          <div key={i} style={{
            padding: "22px 18px",
            background: plan.highlight ? "rgba(21,128,61,0.2)" : "#1e3f28",
            border: plan.highlight ? "1px solid rgba(74,222,128,0.4)" : "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            display: "flex",
            flexDirection: "column",
            gap: 0,
            position: "relative",
            animation: `fadeUp 0.45s ease ${0.1 + i * 0.1}s both`,
          }}>
            {plan.highlight && (
              <div style={{
                position: "absolute",
                top: -10, left: "50%",
                transform: "translateX(-50%)",
                background: "#15803d",
                color: "#fff",
                fontSize: "0.65rem",
                fontWeight: 600,
                padding: "3px 12px",
                borderRadius: 99,
                letterSpacing: "0.8px",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}>Mais popular</div>
            )}

            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.75rem", fontWeight: 500, margin: "0 0 8px 0", letterSpacing: "0.5px" }}>
              {plan.name}
            </p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 2, marginBottom: 10 }}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.7rem", fontWeight: 700, color: "#fff" }}>
                {plan.price}
              </span>
              {plan.period && (
                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.78rem" }}>{plan.period}</span>
              )}
            </div>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.73rem", lineHeight: 1.5, marginBottom: 16 }}>
              {plan.description}
            </p>

            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px 0", display: "flex", flexDirection: "column", gap: 7 }}>
              {plan.features.map((feat, j) => (
                <li key={j} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.73rem", lineHeight: 1.4 }}>{feat}</span>
                </li>
              ))}
            </ul>

            <div style={{
              marginTop: "auto",
              padding: "9px 0",
              background: plan.highlight ? "#15803d" : "rgba(255,255,255,0.07)",
              border: plan.highlight ? "none" : "1px solid rgba(255,255,255,0.1)",
              borderRadius: 7,
              textAlign: "center",
              fontSize: "0.78rem",
              fontWeight: 500,
              color: plan.highlight ? "#fff" : "rgba(255,255,255,0.5)",
              cursor: "pointer",
            }}>
              {plan.cta}
            </div>
          </div>
        ))}
      </div>

      <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.72rem", marginTop: 20, textAlign: "center" }}>
        Todos os planos incluem 14 dias de teste gratuito. Cancele a qualquer momento.
      </p>
    </MarketingShell>
  );
}
