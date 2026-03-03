import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { routeAccessMap } from "./lib/settings";
import { NextResponse } from "next/server";

const matchers = Object.keys(routeAccessMap).map((route) => ({
  matcher: createRouteMatcher([route]),
  allowedRoles: routeAccessMap[route],
}));

// Rotas públicas da web
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  const pathname = req.nextUrl.pathname;

  // 🔥 REGRA 1 — APIs nunca redirecionam (sempre retornam JSON)
  if (pathname.startsWith("/api")) {
    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401 }
      );
    }

    return NextResponse.next();
  }

  // 🔥 REGRA 2 — Rotas públicas (login/cadastro)
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // 🔥 REGRA 3 — Web protegida
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  const roles =
    (sessionClaims?.metadata as { roles?: string[] })?.roles ?? [];

  if (roles.length === 0) {
    return NextResponse.redirect(new URL("/member", req.url));
  }

  // 🔥 REGRA 4 — Controle de acesso por role
  for (const { matcher, allowedRoles } of matchers) {
    if (matcher(req) && !allowedRoles.some((r) => roles.includes(r))) {
      
      if (roles.includes("admin") || roles.includes("superadmin")) {
        return NextResponse.redirect(new URL("/admin", req.url));
      }

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

      return NextResponse.redirect(new URL("/member", req.url));
    }
  }

  return NextResponse.next();
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
    "/agenda(.*)",
    "/calendario-geral(.*)",
    "/api/mobile(.*)",
    "/api/role(.*)",
  ],
};