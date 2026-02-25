"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export default function PresenceReport() {
  const [data, setData] = useState<any>(null);
  const [societyId, setSocietyId] = useState(5); // exemplo
  const [startDate, setStartDate] = useState("2024-01-01");
  const [endDate, setEndDate] = useState("2024-12-31");

  useEffect(() => {
    fetch(
      `/api/reports/presence?societyId=${societyId}&startDate=${startDate}&endDate=${endDate}`
    )
      .then((res) => res.json())
      .then(setData);
  }, [societyId, startDate, endDate]);

  if (!data) return <div>Carregando...</div>;

  return (
    <div className="p-8 flex flex-col gap-8">
      <h1 className="text-2xl font-bold">Relatório Estratégico de Presença</h1>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <p>Total de Eventos</p>
          <strong>{data.totalEvents}</strong>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <p>Média por Evento</p>
          <strong>{data.avgPresence.toFixed(1)}</strong>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <p>Total de Presenças</p>
          <strong>{data.totalAttendances}</strong>
        </div>
      </div>

      {/* Gráfico */}
      <div className="bg-white p-4 rounded shadow">
        <LineChart width={600} height={300} data={data.monthlyEvolution}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="total" stroke="#16a34a" />
        </LineChart>
      </div>

      {/* Ranking */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-2">Ranking de Frequência</h2>
        {data.ranking.slice(0, 10).map((r: any, index: number) => (
          <div key={r.memberId} className="flex justify-between">
            <span>#{index + 1} - Membro {r.memberId}</span>
            <span>{r.count} presenças</span>
          </div>
        ))}
      </div>

      {/* Inativos */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-2 text-red-600">
          Membros Inativos no Período
        </h2>
        {data.inactiveMembers.map((m: any) => (
          <div key={m.id}>{m.name}</div>
        ))}
      </div>
    </div>
  );
}