import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { routeAccessMap } from "./lib/settings";
import { NextResponse } from "next/server";

// ===============================================
// MATCHERS DE PERMISSÃO (WEB)
// ===============================================
const matchers = Object.keys(routeAccessMap).map((route) => ({
  matcher: createRouteMatcher([route]),
  allowedRoles: routeAccessMap[route],
}));

// ===============================================
// ROTAS PÚBLICAS (WEB)
// ===============================================
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;

  // ===============================================
  // 🔥 LIBERA TOTALMENTE AS APIs DO APP MOBILE
  // Isso impede redirecionamento para HTML
  // ===============================================
  if (pathname.startsWith("/api/mobile")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/roles")) {
    return NextResponse.next();
  }

  // ===============================================
  // ROTAS PÚBLICAS (LOGIN / CADASTRO)
  // ===============================================
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // ===============================================
  // PROTEÇÃO DAS ROTAS WEB
  // ===============================================
  const authData = await auth();

  if (!authData.userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  const roles =
    (authData.sessionClaims?.metadata as { roles?: string[] })?.roles ?? [];

  // Se não tiver roles, manda para área padrão
  if (roles.length === 0) {
    return NextResponse.redirect(new URL("/member", req.url));
  }

  // ===============================================
  // CONTROLE DE ACESSO BASEADO EM ROLE
  // ===============================================
  for (const { matcher, allowedRoles } of matchers) {
    if (matcher(req) && !allowedRoles.some((r) => roles.includes(r))) {
      
      // Admin sempre vai para /admin
      if (roles.includes("admin") || roles.includes("superadmin")) {
        return NextResponse.redirect(new URL("/admin", req.url));
      }

      // Grupos internos
      const groupRoles = [
        "ump",
        "upa",
        "uph",
        "saf",
        "ucp",
        "diaconia",
        "conselho",
        "ministerio",
        "ebd",
      ];

      const firstGroup = roles.find((r) => groupRoles.includes(r));

      if (firstGroup) {
        return NextResponse.redirect(new URL(`/${firstGroup}`, req.url));
      }

      // Padrão
      return NextResponse.redirect(new URL("/member", req.url));
    }
  }

  return NextResponse.next();
});

// ===============================================
// CONFIGURAÇÃO DE MATCH
// ===============================================
export const config = {
  matcher: [
    "/",
    "/member(.*)",
    "/admin(.*)",
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
    "/(api|trpc)(.*)", // Continua protegendo APIs web
  ],
};