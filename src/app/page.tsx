import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"

export default async function RootPage() {
  const { userId, sessionClaims } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  const roles = (sessionClaims?.metadata as { roles?: string[] })?.roles ?? []

  if (roles.includes("superadmin") || roles.includes("admin")) {
    redirect("/admin")
  }

  // Roles de grupos
  const groupRoles = ["ump", "upa", "uph", "saf", "ucp", "diaconia", "conselho", "ministerio", "ebd"]
  const firstGroup = roles.find((r) => groupRoles.includes(r))
  if (firstGroup) {
    redirect(`/${firstGroup}`)
  }

  // Membro comum
  redirect("/member")
}