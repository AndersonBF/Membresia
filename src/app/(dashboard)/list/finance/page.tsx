import prisma from "@/lib/prisma"
import { currentUser } from "@clerk/nextjs/server"
import { cache } from "react"
import FinancePage from "@/components/FinancePage"

export const dynamic = "force-dynamic"

const getCachedUser = cache(async () => await currentUser())

const societyMap: Record<string, number> = {
  saf: 3, uph: 4, ump: 5, upa: 6, ucp: 7,
}

export default async function FinancePageRoute({
  searchParams,
}: {
  searchParams: { societyId?: string; roleContext?: string }
}) {
  const user = await getCachedUser()
  const roles = (user?.publicMetadata?.roles as string[]) ?? []
  const isAdmin = roles.includes("admin") || roles.includes("superadmin")

  const roleContext = searchParams.roleContext ?? null

  // Pega societyId pelo roleContext automaticamente se não vier na URL
  const societyId = searchParams.societyId
    ? Number(searchParams.societyId)
    : roleContext && societyMap[roleContext]
    ? societyMap[roleContext]
    : null

  // Monta o filtro correto por contexto
  let where: any
  if (societyId) {
    // Sociedade específica (UMP, SAF, etc.)
    where = { societyId }
  } else if (roleContext === "conselho") {
    // Conselho tem councilId próprio
    where = { councilId: 1 }
  } else if (roleContext && roleContext !== "conselho") {
    // Diaconia, Ministério, EBD — sem suporte a finanças separadas ainda
    where = { id: -1 }
  } else if (isAdmin) {
    // Admin sem contexto específico → tudo
    where = {}
  } else {
    where = { societyId: null }
  }

  const finances = await prisma.finance.findMany({
    where,
    orderBy: [{ year: "desc" }, { month: "desc" }, { date: "desc" }],
    include: { society: true },
  })

  const societies = isAdmin
    ? await prisma.internalSociety.findMany({ orderBy: { name: "asc" } })
    : []

  return (
    <FinancePage
      finances={finances}
      societies={societies}
      societyId={societyId}
      roleContext={roleContext}
      isAdmin={isAdmin}
    />
  )
}