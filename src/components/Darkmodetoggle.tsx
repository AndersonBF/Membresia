"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const DarkModeToggle = () => {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    // O script inline no layout já aplicou a classe .dark antes da pintura.
    // Aqui só sincronizamos o estado do ícone com o que está no <html>.
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <button
      onClick={toggle}
      className="bg-white dark:bg-gray-800 rounded-full w-7 h-7 flex items-center justify-center cursor-pointer transition-colors"
      title={dark ? "Modo claro" : "Modo escuro"}
    >
      {dark ? (
        <Sun size={15} className="text-yellow-400" />
      ) : (
        <Moon size={15} className="text-gray-500" />
      )}
    </button>
  );
};

export default DarkModeToggle;