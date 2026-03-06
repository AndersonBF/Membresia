// src/components/Navbar.tsx
import { UserButton } from "@clerk/nextjs"
import Image from "next/image"
import { currentUser } from "@clerk/nextjs/server"
import DarkModeToggle from "./Darkmodetoggle"
import NotificationBell from "./NotificationBell"

const Navbar = async () => {
  const user = await currentUser()
  const roles = (user?.publicMetadata?.roles as string[]) ?? []
  const isAdmin = roles.includes("admin") || roles.includes("superadmin")

  const roleLabel = roles
    .filter((r) => r !== "member")
    .map((r) => r.charAt(0).toUpperCase() + r.slice(1))
    .join(", ") || "Membro"

  return (
    <div className="flex items-center justify-between p-4">
      {/* Busca */}
      <div className="hidden md:flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-3">
        <Image src="/search.png" alt="" width={14} height={14} />
        <input
          type="text"
          placeholder="Buscar..."
          className="w-[200px] p-2 bg-transparent outline-none"
        />
      </div>

      {/* Direita */}
      <div className="flex items-center gap-4 justify-end w-full md:w-auto">
        {/* Sino de notificações — só para admin */}
        {isAdmin && <NotificationBell />}

        <DarkModeToggle />

        <div className="flex flex-col text-right">
          <span className="text-xs leading-3 font-medium">{user?.firstName}</span>
          <span className="text-[10px] text-gray-500">{roleLabel}</span>
        </div>

        <UserButton />
      </div>
    </div>
  )
}

export default Navbar