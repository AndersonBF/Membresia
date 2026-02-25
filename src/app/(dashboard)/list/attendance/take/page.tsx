import AttendanceTaker from "@/components/AttendanceTaker";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

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

  let members: any[] = [];

  if (selectedEvent.societyId) {
    members = await prisma.member.findMany({
      where: {
        societies: { some: { societyId: selectedEvent.societyId } },
        isActive: true,
      },
      orderBy: { name: "asc" },
    });
  } else {
    members = await prisma.member.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
  }

  const existingAttendance = await prisma.attendance.findMany({
    where: { eventId },
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
        backUrl={backUrl}
      />
    </div>
  );
};

export default TakeAttendancePage;