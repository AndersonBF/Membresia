"use client";

import { useState } from "react";
import Link from "next/link";
import Menu from "@/components/Menu";
import { PanelLeftClose, PanelLeft } from "lucide-react";

export default function Sidebar() {
  const [open, setOpen] = useState(true);

  return (
    <>
      {open && (
        <div className="sidebar-scroll relative w-[14%] md:w-[8%] lg:w-[16%] xl:w-[14%] p-4 bg-gradient-to-b from-green-900 to-emerald-950 h-full overflow-y-auto flex-shrink-0">
          <button
            onClick={() => setOpen(false)}
            title="Ocultar menu"
            className="absolute top-3 right-3 text-white/50 hover:text-white transition"
          >
            <PanelLeftClose size={18} />
          </button>

          <Link href="/" className="flex items-center justify-center lg:justify-start gap-2">
            <span className="hidden lg:block font-bold"></span>
          </Link>
          <Menu />
        </div>
      )}

      {!open && (
        <div className="flex-shrink-0 bg-gradient-to-b from-green-900 to-emerald-950 h-full flex justify-center pt-4">
          <button
            onClick={() => setOpen(true)}
            title="Mostrar menu"
            className="h-9 w-9 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            <PanelLeft size={18} />
          </button>
        </div>
      )}
    </>
  );
}
