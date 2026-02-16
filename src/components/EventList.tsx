import prisma from "@/lib/prisma";

const EventList = async ({dateParam}:{dateParam:string | undefined}) => {

    const date = dateParam ? new Date(dateParam) : new Date();

    console.log("dateParam recebido:", dateParam);
    console.log("date objeto:", date);

    // ✅ CORRETO - cria objetos Date separados
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    console.log("startOfDay:", startOfDay);
    console.log("endOfDay:", endOfDay);

    const data = await prisma.event.findMany({
        where: {
            startTime: {
                gte: startOfDay,
                lte: endOfDay,
            },
        },
    });

    console.log("Eventos encontrados:", data.length, data);
    console.log("Detalhes dos eventos:", data.map(e => ({
        title: e.title,
        startTime: e.startTime,
        date: e.date
    })));

    return data.map((event) => (
        <div 
            className="p-5 rounded-md border-2 border-gray-100 border-t-4 odd:border-t-lamaSky even:border-t-lamaPurple"
            key={event.id}
        >
            <div className="flex items-center justify-between">
                <h1 className="font-semibold text-gray-600">{event.title}</h1>
                <span className="text-gray-300 text-xs">
                    {event.startTime ? event.startTime.toLocaleTimeString(
                        "pt-BR", 
                        {
                            hour: '2-digit', 
                            minute:'2-digit',
                            hour12:false,
                        }) : "--:--"}
                </span>
            </div>
            <p className="mt-2 text-gray-400 text-sm">{event.description}</p>
        </div>
    ));
};

export default EventList;