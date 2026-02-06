// src/components/menu/menuItems.ts
import {
  Home,
  Users,
  Church,
  Shield,
  HandHelping,
  Layers,
  CheckSquare,
  Calendar,
  MessageSquare,
  Megaphone,
  DollarSign,
  FileText,
  User,
  Settings,
  LogOut,
} from "lucide-react";

export const menuItems = [
  {
    title: "MENU",
    items: [
      {
        icon: Home,
        label: "Home",
        href: "/",
        visible: ["admin", "position", "member", "parent"],
      },
      {
        icon: Users,
        label: "Membros",
        href: "/list/members",
        visible: ["admin", "position"],
      },
      {
        icon: Church,
        label: "Sociedades Internas",
        href: "/list/internalsociety",
        visible: ["admin", "position"],
      },
      {
        icon: Shield,
        label: "Conselho",
        href: "/list/council",
        visible: ["admin", "position"],
      },
      {
        icon: HandHelping,
        label: "Diaconia",
        href: "/list/diaconate",
        visible: ["admin", "position", "member", "parent"],
      },
      {
        icon: Layers,
        label: "Ministérios",
        href: "/list/ministry",
        visible: ["admin", "position", "member", "parent"],
      },
      {
        icon: CheckSquare,
        label: "Presença",
        href: "/list/attendance",
        visible: ["admin", "position", "member", "parent"],
      },
      {
        icon: Calendar,
        label: "Eventos",
        href: "/list/events",
        visible: ["admin", "position", "member", "parent"],
      },
      {
        icon: MessageSquare,
        label: "Mensagens",
        href: "/list/messages",
        visible: ["admin", "position", "member", "parent"],
      },
      {
        icon: Megaphone,
        label: "Anúncios",
        href: "/list/notice",
        visible: ["admin", "position", "member", "parent"],
      },
      {
        icon: DollarSign,
        label: "Financeiro",
        href: "/list/finance",
        visible: ["admin", "position", "member", "parent"],
      },
      {
        icon: FileText,
        label: "Documentos",
        href: "/list/documents",
        visible: ["admin", "position", "member", "parent"],
      },
    ],
  },
  {
    title: "OTHER",
    items: [
      {
        icon: User,
        label: "Profile",
        href: "/profile",
        visible: ["admin", "position", "member", "parent"],
      },
      {
        icon: Settings,
        label: "Settings",
        href: "/settings",
        visible: ["admin", "position", "member", "parent"],
      },
      {
        icon: LogOut,
        label: "Logout",
        href: "/logout",
        visible: ["admin", "position", "member", "parent"],
      },
    ],
  },
];
