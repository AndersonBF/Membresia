import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { routeAccessMap } from "./lib/settings";
import { NextResponse } from "next/server";

const matchers = Object.keys(routeAccessMap).map((route) => ({
  matcher: createRouteMatcher([route]),
  allowedRoles: routeAccessMap[route],
}));

// Rotas públicas que não precisam de autenticação
const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"])

// Rotas da API mobile — autenticam via token Bearer, não por redirect
const isMobileApi = createRouteMatcher(["/api/mobile(.*)"])

export default clerkMiddleware(async (auth, req) => {
  // Deixa a API mobile passar — ela valida o token internamente
  if (isMobileApi(req)) {
    return NextResponse.next()
  }

  if (isPublicRoute(req)) {
    return NextResponse.next()
  }

  const authData = await auth();

  if (!authData.userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

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