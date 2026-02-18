import prisma from '@/lib/prisma'
import { Key } from 'lucide-react'

export default async function CredenciaisPage() {
  const members = await prisma.member.findMany({
    where: { username: { not: null }, password: { not: null } },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, username: true, password: true, isActive: true },
  })

  return (
    <div className="p-6 flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-700 flex items-center gap-2">
        <Key size={24} /> Credenciais dos Membros
      </h1>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Senha</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{m.name}</td>
                <td className="px-4 py-3 font-mono text-gray-600">{m.username}</td>
                <td className="px-4 py-3 font-mono text-gray-600">{m.password}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${m.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {m.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}