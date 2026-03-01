import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year  = parseInt(searchParams.get("year")  ?? String(new Date().getFullYear()));
  const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));

  const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const endOfMonth   = new Date(year, month, 0, 23, 59, 59, 999);

  const events = await prisma.event.findMany({
    where: {
      OR: [
        {
          startTime: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        {
          startTime: null,
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      ],
    },
    select: { startTime: true, date: true },
  });

  // Retorna datas únicas no formato "YYYY-MM-DD"
  // Usa startTime se existir, senão usa date
  const uniqueDates = [
    ...new Set(
      events.map((e) => {
        const ref = e.startTime ?? e.date;
        return ref.toISOString().split("T")[0];
      })
    ),
  ];

  return NextResponse.json(uniqueDates);
}