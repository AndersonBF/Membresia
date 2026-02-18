import {
  Home, Users, Church, Shield, HandHelping,
  Layers, CheckSquare, Calendar,
  Megaphone, DollarSign, FileText, User, Settings, LogOut,
  Key,
} from "lucide-react";

const allRoles = ["admin", "superadmin", "ump", "upa", "uph", "saf", "ucp", "diaconia", "conselho", "ministerio", "ebd", "member"];
const sociedades = ["ump", "upa", "uph", "saf", "ucp"];

export const menuItems = [
  {
    title: "MENU",
    items: [
      {
        icon: Home,
        label: "Home",
        href: "/admin",
        visible: allRoles,
        hiddenForSociedades: false,
      },
      {
        icon: Users,
        label: "Membros",
        href: "/list/members",
        visible: ["admin", "superadmin"],
        hiddenForSociedades: false,
      },
      {
        icon: Church,
        label: "Sociedades Internas",
        href: "/list/internalsociety",
        visible: ["admin", "superadmin"],
        hiddenForSociedades: true,
      },
      {
        icon: Shield,
        label: "Conselho",
        href: "/list/council",
        visible: ["admin", "superadmin", "conselho"],
        hiddenForSociedades: true,
      },
      {
        icon: HandHelping,
        label: "Diaconia",
        href: "/list/diaconate",
        visible: ["admin", "superadmin", "diaconia"],
        hiddenForSociedades: true,
      },
      {
        icon: Layers,
        label: "Ministérios",
        href: "/list/ministry",
        visible: ["admin", "superadmin", "ministerio"],
        hiddenForSociedades: true,
      },
      {
        icon: CheckSquare,
        label: "Presença",
        href: "/list/attendance",
        visible: allRoles,
        hiddenForSociedades: false,
      },
      {
        icon: Calendar,
        label: "Eventos",
        href: "/list/events",
        visible: allRoles,
        hiddenForSociedades: false,
      },
      {
        icon: Megaphone,
        label: "Anúncios",
        href: "/list/notice",
        visible: allRoles,
        hiddenForSociedades: false,
      },
      {
        icon: DollarSign,
        label: "Financeiro",
        href: "/list/finance",
        visible: ["admin", "superadmin", "conselho"],
        hiddenForSociedades: true,
      },
      {
        icon: FileText,
        label: "Documentos",
        href: "/list/documents",
        visible: allRoles,
        hiddenForSociedades: false,
      },
      {
        icon: Key,
        label: "Credenciais",
        href: "/admin/credenciais",
        visible: ["admin", "superadmin"],
        hiddenForSociedades: true,
      },
    ],
  },
  {
    title: "OTHER",
    items: [
      {
        icon: User,
        label: "Perfil",
        href: "/profile",
        visible: allRoles,
        hiddenForSociedades: false,
      },
      {
        icon: Settings,
        label: "Configurações",
        href: "/settings",
        visible: ["admin", "superadmin"],
        hiddenForSociedades: false,
      },
      {
        icon: LogOut,
        label: "Logout",
        href: "/logout",
        visible: allRoles,
        hiddenForSociedades: false,
      },
    ],
  },
];