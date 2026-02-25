import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const events = await prisma.event.findMany({
    include: {
      attendances: true,
    },
  });

  const report = events.map((event) => {
    const total = event.attendances.length;
    const presentes = event.attendances.filter(a => a.isPresent).length;

    return {
      event: event.title,
      total,
      presentes,
      taxa: total > 0 ? ((presentes / total) * 100).toFixed(1) : 0,
    };
  });

  return NextResponse.json(report);
}