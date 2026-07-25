import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ptBR } from "@clerk/localizations";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { controlPlaneEnabled } from "@/lib/controlPlane";
import { shouldShowComingSoon } from "@/lib/tenantRegistry";
import EmBrevePage from "./em-breve/page";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Membresia",
  description: "Church Management System",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Com control-plane ativo, subdomínio desconhecido → "em breve" (decidido aqui,
  // no Node, pois o Edge não enxerga os tenants do banco). Sem control-plane, não
  // lemos headers() e o comportamento é idêntico ao anterior.
  let content: React.ReactNode = children;
  if (controlPlaneEnabled()) {
    const { headers } = await import("next/headers");
    if (shouldShowComingSoon(headers().get("host"))) {
      content = <EmBrevePage />;
    }
  }

  return (
    <ClerkProvider localization={ptBR}>

    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Aplica o tema salvo antes da pintura para evitar flash (FOUC) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className={inter.className}>{content} <ToastContainer position="bottom-right" theme="dark"/></body>
    </html>
    </ClerkProvider>
  );
}
