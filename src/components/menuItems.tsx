import {
  Home, Users, Church, Shield, HandHelping,
  Layers, Calendar, Megaphone, DollarSign,
  FileText, User, Settings, LogOut, Key,
  Heart, Info, Image, Youtube, CalendarDays,
} from "lucide-react";

const adminRoles = ["admin", "superadmin"];
const allRoles = ["admin", "superadmin", "ump", "upa", "uph", "saf", "ucp", "diaconia", "conselho", "ministerio", "ebd", "member"];
const staffRoles = ["admin", "superadmin", "ump", "upa", "uph", "saf", "ucp", "diaconia", "conselho", "ministerio", "ebd"];

export const menuItems = [
  {
    title: "MENU",
    items: [
      {
        icon: Home,
        label: "Início",
        href: "/member",
        visible: allRoles,
        hiddenForSociedades: false,
      },
      {
        icon: Info,
        label: "Saiba Mais",
        href: "/about",
        visible: allRoles,
        hiddenForSociedades: false,
      },
      {
        icon: CalendarDays,
        label: "Agenda Semanal",
        href: "/agenda",
        visible: allRoles,
        hiddenForSociedades: false,
      },
      {
        icon: Users,
        label: "Membros",
        href: "/list/members",
        visible: adminRoles,
        hiddenForSociedades: false,
      },
      {
        icon: Church,
        label: "Sociedades Internas",
        href: "/list/internalsociety",
        visible: allRoles,
        hiddenForSociedades: true,
      },
      {
        icon: Shield,
        label: "Conselho",
        href: "/list/council",
        visible: allRoles,
        hiddenForSociedades: true,
      },
      {
        icon: HandHelping,
        label: "Diaconia",
        href: "/list/diaconate",
        visible: allRoles,
        hiddenForSociedades: true,
      },
      {
        icon: Layers,
        label: "Ministérios",
        href: "/list/ministry",
        visible: allRoles,
        hiddenForSociedades: true,
      },
      {
        icon: Calendar,
        label: "Eventos da Igreja",
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
        icon: Youtube,
        label: "Sermões",
        href: "/sermons",
        visible: allRoles,
        hiddenForSociedades: false,
      },
      {
        icon: Image,
        label: "Galeria",
        href: "/gallery",
        visible: allRoles,
        hiddenForSociedades: false,
      },
      {
        icon: Heart,
        label: "Dízimos e Ofertas",
        href: "/tithes",
        visible: allRoles,
        hiddenForSociedades: false,
      },
      {
        icon: DollarSign,
        label: "Financeiro",
        href: "/list/finance",
        visible: adminRoles,
        hiddenForSociedades: true,
      },
      {
        icon: FileText,
        label: "Documentos",
        href: "/list/documents",
        visible: staffRoles,
        hiddenForSociedades: false,
      },
      {
        icon: Key,
        label: "Credenciais",
        href: "/admin/credenciais",
        visible: adminRoles,
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
        visible: adminRoles,
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