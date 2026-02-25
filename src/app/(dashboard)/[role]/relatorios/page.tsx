import  prisma  from "@/lib/prisma";
import { notFound } from "next/navigation";

interface Props {
  params: { role: string };
}

export default async function Relatorios({ params }: Props) {
  const roleName = decodeURIComponent(params.role);

  const society = await prisma.internalSociety.findFirst({
    where: {
      name: roleName,
    },
    include: {
      members: {
        include: {
          member: {
            include: {
              attendances: {
                include: { event: true },
              },
            },
          },
        },
      },
      events: {
        include: { attendances: true },
      },
      finances: true,
    },
  });

  if (!society) return notFound();

  // =====================
  // MÉTRICAS
  // =====================

  const totalMembros = society.members.length;
  const totalEventos = society.events.length;

  const mediaPresenca =
    society.events.reduce((acc, event) => {
      const total = event.attendances.length;
      const presentes = event.attendances.filter(a => a.isPresent).length;
      return acc + (total > 0 ? presentes / total : 0);
    }, 0) / (society.events.length || 1);

  const totalEntradas = society.finances
    .filter(f => f.type === "ENTRADA")
    .reduce((acc, f) => acc + f.value, 0);

  const totalSaidas = society.finances
    .filter(f => f.type === "SAIDA")
    .reduce((acc, f) => acc + f.value, 0);

  const saldo = totalEntradas - totalSaidas;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">
        Relatórios - {society.name}
      </h1>

      <div className="grid grid-cols-4 gap-4">
        <Card title="Membros" value={totalMembros} />
        <Card title="Eventos" value={totalEventos} />
        <Card title="Média Presença" value={(mediaPresenca * 100).toFixed(1) + "%"} />
        <Card title="Saldo" value={"R$ " + saldo.toFixed(2)} />
      </div>
    </div>
  );
}

function Card({ title, value }: { title: string; value: any }) {
  return (
    <div className="p-4 border rounded-xl bg-white shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}