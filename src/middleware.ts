import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { routeAccessMap } from "./lib/settings";
import { NextResponse } from "next/server";

const matchers = Object.keys(routeAccessMap).map((route) => ({
  matcher: createRouteMatcher([route]),
  allowedRoles: routeAccessMap[route],
}));

// Rotas públicas (Login, Cadastro e APIs que o App consome)
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)", 
  "/sign-up(.*)",
  "/api/(.*)", // Libera APIs para o App funcionar
])

// Rotas de Roles (Páginas que o App e a Web compartilham)
const isRolePage = createRouteMatcher([
  "/ump(.*)", "/upa(.*)", "/uph(.*)", "/saf(.*)", "/ucp(.*)", 
  "/diaconia(.*)", "/conselho(.*)", "/ministerio(.*)", "/ebd(.*)"
])

export default clerkMiddleware(async (auth, req) => {
  // 1. Se for API ou Rota Pública, deixa passar direto (ajuda o App)
  if (isPublicRoute(req)) {
    return NextResponse.next()
  }

  const authData = await auth();

  // 2. Se for uma página de Role e NÃO houver usuário logado:
  // Permitimos o acesso para não travar o App, mas na Web o Clerk 
  // identificará que não há sessão se você usar componentes <SignedIn>
  if (isRolePage(req) && !authData.userId) {
    return NextResponse.next()
  }

  // 3. Proteção para rotas restritas (Admin, Listas, Agenda, etc.)
  if (!authData.userId && !isRolePage(req)) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // 4. Lógica de permissões por Role (Para quando o usuário estiver logado na Web)
  if (authData.userId) {
    const roles = (authData.sessionClaims?.metadata as { roles?: string[] })?.roles ?? [];
    
    for (const { matcher, allowedRoles } of matchers) {
      if (matcher(req) && !allowedRoles.some((r) => roles.includes(r))) {
        // Redirecionamentos de segurança baseados em cargo...
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
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
