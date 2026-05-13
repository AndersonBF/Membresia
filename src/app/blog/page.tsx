import MarketingShell from "@/components/MarketingShell";

const posts = [
  {
    category: "Gestão",
    title: "Como organizar as sociedades internas da sua igreja em 5 passos",
    excerpt: "UMP, UPA, SAF e as demais sociedades têm dinâmicas diferentes. Veja como estruturar cada uma com clareza e sem conflito de agenda.",
    date: "8 mai 2026",
    readTime: "5 min",
  },
  {
    category: "Finanças",
    title: "Transparência financeira: por que sua congregação merece saber",
    excerpt: "Relatórios claros fortalecem a confiança e motivam o dízimo. Entenda como o Membresia facilita a prestação de contas.",
    date: "2 mai 2026",
    readTime: "4 min",
  },
  {
    category: "Presença",
    title: "O segredo das igrejas que retêm membros: acompanhamento de presença",
    excerpt: "Dados de frequência não são só números — são sinais de quem precisa de atenção pastoral. Saiba como usar bem.",
    date: "24 abr 2026",
    readTime: "6 min",
  },
  {
    category: "Comunicação",
    title: "Comunicados que chegam: do mural ao celular de cada membro",
    excerpt: "Avisos perdidos geram faltas nos eventos. Veja como modernizar a comunicação interna sem complicação.",
    date: "17 abr 2026",
    readTime: "3 min",
  },
  {
    category: "Liderança",
    title: "Delegando com confiança: perfis de acesso no sistema da sua igreja",
    excerpt: "Nem tudo precisa passar pelo pastor. Aprenda a configurar permissões para diáconos, secretários e líderes de sociedade.",
    date: "10 abr 2026",
    readTime: "4 min",
  },
];

const categoryColors: Record<string, string> = {
  Gestão: "rgba(74,222,128,0.15)",
  Finanças: "rgba(250,204,21,0.12)",
  Presença: "rgba(96,165,250,0.12)",
  Comunicação: "rgba(167,139,250,0.12)",
  Liderança: "rgba(251,146,60,0.12)",
};

const categoryTextColors: Record<string, string> = {
  Gestão: "rgba(74,222,128,0.8)",
  Finanças: "rgba(250,204,21,0.8)",
  Presença: "rgba(96,165,250,0.8)",
  Comunicação: "rgba(167,139,250,0.8)",
  Liderança: "rgba(251,146,60,0.8)",
};

export default function BlogPage() {
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
        }}>Blog Membresia</p>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "2rem",
          fontWeight: 700,
          color: "#fff",
          letterSpacing: "-0.6px",
          lineHeight: 1.15,
          margin: "0 0 12px 0",
        }}>Gestão de igrejas<br />na prática</h1>
        <p style={{
          color: "rgba(255,255,255,0.45)",
          fontSize: "0.86rem",
          lineHeight: 1.7,
          margin: 0,
        }}>
          Dicas, guias e boas práticas para líderes que querem crescer com organização.
        </p>
      </div>

      {/* Posts */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {posts.map((post, i) => (
          <div key={i} style={{
            padding: "16px 18px",
            background: "#1e3f28",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10,
            cursor: "pointer",
            animation: `fadeUp 0.45s ease ${0.06 + i * 0.07}s both`,
            transition: "border-color 0.2s, background 0.2s",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{
                background: categoryColors[post.category] ?? "rgba(74,222,128,0.1)",
                color: categoryTextColors[post.category] ?? "rgba(74,222,128,0.8)",
                fontSize: "0.66rem",
                fontWeight: 600,
                padding: "2px 9px",
                borderRadius: 99,
                letterSpacing: "0.5px",
              }}>{post.category}</span>
              <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.7rem" }}>
                {post.date} · {post.readTime} de leitura
              </span>
            </div>
            <p style={{ color: "rgba(255,255,255,0.88)", fontSize: "0.84rem", fontWeight: 500, margin: "0 0 5px 0", lineHeight: 1.4 }}>
              {post.title}
            </p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", margin: 0, lineHeight: 1.5 }}>
              {post.excerpt}
            </p>
          </div>
        ))}
      </div>
    </MarketingShell>
  );
}
