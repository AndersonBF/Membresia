// src/components/Kbd.tsx
// Selinho que mostra a tecla de atalho ao lado do botão/ação.

export default function Kbd({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <kbd
      className={`hidden sm:inline-flex items-center justify-center min-w-[18px] h-[18px] px-1
        rounded border border-gray-300 bg-black/5 text-[10px] font-sans font-semibold
        leading-none opacity-80 ${className}`}
    >
      {children}
    </kbd>
  )
}
