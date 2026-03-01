import { currentUser } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import BroadcastsClient from "@/components/BroadcastsClient"

const societyMap: Record<string, number> = {
  saf: 3, uph: 4, ump: 5, upa: 6, ucp: 7,
}

const societyColors: Record<string, { color: string; light: string }> = {
  ump:        { color: "#2563eb", light: "#eff6ff" },
  upa:        { color: "#d97706", light: "#fffbeb" },
  uph:        { color: "#ea580c", light: "#fff7ed" },
  saf:        { color: "#db2777", light: "#fdf2f8" },
  ucp:        { color: "#f59e0b", light: "#fefce8" },
  diaconia:   { color: "#0d9488", light: "#f0fdfa" },
  conselho:   { color: "#4f46e5", light: "#eef2ff" },
  ministerio: { color: "#16a34a", light: "#f0fdf4" },
  ebd:        { color: "#b45309", light: "#fffbeb" },
}

const allRoles = ["ump","upa","uph","saf","ucp","diaconia","conselho","ministerio","ebd"]
const roleLabels: Record<string, string> = {
  ump: "UMP", upa: "UPA", uph: "UPH", saf: "SAF", ucp: "UCP",
  diaconia: "Diaconia", conselho: "Conselho", ministerio: "Ministério", ebd: "EBD",
}

export default async function BroadcastsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined }
}) {
  const user = await currentUser()
  if (!user) return notFound()

  const userRoles = (user.publicMetadata?.roles as string[]) ?? []
  const isSuperAdmin = userRoles.includes("superadmin")

  const roleContext = searchParams.roleContext ?? ""
  const societyId   = societyMap[roleContext] ?? null
  const accentColor = societyColors[roleContext]?.color ?? "#16a34a"
  const isInsideRole = !!roleContext

  // Quais roles o usuário pode ver no filtro
  const visibleRoles = isSuperAdmin
    ? allRoles
    : allRoles.filter((r) => userRoles.includes(r) || userRoles.includes("admin"))

  return (
    <BroadcastsClient
      role={roleContext}
      accentColor={accentColor}
      isInsideRole={isInsideRole}
      visibleRoles={visibleRoles}
      roleLabels={roleLabels}
      societyColors={societyColors}
      societyMap={societyMap}
    />
  )
}