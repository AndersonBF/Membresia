import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year  = parseInt(searchParams.get("year")  ?? String(new Date().getFullYear()));
  const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));

  const monthStr = String(month).padStart(2, "0");
  const lastDay  = new Date(year, month, 0).getDate();

  const startOfMonth = new Date(`${year}-${monthStr}-01T00:00:00.000Z`);
  const endOfMonth   = new Date(`${year}-${monthStr}-${String(lastDay).padStart(2,"0")}T23:59:59.999Z`);

  const events = await prisma.event.findMany({
    where: {
      date: {
        gte: startOfMonth,
        lte: endOfMonth,
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