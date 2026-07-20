import { currentUser } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import PastorDiaryClient from "@/components/PastorDiaryClient"

export default async function PastorDiarioPage() {
  const user = await currentUser()
  const roles = (user?.publicMetadata?.roles as string[]) ?? []
  const isSuperAdmin = roles.includes("superadmin")
  const isPastor = roles.includes("pastor")

  if (!user || (!isSuperAdmin && !isPastor)) notFound()

  return <PastorDiaryClient isSuperAdmin={isSuperAdmin} />
}
