import Image from "next/image"
import { Shield, HandHelping, Music, Baby, UserCircle, GraduationCap } from "lucide-react"

// Ícones normais (para os cards da página inicial)
const UMPIcon = ({ size }: { size?: number }) => (
  <Image src="/UMP.png" alt="UMP" width={size ?? 48} height={size ?? 48} className="object-contain" />
)
const UPAIcon = ({ size }: { size?: number }) => (
  <Image src="/UPA.png" alt="UPA" width={size ?? 48} height={size ?? 48} className="object-contain" />
)
const UPHIcon = ({ size }: { size?: number }) => (
  <Image src="/UPH.png" alt="UPH" width={size ?? 48} height={size ?? 48} className="object-contain" />
)
const SAFIcon = ({ size }: { size?: number }) => (
  <Image src="/SAF.png" alt="SAF" width={size ?? 48} height={size ?? 48} className="object-contain" />
)

// Ícones brancos (para o menu quando dentro do role)
const UMPIconWhite = ({ size }: { size?: number }) => (
  <Image src="/UMP.png" alt="UMP" width={size ?? 48} height={size ?? 48} className="object-contain" style={{ filter: "brightness(0) invert(1)" }} />
)
const UPAIconWhite = ({ size }: { size?: number }) => (
  <Image src="/UPA.png" alt="UPA" width={size ?? 48} height={size ?? 48} className="object-contain" style={{ filter: "brightness(0) invert(1)" }} />
)
const UPHIconWhite = ({ size }: { size?: number }) => (
  <Image src="/UPH.png" alt="UPH" width={size ?? 48} height={size ?? 48} className="object-contain" style={{ filter: "brightness(0) invert(1)" }} />
)
const SAFIconWhite = ({ size }: { size?: number }) => (
  <Image src="/SAF.png" alt="SAF" width={size ?? 48} height={size ?? 48} className="object-contain" style={{ filter: "brightness(0) invert(1)" }} />
)

export const roleConfig: Record<string, {
  label: string
  icon: React.ElementType
  iconWhite: React.ElementType
  bg: string       // classe tailwind (para compatibilidade)
  bgHex: string    // cor hex para uso inline
  image: string
}> = {
  admin:      { label: "Admin",      icon: UserCircle,    iconWhite: UserCircle,    bg: "bg-gray-700",   bgHex: "#374151", image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80" },
  ump:        { label: "UMP",        icon: UMPIcon,       iconWhite: UMPIconWhite,  bg: "bg-blue-400",   bgHex: "#60a5fa", image: "/ump_fundo.jpg" },
  upa:        { label: "UPA",        icon: UPAIcon,       iconWhite: UPAIconWhite,  bg: "bg-yellow-500", bgHex: "#eab308", image: "https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=800&q=80" },
  uph:        { label: "UPH",        icon: UPHIcon,       iconWhite: UPHIconWhite,  bg: "bg-orange-500", bgHex: "#f97316", image: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=800&q=80" },
  saf:        { label: "SAF",        icon: SAFIcon,       iconWhite: SAFIconWhite,  bg: "bg-pink-600",   bgHex: "#db2777", image: "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=800&q=80" },
  ucp:        { label: "UCP",        icon: Baby,          iconWhite: Baby,          bg: "bg-yellow-500", bgHex: "#eab308", image: "https://images.unsplash.com/photo-1516627145497-ae6968895b40?w=800&q=80" },
  diaconia:   { label: "Diaconia",   icon: HandHelping,   iconWhite: HandHelping,   bg: "bg-teal-600",   bgHex: "#0d9488", image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&q=80" },
  conselho:   { label: "Conselho",   icon: Shield,        iconWhite: Shield,        bg: "bg-indigo-600", bgHex: "#4f46e5", image: "https://images.unsplash.com/photo-1560439514-4e9645039924?w=800&q=80" },
  ministerio: { label: "Ministério", icon: Music,         iconWhite: Music,         bg: "bg-green-600",  bgHex: "#16a34a", image: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&q=80" },
  ebd:        { label: "EBD",        icon: GraduationCap, iconWhite: GraduationCap, bg: "bg-amber-600",  bgHex: "#d97706", image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80" },
}