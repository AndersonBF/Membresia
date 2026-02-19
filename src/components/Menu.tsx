"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { menuItems } from "./menuItems";
import { Users, Shield, HandHelping, Music, Baby, UserCircle, GraduationCap } from "lucide-react";
import { Suspense } from "react";

const sociedades = ["ump", "upa", "uph", "saf", "ucp"];
const allRoles = ["ump", "upa", "uph", "saf", "ucp", "diaconia", "conselho", "ministerio", "ebd"];

const societyMap: Record<string, number> = {
  saf: 3, uph: 4, ump: 5, upa: 6, ucp: 7,
}

const UMPIcon = ({ size, className }: { size?: number; className?: string }) => (
  <Image src="/UMP.png" alt="UMP" width={size ?? 20} height={size ?? 20} className={`object-contain ${className ?? ""}`} />
)

const UPAIcon = ({ size, className }: { size?: number; className?: string }) => (
  <Image src="/UPA.png" alt="UPA" width={size ?? 20} height={size ?? 20} className={`object-contain ${className ?? ""}`} />
)

const roleConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  admin:      { label: "Admin",      icon: UserCircle,    color: "text-gray-400" },
  ump:        { label: "UMP",        icon: UMPIcon,       color: "text-blue-400" },
  upa:        { label: "UPA",        icon: UPAIcon,       color: "text-yellow-400" },
  uph:        { label: "UPH",        icon: Users,         color: "text-orange-400" },
  saf:        { label: "SAF",        icon: Users,         color: "text-pink-400" },
  ucp:        { label: "UCP",        icon: Baby,          color: "text-yellow-400" },
  diaconia:   { label: "Diaconia",   icon: HandHelping,   color: "text-teal-400" },
  conselho:   { label: "Conselho",   icon: Shield,        color: "text-indigo-400" },
  ministerio: { label: "Ministério", icon: Music,         color: "text-green-400" },
  ebd:        { label: "EBD",        icon: GraduationCap, color: "text-amber-400" },
}

const roleRouteMap: Record<string, string> = {
  "/list/members":    "/membros",
  "/list/attendance": "/list/attendance",
  "/list/events":     "/list/events",
  "/list/documents":  "/list/documents",
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

  const isSociedade = sociedades.includes(currentRole);
  const isRolePage = allRoles.includes(currentRole);
  const currentRoleConfig = roleConfig[currentRole];

  const resolveHref = (href: string) => {
  if (!isRolePage) return href

  // Início sempre vai para /member
  if (href === "/member") return "/member"

  // Home do grupo
  if (href === "/admin") return `/${currentRole}`

  // Membros do grupo
  if (href === "/list/members") return `/${currentRole}/membros`

  // Outros com roleContext
  if (roleRouteMap[href] !== undefined) {
    const societyId = societyMap[currentRole]
    if (societyId) return `${roleRouteMap[href]}?societyId=${societyId}&roleContext=${currentRole}`
    return `${roleRouteMap[href]}?role=${currentRole}&roleContext=${currentRole}`
  }

  return href
}

  return (
    <div className="mt-4 text-sm">

      {/* BADGE DO ROLE ATUAL */}
      {isRolePage && currentRoleConfig && (
        <div className="flex items-center justify-center px-2 py-4 mb-2 border-b border-green-700">
          <currentRoleConfig.icon size={56} className={currentRoleConfig.color} />
        </div>
      )}

      {menuItems.map((section) => (
        <div key={section.title} className="flex flex-col gap-2">
          <span className="text-2xl hidden lg:block text-white font-light my-4">
            {section.title}
          </span>

          {section.items.map((item) => {
            if (isSociedade && item.hiddenForSociedades) return null;

            const hasAccess = isSuperAdmin || item.visible.some((v) => roles.includes(v));
            if (!hasAccess) return null;

            const Icon = item.icon;
            const href = resolveHref(item.href)
            const isActive = pathname === href.split("?")[0]

            return (
              <Link
                key={item.label}
                href={href}
                className={`flex items-center justify-center lg:justify-start gap-4
                  py-2 md:px-2 rounded-md transition
                  ${isActive
                    ? "bg-green-300 text-green-900"
                    : "text-white hover:bg-green-300 hover:text-green-900"
                  }`}
              >
                <Icon size={20} />
                <span className="hidden lg:block">{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
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