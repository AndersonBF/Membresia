// src/components/EventList.tsx
import prisma from "@/lib/prisma";

const EventList = async ({ dateParam }: { dateParam: string | undefined }) => {

  // Usa o dateParam como string "YYYY-MM-DD" para evitar problemas de timezone
  const dateStr = dateParam ?? new Date().toISOString().split("T")[0];

  // Sempre UTC — garante que o dia certo é consultado independente do timezone do servidor
  const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
  const endOfDay   = new Date(`${dateStr}T23:59:59.999Z`);

  const data = await prisma.event.findMany({
    where: {
      OR: [
        // Eventos com startTime preenchido — filtra por startTime
        {
          startTime: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        // Eventos sem startTime — filtra pelo campo date
        {
          startTime: null,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      ],
    },
    orderBy: { startTime: "asc" },
  });

  if (data.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-4">
        Nenhuma programação para este dia.
      </p>
    );
  }

  return (
    <>
      {data.map((event) => (
        <div
          className="p-5 rounded-md border-2 border-gray-100 border-t-4 odd:border-t-lamaSky even:border-t-lamaPurple"
          key={event.id}
        >
          <div className="flex items-center justify-between">
            <h1 className="font-semibold text-gray-600">{event.title}</h1>
            <span className="text-gray-300 text-xs">
              {event.startTime
                ? event.startTime.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })
                : "--:--"}
            </span>
          </div>
          <p className="mt-2 text-gray-400 text-sm">{event.description}</p>
        </div>
      ))}
    </>
  );
};

export default EventList;