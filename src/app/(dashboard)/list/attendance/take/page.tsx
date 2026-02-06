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
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "admin") {
    redirect("/");
  }

  const eventId = searchParams.eventId ? parseInt(searchParams.eventId) : null;

  if (!eventId) {
    redirect("/list/attendance");
  }

  // Buscar o evento selecionado
  const selectedEvent = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      society: true,
    },
  });

  if (!selectedEvent) {
    redirect("/list/attendance");
  }

  let members: any[] = [];

  // Se o evento tem sociedade, buscar apenas membros dessa sociedade
  if (selectedEvent.societyId) {
    members = await prisma.member.findMany({
      where: {
        societies: {
          some: {
            societyId: selectedEvent.societyId,
          },
        },
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
    });
  } else {
    // Se não tem sociedade, buscar todos os membros ativos
    members = await prisma.member.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  // Buscar presença já registrada
  const existingAttendance = await prisma.attendance.findMany({
    where: {
      eventId,
    },
  });

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <AttendanceTaker
        event={selectedEvent}
        members={members}
        existingAttendance={existingAttendance}
      />
    </div>
  );
};

export default TakeAttendancePage;