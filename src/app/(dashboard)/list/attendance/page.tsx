// src/app/(dashboard)/list/attendance/page.tsx
import prisma from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import AttendanceExcelButton from "@/components/AttendanceExcelButton"
import AttendanceListClient from "@/components/AttendanceListClient"

export const dynamic = "force-dynamic"

const AttendanceListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined }
}) => {
  const { sessionClaims } = await auth()
  const roles = (sessionClaims?.metadata as { roles?: string[] })?.roles ?? []
  const isAdmin = roles.includes("admin") || roles.includes("superadmin")

  const roleContext = searchParams.roleContext ?? null
  const societyId   = searchParams.societyId   ?? null

  const whereClause: any = {}
  if (societyId) {
    whereClause.societyId = parseInt(societyId)
  } else if (searchParams.role) {
    whereClause.isPublic = true
  } else if (!isAdmin) {
    whereClause.isPublic = true
  }

  const events = await prisma.event.findMany({
    where: whereClause,
    include: {
      society: true,
      attendances: {
        select: { isPresent: true },
        where: {
          member: { isActive: true }, // só conta membros ativos
        },
      },
    },
    orderBy: { date: "asc" },
    take: 50,
  })

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Presenças</h1>
        <AttendanceExcelButton events={events} />
      </div>

      <AttendanceListClient
        events={events.map(e => ({
          ...e,
          date: e.date.toISOString(),
          startTime: e.startTime?.toISOString() ?? null,
        }))}
        roleContext={roleContext}
        societyId={societyId}
        isAdmin={isAdmin}
      />
    </div>
  )
}

export default AttendanceListPage