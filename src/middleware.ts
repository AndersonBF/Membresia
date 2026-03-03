import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { routeAccessMap } from "./lib/settings";
import { NextResponse } from "next/server";

const matchers = Object.keys(routeAccessMap).map((route) => ({
  matcher: createRouteMatcher([route]),
  allowedRoles: routeAccessMap[route],
}));

// 1. Rotas que o App usa (Liberadas para não dar 401/404 no App)
const isAppApi = createRouteMatcher([
  "/api/mobile(.*)", 
  "/api/roles(.*)"
])

// 2. Rotas Públicas da Web (Login/Cadastro)
const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"])

export default clerkMiddleware(async (auth, req) => {
  // REGRA PARA O APP: Se for uma API que o App usa, deixa passar direto
  if (isAppApi(req)) {
    return NextResponse.next()
  }

  // REGRA PARA A WEB (PÚBLICO): Deixa passar login/cadastro
  if (isPublicRoute(req)) {
    return NextResponse.next()
  }

  const authData = await auth();

  // REGRA PARA A WEB (PROTEGIDO): Se não estiver logado, manda para /sign-in
  if (!authData.userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // --- SUA LÓGICA ORIGINAL DE PERMISSÕES PARA A WEB ---
  const roles = (authData.sessionClaims?.metadata as { roles?: string[] })?.roles ?? [];
  if (roles.length === 0) return;

  for (const { matcher, allowedRoles } of matchers) {
    if (matcher(req) && !allowedRoles.some((r) => roles.includes(r))) {
      if (roles.includes("admin") || roles.includes("superadmin")) {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      const groupRoles = ["ump", "upa", "uph", "saf", "ucp", "diaconia", "conselho", "ministerio", "ebd"];
      const firstGroup = roles.find((r) => groupRoles.includes(r));
      if (firstGroup) {
        return NextResponse.redirect(new URL(`/${firstGroup}`, req.url));
      }
      return NextResponse.redirect(new URL("/member", req.url));
    }
  }
});

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
    "/list/broadcasts(.*)",
    "/agenda(.*)",
    "/calendario-geral(.*)",
    "/(api|trpc)(.*)",
  ],
};
