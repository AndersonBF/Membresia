import MarketingShell from "@/components/MarketingShell";

const channels = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    label: "E-mail",
    value: "contato@membresia.app",
    desc: "Respondemos em até 24 horas",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    label: "WhatsApp",
    value: "+55 (11) 99999-0000",
    desc: "Seg a Sex, das 9h às 18h",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    label: "Suporte técnico",
    value: "suporte@membresia.app",
    desc: "Para usuários com plano ativo",
  },
];

const faqs = [
  {
    q: "Como solicito acesso para minha igreja?",
    a: "Entre em contato pelo e-mail ou WhatsApp. Nossa equipe faz o cadastro inicial e configura o sistema junto com você.",
  },
  {
    q: "Existe período de teste gratuito?",
    a: "Sim, todos os planos têm 14 dias de teste sem necessidade de cartão de crédito.",
  },
  {
    q: "É possível migrar dados de outro sistema?",
    a: "Oferecemos suporte à importação via planilha Excel. Nosso time auxilia no processo sem custo adicional.",
  },
  {
    q: "Os dados ficam seguros na nuvem?",
    a: "Sim. Utilizamos criptografia de ponta a ponta e servidores certificados, em conformidade com a LGPD.",
  },
];

export default function ContatoPage() {
  return (
    <MarketingShell>
      <div style={{ marginBottom: 28 }}>
        <p style={{
          color: "#15803d",
          fontSize: "0.75rem",
          fontWeight: 600,
          letterSpacing: "2.5px",
          textTransform: "uppercase",
          margin: "0 0 12px 0",
        }}>Fale conosco</p>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(2rem, 4vw, 2.8rem)",
          fontWeight: 700,
          color: "#14532d",
          letterSpacing: "-1px",
          lineHeight: 1.15,
          margin: "0 0 12px 0",
        }}>Estamos aqui<br />para ajudar</h1>
        <p style={{
          color: "#1a4d2e",
          fontSize: "1rem",
          lineHeight: 1.7,
          margin: 0,
        }}>
          Dúvidas, solicitações de acesso ou suporte — escolha o canal mais conveniente.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 24 }}>
        {channels.map((c, i) => (
          <div key={i} style={{
            padding: "18px 16px",
            background: "#fff",
            border: "1px solid #d1fae5",
            borderRadius: 10,
            animation: `fadeUp 0.45s ease ${0.08 + i * 0.1}s both`,
          }}>
            <div style={{
              width: 38, height: 38,
              background: "#f0fdf4",
              borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 12,
            }}>
              {c.icon}
            </div>
            <p style={{ color: "#2d6a4a", fontSize: "0.72rem", fontWeight: 600, margin: "0 0 4px 0", letterSpacing: "0.5px", textTransform: "uppercase" }}>
              {c.label}
            </p>
            <p style={{ color: "#14532d", fontSize: "0.85rem", fontWeight: 600, margin: "0 0 4px 0" }}>
              {c.value}
            </p>
            <p style={{ color: "#2d6a4a", fontSize: "0.75rem", margin: 0 }}>
              {c.desc}
            </p>
          </div>
        ))}
      </div>

      <div style={{ borderTop: "1px solid #d1fae5", paddingTop: 20 }}>
        <p style={{
          color: "#15803d",
          fontSize: "0.72rem",
          fontWeight: 600,
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          marginBottom: 14,
        }}>Perguntas frequentes</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {faqs.map((faq, i) => (
            <div key={i} style={{
              padding: "14px 16px",
              background: "#fff",
              border: "1px solid #d1fae5",
              borderRadius: 10,
              animation: `fadeUp 0.45s ease ${0.35 + i * 0.08}s both`,
            }}>
              <p style={{ color: "#14532d", fontSize: "0.88rem", fontWeight: 600, margin: "0 0 5px 0" }}>
                {faq.q}
              </p>
              <p style={{ color: "#2d6a4a", fontSize: "0.82rem", margin: 0, lineHeight: 1.55 }}>
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </MarketingShell>
  );
}
