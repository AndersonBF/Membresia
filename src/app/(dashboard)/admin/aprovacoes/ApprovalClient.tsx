"use client";

import { useState } from 'react'

interface PendingUser {
  id: string
  username: string
  pendingRoles: string[]
}

export default function ApprovalClient({
  users,
  roleLabels,
}: {
  users: PendingUser[]
  roleLabels: Record<string, string>
}) {
  const [list, setList] = useState(users)
  const [loading, setLoading] = useState<string | null>(null)

  const handleAction = async (userId: string, role: string, action: 'approve' | 'reject') => {
    setLoading(`${userId}-${role}`)
    await fetch('/api/admin/approve-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role, action }),
    })

    setList((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, pendingRoles: u.pendingRoles.filter((r) => r !== role) }
          : u
      ).filter((u) => u.pendingRoles.length > 0)
    )
    setLoading(null)
  }

  return (
    <div className="flex flex-col gap-4">
      {list.map((user) => (
        <div key={user.id} className="bg-white rounded-xl shadow-sm p-5 flex flex-col gap-3">
          <p className="font-semibold text-gray-700">@{user.username}</p>
          <div className="flex flex-wrap gap-2">
            {user.pendingRoles.map((role) => (
              <div key={role} className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
                <span className="text-sm text-gray-700">{roleLabels[role] ?? role}</span>
                <button
                  onClick={() => handleAction(user.id, role, 'approve')}
                  disabled={loading === `${user.id}-${role}`}
                  className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition"
                >
                  Aprovar
                </button>
                <button
                  onClick={() => handleAction(user.id, role, 'reject')}
                  disabled={loading === `${user.id}-${role}`}
                  className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition"
                >
                  Rejeitar
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}