import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { routeAccessMap } from "./lib/settings";
import { NextResponse } from "next/server";

const matchers = Object.keys(routeAccessMap).map((route) => ({
  matcher: createRouteMatcher([route]),
  allowedRoles: routeAccessMap[route],
}));

export default clerkMiddleware(async (auth, req) => {
  const authData = await auth();

  if (!authData.userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  const roles = (authData.sessionClaims?.metadata as { roles?: string[] })?.roles ?? [];

  if (roles.length === 0) return;

  for (const { matcher, allowedRoles } of matchers) {
    if (matcher(req) && !allowedRoles.some((r) => roles.includes(r))) {
      return NextResponse.redirect(new URL(`/dashboard`, req.url));
    }
  }
});

export const config = {
  matcher: [
    "/",
     "/dashboard(.*)",  // ← adiciona isso
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
    "/(api|trpc)(.*)",
  ],
};