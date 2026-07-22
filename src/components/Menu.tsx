"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { menuItems } from "./menuItems";
import { Shield, HandHelping, Layers, Baby, UserCircle, GraduationCap } from "lucide-react";
import { Suspense } from "react";

const sociedades = ["ump", "upa", "uph", "saf", "ucp"];
const gruposExtras = ["diaconia", "conselho", "ministerio", "ebd"];
const allRoles = ["ump", "upa", "uph", "saf", "ucp", "diaconia", "conselho", "ministerio", "ebd"];

const societyMap: Record<string, number> = {
  saf: 3, uph: 4, ump: 5, upa: 6, ucp: 7,
}

const UMPIcon = ({ size, className }: { size?: number; className?: string }) => (
  <Image src="/UMP.png" alt="UMP" width={size ?? 20} height={size ?? 20}
    className={`object-contain ${className ?? ""}`} style={{ filter: "brightness(0) invert(1)" }} />
)
const UPAIcon = ({ size, className }: { size?: number; className?: string }) => (
  <Image src="/UPA.png" alt="UPA" width={size ?? 20} height={size ?? 20}
    className={`object-contain ${className ?? ""}`} style={{ filter: "brightness(0) invert(1)" }} />
)
const SAFIcon = ({ size, className }: { size?: number; className?: string }) => (
  <Image src="/SAF.png" alt="SAF" width={size ?? 20} height={size ?? 20}
    className={`object-contain ${className ?? ""}`} style={{ filter: "brightness(0) invert(1)" }} />
)
const UPHIcon = ({ size, className }: { size?: number; className?: string }) => (
  <Image src="/UPH.png" alt="UPH" width={size ?? 20} height={size ?? 20}
    className={`object-contain ${className ?? ""}`} style={{ filter: "brightness(0) invert(1)" }} />
)

const roleConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  admin:      { label: "Admin",      icon: UserCircle,    color: "text-white" },
  ump:        { label: "UMP",        icon: UMPIcon,       color: "text-white" },
  upa:        { label: "UPA",        icon: UPAIcon,       color: "text-white" },
  uph:        { label: "UPH",        icon: UPHIcon,       color: "text-white" },
  saf:        { label: "SAF",        icon: SAFIcon,       color: "text-white" },
  ucp:        { label: "UCP",        icon: Baby,          color: "text-white" },
  diaconia:   { label: "Diaconia",   icon: HandHelping,   color: "text-white" },
  conselho:   { label: "Conselho",   icon: Shield,        color: "text-white" },
  ministerio: { label: "Ministério", icon: Layers,        color: "text-white" },
  ebd:        { label: "EBD",        icon: GraduationCap, color: "text-white" },
}

// /relatorios e /galeria removidos — tratados com condições diretas no resolveHref
const roleRouteMap: Record<string, string> = {
  "/list/members":    "/membros",
  "/list/attendance": "/list/attendance",
  "/list/events":     "/list/events",
  "/list/documents":  "/list/documents",
  "/list/finance":    "/list/finance",
  "/list/broadcasts": "/list/broadcasts",
}

