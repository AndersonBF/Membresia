import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date"); // formato: "YYYY-MM-DD"

  const dateStr = dateParam ?? new Date().toISOString().split("T")[0];

  // date no banco é sempre meia-noite UTC do dia — filtra exatamente esse dia
  const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
  const endOfDay   = new Date(`${dateStr}T23:59:59.999Z`);

  const events = await prisma.event.findMany({
    where: {
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: {
      society: {
        select: { id: true, name: true },
      },
    },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json(events);
}