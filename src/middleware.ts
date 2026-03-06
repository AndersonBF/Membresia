import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { routeAccessMap } from "./lib/settings";
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
  // 🔥 API MOBILE PÚBLICA
  // ============================
  if (pathname.startsWith("/api/mobile")) {
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
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  const roles =
    (sessionClaims?.metadata as { roles?: string[] })?.roles ?? [];

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
  // 🔥 CONTROLE POR ROLE (SEM LOOP)
  // ============================
  for (const { matcher, allowedRoles } of matchers) {
    if (matcher(req)) {
      const hasAccess = allowedRoles.some((r) => roles.includes(r));

      if (!hasAccess) {
        // Admin bypass
        if (roles.includes("admin") || roles.includes("superadmin")) {
          if (pathname !== "/admin") {
            return NextResponse.redirect(new URL("/admin", req.url));
          }
          return NextResponse.next();
        }

        const groupRoles = [
          "ump", "upa", "uph", "saf", "ucp",
          "diaconia", "conselho", "ministerio", "ebd",
        ];

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
    "/ministerio",
    "/ministerio/(.*)",   // ← cobre /ministerio/[id] e /ministerio/[id]/galeria etc.
    "/ebd(.*)",
    "/list(.*)",
    "/agenda(.*)",
    "/calendario-geral(.*)",
    "/about(.*)",
    "/sermons(.*)",
    "/gallery(.*)",
    "/tithes(.*)",
    "/profile(.*)",
    "/settings(.*)",
    "/api/mobile(.*)",
    "/api/role(.*)",
    "/api/(.*)",
  ],
};