const MenuContent = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useUser();

  const roles = (user?.publicMetadata?.roles as string[]) ?? [];
  const isSuperAdmin = roles.includes("superadmin");

  const roleContext = searchParams.get("roleContext")
  const pathnameRole = pathname.split("/")[1]
  const currentRole = roleContext || (allRoles.includes(pathnameRole) ? pathnameRole : "")

  const ministryId = searchParams.get("ministryId")
  const groupId = ministryId
    || searchParams.get("councilId")
    || searchParams.get("diaconateId")
    || searchParams.get("classId")

  const isPastorContext = pathname === "/pastor" || pathname.startsWith("/pastor/");

  const isSociedade = sociedades.includes(currentRole);
  const isGrupoExtra = gruposExtras.includes(currentRole);
  const isRolePage = allRoles.includes(currentRole);
  const currentRoleConfig = roleConfig[currentRole];

  const useReducedMenu = isSociedade || isGrupoExtra;

  const resolveHref = (href: string) => {
    if (!isRolePage) return href

    // Rotas absolutas de diaconia — nunca reescrever
    if (href.startsWith("/diaconia/")) return href

    if (href === "/member") return "/member"
    if (href === "/admin") return `/${currentRole}`
    if (href === "/list/members") return `/${currentRole}/membros`

    // Rotas que sempre ficam dentro de /<role>/
    if (href === "/galeria")    return `/${currentRole}/galeria`
    if (href === "/relatorios") return `/${currentRole}/relatorios`

    if (roleRouteMap[href] !== undefined) {
      const societyId = societyMap[currentRole]

      if (societyId) {
        return `${roleRouteMap[href]}?societyId=${societyId}&roleContext=${currentRole}`
      }

      if (isGrupoExtra) {
        const idParam = groupId ? `&ministryId=${groupId}` : ""
        return `${roleRouteMap[href]}?roleContext=${currentRole}${idParam}`
      }

      return `${roleRouteMap[href]}?role=${currentRole}&roleContext=${currentRole}`
    }

    return href
  }

  return (
    <div className="mt-4 text-sm">

      {isRolePage && currentRoleConfig && (
        <div className="flex items-center justify-center px-2 py-4 mb-2 border-b border-green-700">
          <currentRoleConfig.icon size={56} className={currentRoleConfig.color} />
        </div>
      )}

      {menuItems.map((section) => {
        const seen = new Set<string>();
        const visibleItems = section.items
          .filter((item) => {
            if ((item as any).showOnlyInPastor && !isPastorContext) return false;
            if (useReducedMenu && item.hiddenForSociedades) return false;
            if (!useReducedMenu && item.showOnlyForSociedades) return false;
            return isSuperAdmin || item.visible.some((v) => roles.includes(v));
          })
          .map((item) => ({ item, href: resolveHref(item.href) }))
          // Remove itens repetidos (mesmo rótulo + rota resolvida),
          // ex.: superadmin veria "Membros" duas vezes numa sociedade.
          .filter(({ item, href }) => {
            const dedupKey = `${item.label}|${href}`;
            if (seen.has(dedupKey)) return false;
            seen.add(dedupKey);
            return true;
          });

        if (visibleItems.length === 0) return null;

        // Agrupa por categoria (item.group), preservando a ordem de aparição.
        const cats: { label: string; entries: typeof visibleItems }[] = [];
        for (const entry of visibleItems) {
          const label = (entry.item as any).group ?? section.title;
          let c = cats.find((x) => x.label === label);
          if (!c) { c = { label, entries: [] }; cats.push(c); }
          c.entries.push(entry);
        }

        return (
          <div key={section.title} className="flex flex-col">
            {cats.map((cat) => (
              <div key={cat.label} className="flex flex-col gap-1">
                <span className="hidden lg:block text-[11px] uppercase tracking-[0.14em] text-white/40 font-semibold mt-6 mb-2 px-2">
                  {cat.label}
                </span>
                <span className="lg:hidden h-px bg-white/10 mx-2 my-3" />

                {cat.entries.map(({ item, href }, index) => {
                  const Icon = item.icon;
                  const isActive = pathname === href.split("?")[0];

                  return (
                    <Link
                      key={`${item.label}-${href}-${index}`}
                      href={href}
                      className={`group relative flex items-center justify-center lg:justify-start gap-3
                        py-2 px-2 lg:px-3 rounded-lg transition-colors
                        ${isActive
                          ? "bg-white/15 text-white font-medium"
                          : "text-white/75 hover:bg-white/10 hover:text-white"
                        }`}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full bg-emerald-300" />
                      )}
                      <Icon size={19} className={isActive ? "text-emerald-300" : "text-white/60 group-hover:text-white"} />
                      <span className="hidden lg:block text-sm">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

const Menu = () => {
  return (
    <Suspense fallback={<div className="mt-4 text-white text-sm">Carregando...</div>}>
      <MenuContent />
    </Suspense>
  )
}

export default Menu;