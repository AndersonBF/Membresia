import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const societyId = Number(searchParams.get("societyId"));
  const startDate = new Date(searchParams.get("startDate")!);
  const endDate = new Date(searchParams.get("endDate")!);

  if (!societyId || !startDate || !endDate) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  // 1️⃣ Eventos do período
  const events = await prisma.event.findMany({
    where: {
      societyId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      id: true,
      date: true,
    },
  });

  const eventIds = events.map((e) => e.id);

  // 2️⃣ Presenças
  const attendances = await prisma.attendance.findMany({
    where: {
      eventId: { in: eventIds },
      isPresent: true,
    },
    include: {
      member: true,
      event: true,
    },
  });

  // 3️⃣ Total por membro
  const frequencyMap: Record<number, number> = {};
  attendances.forEach((a) => {
    frequencyMap[a.memberId] = (frequencyMap[a.memberId] || 0) + 1;
  });

  const ranking = Object.entries(frequencyMap)
    .map(([memberId, count]) => ({
      memberId: Number(memberId),
      count,
    }))
    .sort((a, b) => b.count - a.count);

  // 4️⃣ Média por evento
  const avgPresence =
    events.length > 0
      ? attendances.length / events.length
      : 0;

  // 5️⃣ Membros inativos (não tiveram presença no período)
  const societyMembers = await prisma.memberSociety.findMany({
    where: { societyId },
    include: { member: true },
  });

  const activeMemberIds = new Set(
    attendances.map((a) => a.memberId)
  );

  const inactiveMembers = societyMembers
    .filter((m) => !activeMemberIds.has(m.memberId))
    .map((m) => ({
      id: m.member.id,
      name: m.member.name,
    }));

  // 6️⃣ Evolução mensal
  const monthlyMap: Record<string, number> = {};

  attendances.forEach((a) => {
    const month = a.event!.date.toISOString().slice(0, 7);
    monthlyMap[month] = (monthlyMap[month] || 0) + 1;
  });

  const monthlyEvolution = Object.entries(monthlyMap)
    .map(([month, total]) => ({ month, total }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return NextResponse.json({
    totalEvents: events.length,
    totalAttendances: attendances.length,
    avgPresence,
    ranking,
    inactiveMembers,
    monthlyEvolution,
  });
}