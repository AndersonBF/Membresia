import MarketingShell from "@/components/MarketingShell";

const channels = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    label: "WhatsApp",
    value: "+55 (11) 99999-0000",
    desc: "Seg a Sex, das 9h às 18h",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <p style={{
          color: "rgba(74,222,128,0.75)",
          fontSize: "0.68rem",
          fontWeight: 500,
          letterSpacing: "2.5px",
          textTransform: "uppercase",
          margin: "0 0 10px 0",
        }}>Fale conosco</p>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "2rem",
          fontWeight: 700,
          color: "#fff",
          letterSpacing: "-0.6px",
          lineHeight: 1.15,
          margin: "0 0 12px 0",
        }}>Estamos aqui<br />para ajudar</h1>
        <p style={{
          color: "rgba(255,255,255,0.45)",
          fontSize: "0.86rem",
          lineHeight: 1.7,
          margin: 0,
        }}>
          Dúvidas, solicitações de acesso ou suporte — escolha o canal mais conveniente.
        </p>
      </div>

      {/* Canais de contato */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 22 }}>
        {channels.map((c, i) => (
          <div key={i} style={{
            padding: "18px 16px",
            background: "#1e3f28",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10,
            animation: `fadeUp 0.45s ease ${0.08 + i * 0.1}s both`,
          }}>
            <div style={{
              width: 38, height: 38,
              background: "rgba(74,222,128,0.12)",
              border: "1px solid rgba(74,222,128,0.18)",
              borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 12,
            }}>
              {c.icon}
            </div>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.7rem", fontWeight: 500, margin: "0 0 4px 0", letterSpacing: "0.5px", textTransform: "uppercase" }}>
              {c.label}
            </p>
            <p style={{ color: "rgba(255,255,255,0.88)", fontSize: "0.8rem", fontWeight: 500, margin: "0 0 4px 0" }}>
              {c.value}
            </p>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.72rem", margin: 0 }}>
              {c.desc}
            </p>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.08)",
        paddingTop: 20,
      }}>
        <p style={{
          color: "rgba(255,255,255,0.5)",
          fontSize: "0.72rem",
          fontWeight: 500,
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          marginBottom: 14,
        }}>Perguntas frequentes</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {faqs.map((faq, i) => (
            <div key={i} style={{
              padding: "14px 16px",
              background: "#1e3f28",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10,
              animation: `fadeUp 0.45s ease ${0.35 + i * 0.08}s both`,
            }}>
              <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.8rem", fontWeight: 500, margin: "0 0 5px 0" }}>
                {faq.q}
              </p>
              <p style={{ color: "rgba(255,255,255,0.42)", fontSize: "0.76rem", margin: 0, lineHeight: 1.55 }}>
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </MarketingShell>
  );
}
