import { clerkClient } from '@clerk/nextjs/server'
import ApprovalClient from '@/app/(dashboard)/admin/aprovacoes/ApprovalClient'

const roleLabels: Record<string, string> = {
  ump: "UMP", upa: "UPA", uph: "UPH", saf: "SAF", ucp: "UCP",
  diaconia: "Diaconia", conselho: "Conselho", ministerio: "Ministério", ebd: "EBD",
}

export default async function AprovacoesPage() {
  const client = await clerkClient()
  const { data: users } = await client.users.getUserList({ limit: 100 })

  const pendingUsers = users
    .map((user) => {
      const requestedRoles = (user.unsafeMetadata?.roles as string[]) ?? []
      const approvedRoles = (user.publicMetadata?.roles as string[]) ?? []
      const pendingRoles = requestedRoles.filter(
        (r) => r !== 'member' && !approvedRoles.includes(r)
      )
      return {
        id: user.id,
        username: user.username ?? user.id,
        pendingRoles,
      }
    })
    .filter((u) => u.pendingRoles.length > 0)

  return (
    <div className="p-6 flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-700">Solicitações Pendentes</h1>
      {pendingUsers.length === 0 ? (
        <p className="text-gray-500">Nenhuma solicitação pendente.</p>
      ) : (
        <ApprovalClient users={pendingUsers} roleLabels={roleLabels} />
      )}
    </div>
  )
}