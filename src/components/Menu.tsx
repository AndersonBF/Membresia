// src/components/menu/Menu.tsx
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { menuItems } from "./menuItems";

const Menu = async () => {
  const user = await currentUser();
  const role = user?.publicMetadata.role as string;

  return (
    <div className="mt-4 text-sm">
      {menuItems.map((section) => (
        <div key={section.title} className="flex flex-col gap-2">
          <span className="text-2xl hidden lg:block text-white font-light my-4">
            {section.title}
          </span>

          {section.items.map((item) => {
            if (!item.visible.includes(role)) return null;

            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center justify-center lg:justify-start gap-4
                           text-white py-2 md:px-2 rounded-md
                           hover:bg-green-300 hover:text-green-900 transition"
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
};

export default Menu;
