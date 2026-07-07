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
      <div style={{ marginBottom: 36 }}>
        <p style={{
          color: "#15803d",
          fontSize: "0.75rem",
          fontWeight: 600,
          letterSpacing: "2.5px",
          textTransform: "uppercase",
          margin: "0 0 12px 0",
        }}>Planos e preços</p>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(2rem, 4vw, 2.8rem)",
          fontWeight: 700,
          color: "#14532d",
          letterSpacing: "-1px",
          lineHeight: 1.15,
          margin: "0 0 14px 0",
        }}>Invista na organização<br />da sua congregação</h1>
        <p style={{
          color: "#1a4d2e",
          fontSize: "1rem",
          lineHeight: 1.7,
          maxWidth: 460,
          margin: 0,
        }}>
          Planos acessíveis para igrejas de todos os tamanhos. Sem taxas escondidas.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        {plans.map((plan, i) => (
          <div key={i} style={{
            padding: "22px 18px",
            background: plan.highlight ? "#14532d" : "#fff",
            border: plan.highlight ? "none" : "1px solid #d1fae5",
            borderRadius: 12,
            display: "flex",
            flexDirection: "column",
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

            <p style={{ color: plan.highlight ? "rgba(255,255,255,0.7)" : "#2d6a4a", fontSize: "0.78rem", fontWeight: 500, margin: "0 0 8px 0" }}>
              {plan.name}
            </p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 2, marginBottom: 10 }}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.7rem", fontWeight: 700, color: plan.highlight ? "#fff" : "#14532d" }}>
                {plan.price}
              </span>
              {plan.period && (
                <span style={{ color: plan.highlight ? "rgba(255,255,255,0.5)" : "#2d6a4a", fontSize: "0.78rem" }}>{plan.period}</span>
              )}
            </div>
            <p style={{ color: plan.highlight ? "rgba(255,255,255,0.6)" : "#2d6a4a", fontSize: "0.78rem", lineHeight: 1.5, marginBottom: 16 }}>
              {plan.description}
            </p>

            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px 0", display: "flex", flexDirection: "column", gap: 8 }}>
              {plan.features.map((feat, j) => (
                <li key={j} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={plan.highlight ? "#4ade80" : "#15803d"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span style={{ color: plan.highlight ? "rgba(255,255,255,0.75)" : "#1a4d2e", fontSize: "0.78rem", lineHeight: 1.4 }}>{feat}</span>
                </li>
              ))}
            </ul>

            <div style={{
              marginTop: "auto",
              padding: "10px 0",
              background: plan.highlight ? "rgba(255,255,255,0.15)" : "#14532d",
              borderRadius: 7,
              textAlign: "center",
              fontSize: "0.82rem",
              fontWeight: 500,
              color: "#fff",
              cursor: "pointer",
            }}>
              {plan.cta}
            </div>
          </div>
        ))}
      </div>

      <p style={{ color: "#2d6a4a", fontSize: "0.78rem", marginTop: 20, textAlign: "center" }}>
        Todos os planos incluem 14 dias de teste gratuito. Cancele a qualquer momento.
      </p>
    </MarketingShell>
  );
}
