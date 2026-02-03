import { role } from "@/lib/data";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/dist/client/link";
import Image from "next/image";

const menuItems = [
  {
    title: "MENU",
    items: [
      {
        icon: "/home.png",
        label: "Home",
        href: "/",
        visible: ["admin", "position", "member", "parent"],
      },
      {
        icon: "/parent.png",
        label: "Membros",
        href: "/list/members",
        visible: ["admin", "position"],
      },
     
     
      {
        icon: "/class.png",
        label: "Sociedades Internas",
        href: "/list/internalsociety",
        visible: ["admin", "position"],
      },
      {
        icon: "/lesson.png",
        label: "Conselho",
        href: "/list/council",
        visible: ["admin", "position"],
      },
      {
        icon: "/exam.png",
        label: "Diaconia",
        href: "/list/diaconate",
        visible: ["admin", "position", "member", "parent"],
      },
      {
        icon: "/assignment.png",
        label: "Ministérios",
        href: "/list/ministry",
        visible: ["admin", "position", "member", "parent"],
      },
      
      {
        icon: "/attendance.png",
        label: "Presença",
        href: "/list/attendance",
        visible: ["admin", "position", "member", "parent"],
      },
      {
        icon: "/calendar.png",
        label: "Eventos no calendário",
        href: "/list/events",
        visible: ["admin", "position", "member", "parent"],
      },
      {
        icon: "/message.png",
        label: "Mensagens",
        href: "/list/messages",
        visible: ["admin", "position", "member", "parent"],
      },
      {
        icon: "/announcement.png",
        label: "Anúncios",
        href: "/list/notice",
        visible: ["admin", "position", "member", "parent"],
      },
      {
        icon: "/result.png",
        label: "Financeiro",
        href: "/list/finance",
        visible: ["admin", "position", "member", "parent"],
      },
      {
        icon: "/announcement.png",
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
        icon: "/profile.png",
        label: "Profile",
        href: "/profile",
        visible: ["admin", "position", "member", "parent"],
      },
      {
        icon: "/setting.png",
        label: "Settings",
        href: "/settings",
        visible: ["admin", "position", "member", "parent"],
      },
      {
        icon: "/logout.png",
        label: "Logout",
        href: "/logout",
        visible: ["admin", "position", "member", "parent"],
      },
    ],
  },
];

const Menu = async () => {

  const user = await currentUser();
  const role = user?.publicMetadata.role as string;
  return (
    <div className="mt-4 text-sm">
      {menuItems.map((i) => (
        <div className="flex flex-col gap-2" key={i.title}>
          <span className="text-2xl hidden lg:block text-white font-light my-4 ">{i.title}</span>

          {i.items.map((item) => {
            if(item.visible.includes(role)) {
              return (
                <Link href={item.href} key={item.label} className="flex items-center justify-center lg:justify-start gap-4 text-gray-100 py-2 md:px-2 rounded-md hover:bg-green-300">
              <Image src={item.icon} alt="" width={20} height={20} />
              <span className="hidden lg:block">{item.label}</span>
            </Link>
              )
            }
          })}
        </div>
      ))}
    </div>
  );
};

export default Menu;
