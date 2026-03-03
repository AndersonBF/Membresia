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

  // ================================
  // 🔥 REGRA 1 — API MOBILE PÚBLICA
  // ================================
  if (pathname.startsWith("/api/mobile")) {
    return NextResponse.next();
  }

  // ================================
  // 🔥 REGRA 2 — OUTRAS APIs PROTEGIDAS
  // ================================
  if (pathname.startsWith("/api")) {
    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401 }
      );
    }

    return NextResponse.next();
  }

  // ================================
  // 🔥 REGRA 3 — ROTAS PÚBLICAS WEB
  // ================================
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // ================================
  // 🔥 REGRA 4 — WEB PROTEGIDA
  // ================================
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  const roles =
    (sessionClaims?.metadata as { roles?: string[] })?.roles ?? [];

  if (roles.length === 0) {
    return NextResponse.redirect(new URL("/member", req.url));
  }

  // ================================
  // 🔥 REGRA 5 — CONTROLE POR ROLE
  // ================================
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
    "/api/mobile(.*)",  // 🔥 continua passando pelo middleware
    "/api/role(.*)",
  ],
};