import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import Image from "next/image";
import AttendanceExcelButton from "@/components/AttendanceExcelButton";

export const dynamic = "force-dynamic";

const AttendanceListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { sessionClaims } = await auth();
  const roles = (sessionClaims?.metadata as { roles?: string[] })?.roles ?? [];
  const isAdmin = roles.includes("admin") || roles.includes("superadmin");

  const roleContext = searchParams.roleContext ?? null
  const societyId = searchParams.societyId ?? null

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
      },
    },
    orderBy: { date: "asc" },
    take: 50,
  });

  // Monta a URL de retorno para o take page
  const buildTakeUrl = (eventId: number) => {
    const params = new URLSearchParams()
    params.set("eventId", eventId.toString())
    if (roleContext) params.set("roleContext", roleContext)
    if (societyId) params.set("societyId", societyId)
    return `/list/attendance/take?${params.toString()}`
  }

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Presenças</h1>
        <AttendanceExcelButton events={events} />
      </div>

      <div className="space-y-4">
        {events.map((event) => {
          const total = event.attendances.length;
          const presentes = event.attendances.filter((a) => a.isPresent).length;

          return (
            <Link
              key={event.id}
              href={buildTakeUrl(event.id)}
              className="block border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{event.title}</h3>
                  <div className="flex gap-4 text-sm text-gray-600 mt-1">
                    <span>📅 {new Date(event.date).toLocaleDateString("pt-BR")}</span>
                    {event.startTime && (
                      <span>🕐 {new Date(event.startTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                    )}
                    {event.society && <span>👥 {event.society.name}</span>}
                  </div>
                  {event.description && (
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">{event.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-blue-600">{presentes} presentes</div>
                    <div className="text-xs text-gray-500">de {total}</div>
                  </div>
                  <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-100">
                    <Image src="/view.png" alt="Take Attendance" width={20} height={20} />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}

        {events.length === 0 && (
          <div className="text-center py-12 text-gray-500">Nenhum evento encontrado</div>
        )}
      </div>
    </div>
  );
};

export default AttendanceListPage;