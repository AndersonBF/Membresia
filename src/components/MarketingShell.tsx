"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LoginPanel from "./LoginPanel";

const NAV_LINKS = [
  { label: "Funcionalidades", href: "/funcionalidades" },
  { label: "Preços", href: "/precos" },
  { label: "Sobre", href: "/sobre" },
  { label: "Blog", href: "/blog" },
  { label: "Contato", href: "/contato" },
];

export default function MarketingShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'DM Sans', sans-serif",
      background: "#080f0a",
      color: "#fff",
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500&display=swap');

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .login-input { display: block; }
        .login-input::placeholder { color: rgba(255,255,255,0.2); }
        .login-input:focus {
          border-color: rgba(74,222,128,0.45) !important;
          background: rgba(255,255,255,0.07) !important;
          outline: none;
        }
        .login-btn:hover {
          background: #16a34a !important;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(22,163,74,0.3) !important;
        }
        .login-btn:active { transform: scale(0.99); }
        .nav-link { transition: color 0.15s, background 0.15s; }
        .nav-link:hover { color: #fff !important; background: rgba(255,255,255,0.06) !important; }
        .nav-link-active { color: #4ade80 !important; }

        @media (max-width: 900px) {
          .split-left  { display: none !important; }
          .split-right { width: 100% !important; }
        }
      ` }} />

      {/* NAVBAR */}
      <nav style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        zIndex: 100,
        height: 54,
        display: "flex",
        alignItems: "center",
        padding: "0 40px",
        gap: 32,
        background: "rgba(8,15,10,0.9)",
        backdropFilter: "blur(14px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        {/* Logo */}
        <Link href="/sign-in" style={{ display: "flex", alignItems: "center", gap: 9, flexShrink: 0, textDecoration: "none" }}>
          <div style={{
            width: 26, height: 26,
            background: "#15803d",
            borderRadius: 6,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="7" r="4" />
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            </svg>
          </div>
          <span style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "0.95rem",
            fontWeight: 700,
            color: "#fff",
            letterSpacing: "-0.2px",
          }}>Membresia</span>
        </Link>

        <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.1)" }} />

        {/* Links */}
        <div style={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
          {NAV_LINKS.map(({ label, href }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href}
                className={`nav-link${active ? " nav-link-active" : ""}`}
                style={{
                  color: active ? "#4ade80" : "rgba(255,255,255,0.45)",
                  fontSize: "0.83rem",
                  textDecoration: "none",
                  padding: "5px 12px",
                  borderRadius: 6,
                }}>
                {label}
              </Link>
            );
          })}
        </div>

        {/* CTAs */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <Link href="/sign-in" style={{
            color: "rgba(255,255,255,0.45)",
            fontSize: "0.83rem",
            textDecoration: "none",
            padding: "5px 12px",
          }}>Entrar</Link>
          <Link href="/contato" style={{
            background: "#15803d",
            color: "#fff",
            fontSize: "0.83rem",
            fontWeight: 500,
            textDecoration: "none",
            padding: "6px 14px",
            borderRadius: 6,
            letterSpacing: "0.2px",
          }}>Solicitar acesso</Link>
        </div>
      </nav>

      {/* BODY */}
      <div style={{ flex: 1, display: "flex", paddingTop: 54 }}>
        {/* LEFT — 67% */}
        <div className="split-left" style={{
          width: "67%",
          background: "#162d1e",
          borderRight: "1px solid rgba(255,255,255,0.07)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 72px",
          position: "relative",
          overflow: "hidden",
          overflowY: "auto",
        }}>
          {/* glow */}
          <div style={{
            position: "absolute", top: "-5%", right: "5%",
            width: 500, height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(22,163,74,0.09) 0%, transparent 65%)",
            pointerEvents: "none",
          }} />
          {children}
        </div>

        {/* RIGHT — 33% */}
        <LoginPanel />
      </div>
    </div>
  );
}
