// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { routeAccessMap } from "./lib/settings";
import { getSubdomainFromHost, isKnownTenant, getDemoTenants, listTenants } from "./lib/tenant";
import { NextResponse } from "next/server";

const matchers = Object.keys(routeAccessMap).map((route) => ({
  matcher: createRouteMatcher([route]),
  allowedRoles: routeAccessMap[route],
}));

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  const pathname = req.nextUrl.pathname;

  // ============================
  // 🔥 MULTI-IGREJA POR SUBDOMÍNIO
  // ============================
  const host = req.headers.get("host");
  const sub = getSubdomainFromHost(host);
  const tenantsConfigured = listTenants().length > 0;

  // Subdomínio não cadastrado → página "em breve".
  // (Só entra em ação quando há tenants configurados; sem env, comporta-se como antes.)
  if (
    tenantsConfigured &&
    sub &&
    !isKnownTenant(sub) &&
    !getDemoTenants().includes(sub) &&
    pathname !== "/em-breve"
  ) {
    return NextResponse.rewrite(new URL("/em-breve", req.url));
  }

  // ============================
  // 🔥 API MOBILE PÚBLICA
  // ============================
  if (pathname.startsWith("/api/mobile")) {
    return NextResponse.next();
  }

  // ============================
  // 🔥 API PÚBLICA: "Quero visitar"
  // ============================
  if (pathname.startsWith("/api/visit")) {
    return NextResponse.next();
  }

  // ============================
  // 🔥 OUTRAS APIs PROTEGIDAS
  // ============================
  if (pathname.startsWith("/api")) {
    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // ============================
  // 🔥 ROTAS PÚBLICAS
  // ============================
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // ============================
  // 🔥 WEB PROTEGIDA
  // ============================
  if (!userId) {
    // Home pública (visitante) — acessível sem login
    if (pathname === "/") {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  const roles =
    (sessionClaims?.metadata as { roles?: string[] })?.roles ?? [];

  // ============================
  // 🔥 ISOLAMENTO ENTRE IGREJAS
  // Usuário só acessa o subdomínio da própria igreja. Superadmin é isento.
  // Usuários sem `church` (ainda não marcados) não são bloqueados (compatibilidade).
  // ============================
  const userChurch = (sessionClaims?.metadata as { church?: string })?.church;
  if (
    tenantsConfigured &&
    sub &&
    isKnownTenant(sub) &&
    userChurch &&
    userChurch !== sub &&
    !roles.includes("superadmin") &&
    pathname !== "/acesso-negado"
  ) {
    return NextResponse.redirect(new URL("/acesso-negado", req.url));
  }

  const groupRoles = [
    "ump", "upa", "uph", "saf", "ucp",
    "diaconia", "conselho", "ministerio", "ebd",
  ];

  const isMember     = roles.includes("member");
  const isPastor     = roles.includes("pastor");
  const isAdmin      = roles.includes("admin") || roles.includes("superadmin") || isPastor;
  const hasGroupRole = roles.some((r) => groupRoles.includes(r));

  // ============================
  // 🔥 SEM ROLE → MEMBER
  // ============================
  if (roles.length === 0) {
    if (pathname !== "/member") {
      return NextResponse.redirect(new URL("/member", req.url));
    }
    return NextResponse.next();
  }

  // ============================
  // 🔥 REDIRECT INICIAL (só na raiz "/")
  // ============================
  if (pathname === "/") {
    if (isPastor)     return NextResponse.redirect(new URL("/pastor", req.url));
    if (isAdmin)      return NextResponse.redirect(new URL("/admin", req.url));
    if (isMember)     return NextResponse.redirect(new URL("/member", req.url));
    if (hasGroupRole) {
      const firstGroup = roles.find((r) => groupRoles.includes(r))!;
      return NextResponse.redirect(new URL(`/${firstGroup}`, req.url));
    }
    return NextResponse.redirect(new URL("/member", req.url));
  }

  // ============================
  // 🔥 CONTROLE POR ROLE
  // ============================
  for (const { matcher, allowedRoles } of matchers) {
    if (matcher(req)) {
      const hasAccess = allowedRoles.some((r) => roles.includes(r));

      if (!hasAccess) {
        // Pastor bypass → hub do pastor
        if (isPastor) {
          if (pathname !== "/pastor") {
            return NextResponse.redirect(new URL("/pastor", req.url));
          }
          return NextResponse.next();
        }

        // Admin bypass
        if (isAdmin) {
          if (pathname !== "/admin") {
            return NextResponse.redirect(new URL("/admin", req.url));
          }
          return NextResponse.next();
        }

        // Tem role member → vai para /member
        if (isMember) {
          if (pathname !== "/member") {
            return NextResponse.redirect(new URL("/member", req.url));
          }
          return NextResponse.next();
        }

        // Tem role de grupo → vai para o grupo
        const firstGroup = roles.find((r) => groupRoles.includes(r));
        if (firstGroup) {
          const targetPath = `/${firstGroup}`;
          if (pathname !== targetPath) {
            return NextResponse.redirect(new URL(targetPath, req.url));
          }
          return NextResponse.next();
        }

        if (pathname !== "/member") {
          return NextResponse.redirect(new URL("/member", req.url));
        }
        return NextResponse.next();
      }
    }
  }

  // Repassa a rota atual para o servidor (usado no registro de acessos).
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
});

export const config = {
  matcher: [
    "/",
    "/member(.*)",
    "/admin(.*)",
    "/pastor(.*)",
    "/ump(.*)",
    "/upa(.*)",
    "/uph(.*)",
    "/saf(.*)",
    "/ucp(.*)",
    "/diaconia(.*)",
    "/conselho(.*)",
    "/ministerio(.*)",
    "/ebd(.*)",
    "/list(.*)",
    "/agenda(.*)",
    "/calendario-geral(.*)",
    "/sermons(.*)",
    "/gallery(.*)",
    "/tithes(.*)",
    "/profile(.*)",
    "/settings(.*)",
    "/about(.*)",
    "/api/mobile(.*)",
    "/api/role(.*)",
    "/api/sermons(.*)",
    "/api/settings(.*)",
    "/api/(.*)",
  ],
};