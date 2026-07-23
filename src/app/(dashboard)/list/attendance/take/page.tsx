// src/app/(dashboard)/list/attendance/take/page.tsx
import AttendanceTaker from "@/components/AttendanceTaker";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { visitorWhereForEvent, eventHasVisitors } from "@/lib/visitorScope";
import { roleForSocietyId } from "@/lib/permissions";

const TakeAttendancePage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { sessionClaims } = await auth();
  const roles = (sessionClaims?.metadata as { roles?: string[] })?.roles ?? [];

  if (!roles.includes("admin") && !roles.includes("superadmin")) {
    redirect("/");
  }

  const eventId = searchParams.eventId ? parseInt(searchParams.eventId) : null;
  const roleContext = searchParams.roleContext ?? null;
  const societyId = searchParams.societyId ?? null;

  if (!eventId) {
    redirect("/list/attendance");
  }

  const selectedEvent = await prisma.event.findUnique({
    where: { id: eventId },
    include: { society: true },
  });

  if (!selectedEvent) {
    redirect("/list/attendance");
  }

  // Remove registros de presença de membros inativos para manter contagem correta
  await prisma.attendance.deleteMany({
    where: {
      eventId,
      member: { isActive: false },
    },
  });

  // Membros elegíveis para o evento: por sociedade, por grupo (category) ou todos
  const categoryMemberWhere: Record<string, any> = {
    ebd: { bibleSchoolClassId: { not: null } },
    diaconia: { diaconate: { isNot: null } },
    conselho: { council: { isNot: null } },
    ministerio: { ministries: { some: {} } },
  };

  let memberWhere: any = { isActive: true };

  if (selectedEvent.societyId) {
    memberWhere = {
      societies: { some: { societyId: selectedEvent.societyId } },
      isActive: true,
    };
  } else if (selectedEvent.category && categoryMemberWhere[selectedEvent.category]) {
    memberWhere = {
      ...categoryMemberWhere[selectedEvent.category],
      isActive: true,
    };
  }

  const members = await prisma.member.findMany({
    where: memberWhere,
    orderBy: { name: "asc" },
  });

  const existingAttendance = await prisma.attendance.findMany({
    where: { eventId },
  });

  // Visitantes do escopo do evento (sociedade/grupo) + presenças já gravadas.
  // Grupos sem visitantes (diaconia) não carregam nem exibem essa lista.
  const showVisitors = eventHasVisitors(selectedEvent);

  // Grupo do evento — define onde entram os cadastros feitos pela leitura da
  // folha. Sem grupo definido, a leitura não oferece cadastro.
  const scopeRole =
    roleContext ??
    roleForSocietyId(selectedEvent.societyId) ??
    selectedEvent.category ??
    null;

  const visitors = showVisitors
    ? await prisma.visitor.findMany({
        where: visitorWhereForEvent(selectedEvent),
        select: { id: true, name: true, phone: true },
        orderBy: { name: "asc" },
      })
    : [];

  const existingVisitorAttendance = await prisma.visitorAttendance.findMany({
    where: { eventId },
    select: { visitorId: true, isPresent: true },
  });

  // Monta o redirect de volta baseado no contexto
  const backUrl = roleContext && societyId
    ? `/list/attendance?societyId=${societyId}&roleContext=${roleContext}`
    : roleContext
    ? `/list/attendance?role=${roleContext}&roleContext=${roleContext}`
    : "/list/attendance"

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <AttendanceTaker
        event={selectedEvent}
        members={members}
        existingAttendance={existingAttendance}
        visitors={visitors}
        existingVisitorAttendance={existingVisitorAttendance}
        showVisitors={showVisitors}
        scopeRole={scopeRole}
        backUrl={backUrl}
      />
    </div>
  );
};

export default TakeAttendancePage;