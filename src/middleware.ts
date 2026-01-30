import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { routeAccessMap } from "./lib/settings";
import { NextResponse } from "next/server";

const matchers = Object.keys(routeAccessMap).map((route) => ({
  matcher: createRouteMatcher([route]),
  allowedRoles: routeAccessMap[route],
}));

export default clerkMiddleware(async (auth, req) => {
  const authData = await auth();

  // 🔒 1. Se não está logado, bloqueia acesso a qualquer rota protegida
  if (!authData.userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  const role = (authData.sessionClaims?.metadata as { role?: string })?.role;

  if (!role) return;

  // 🔐 2. Controle por papel (admin, teacher, etc)
  for (const { matcher, allowedRoles } of matchers) {
    if (matcher(req) && !allowedRoles.includes(role)) {
      return NextResponse.redirect(new URL(`/${role}`, req.url));
    }
  }
});

export const config = {
  matcher: [
    "/admin(.*)",
    "/list(.*)",        // 🔥 adiciona isso
    "/position(.*)",
    "/student(.*)",
    "/(api|trpc)(.*)",
  ],
};

