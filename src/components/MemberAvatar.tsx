// src/components/MemberAvatar.tsx

interface MemberAvatarProps {
  name: string
  profileImageUrl?: string | null
  size?: number
  className?: string
}

function getInitials(name: string) {
  const parts = name.trim().split(" ")
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?"
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getColor(name: string) {
  const colors = [
    "bg-green-500", "bg-blue-500", "bg-purple-500",
    "bg-pink-500",  "bg-amber-500", "bg-teal-500",
    "bg-indigo-500","bg-rose-500",  "bg-cyan-500",
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i)
  return colors[hash % colors.length]
}

export default function MemberAvatar({ name, profileImageUrl, size = 40, className = "" }: MemberAvatarProps) {
  const style = { width: size, height: size, minWidth: size, minHeight: size }

  if (profileImageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={profileImageUrl}
        alt={name}
        style={style}
        className={`rounded-full object-cover shrink-0 ${className}`}
      />
    )
  }

  return (
    <div
      style={style}
      className={`rounded-full flex items-center justify-center text-white font-semibold shrink-0 ${getColor(name)} ${className}`}
    >
      <span style={{ fontSize: size * 0.35 }}>{getInitials(name)}</span>
    </div>
  )
}