"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X, Clock, Users, CalendarRange } from "lucide-react";

type Society = { id: number; name: string };
type Event = {
  id: number;
  title: string;
  description: string | null;
  date: string;
  startTime: string | null;
  endTime: string | null;
  society: Society | null;
};

type MonthEvents = Record<string, Event[]>;

const societyColors: Record<string, { pill: string; dot: string; text: string }> = {
  UMP:        { pill: "bg-blue-100 text-blue-800",     dot: "bg-blue-500",   text: "text-blue-700" },
  UPA:        { pill: "bg-yellow-100 text-yellow-800", dot: "bg-yellow-500", text: "text-yellow-700" },
  UPH:        { pill: "bg-orange-100 text-orange-800", dot: "bg-orange-500", text: "text-orange-700" },
  SAF:        { pill: "bg-pink-100 text-pink-800",     dot: "bg-pink-500",   text: "text-pink-700" },
  UCP:        { pill: "bg-amber-100 text-amber-800",   dot: "bg-amber-500",  text: "text-amber-700" },
  Diaconia:   { pill: "bg-teal-100 text-teal-800",     dot: "bg-teal-500",   text: "text-teal-700" },
  Conselho:   { pill: "bg-indigo-100 text-indigo-800", dot: "bg-indigo-500", text: "text-indigo-700" },
  Ministério: { pill: "bg-green-100 text-green-800",   dot: "bg-green-500",  text: "text-green-700" },
  EBD:        { pill: "bg-stone-100 text-stone-800",   dot: "bg-stone-500",  text: "text-stone-700" },
};
const defaultColor = { pill: "bg-gray-100 text-gray-700", dot: "bg-gray-400", text: "text-gray-600" };

const mesesPT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const diasSemana = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

function getColor(societyName?: string | null) {
  if (!societyName) return defaultColor;
  const key = Object.keys(societyColors).find((k) =>
    societyName.toUpperCase().includes(k.toUpperCase())
  );
  return key ? societyColors[key] : defaultColor;
}

function formatTime(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit", minute: "2-digit", hour12: false,
    timeZone: "America/Sao_Paulo",
  });
}

function toDateKey(date: Date) {
  return date.toISOString().split("T")[0];
}

export default function CalendarioGeralPage() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [monthEvents, setMonthEvents] = useState<MonthEvents>({});
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);

  const year  = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  // Busca todos eventos do mês de uma vez
  useEffect(() => {
    setLoading(true);
    const m = month + 1;
    fetch(`/api/calendario-geral/mes-completo?year=${year}&month=${m}`)
      .then((r) => r.json())
      .then((events: Event[]) => {
        const map: MonthEvents = {};
        events.forEach((e) => {
          const key = e.date.split("T")[0];
          if (!map[key]) map[key] = [];
          map[key].push(e);
        });
        setMonthEvents(map);
      })
      .finally(() => setLoading(false));
  }, [year, month]);

  // Dias da grade
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const cells: { date: Date; isCurrentMonth: boolean }[] = [];

  // Dias do mês anterior
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month - 1, prevMonthDays - i), isCurrentMonth: false });
  }
  // Dias do mês atual
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), isCurrentMonth: true });
  }
  // Dias do próximo mês para completar a grade
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ date: new Date(year, month + 1, d), isCurrentMonth: false });
  }

  const selectedKey = selectedDay ? toDateKey(selectedDay) : null;
  const selectedEvents = selectedKey ? (monthEvents[selectedKey] ?? []) : [];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .cal-cell { min-height: 110px; }
        .cal-cell:hover { background: #f9fafb; cursor: pointer; }
        .cal-cell.selected { background: #f0fdf4; }
        .event-pill {
          display: flex; align-items: center; gap: 4px;
          font-size: 11px; font-weight: 500;
          padding: 2px 6px; border-radius: 4px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          max-width: 100%; cursor: pointer;
          transition: opacity 0.1s;
        }
        .event-pill:hover { opacity: 0.8; }
        .day-number {
          width: 28px; height: 28px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 500;
        }
        .day-number.today { background: #16a34a; color: white; font-weight: 700; }
        .day-number.selected-day { background: #dcfce7; color: #15803d; font-weight: 700; }
        .slide-in { animation: slideIn 0.2s ease-out; }
        @keyframes slideIn { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: translateX(0); } }
      `}} />

      <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-white">

        {/* CALENDÁRIO PRINCIPAL */}
        <div className={`flex flex-col flex-1 min-w-0 transition-all duration-200`}>

          {/* HEADER */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
                >
                  <ChevronLeft size={18} className="text-gray-500" />
                </button>
                <button
                  onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
                >
                  <ChevronRight size={18} className="text-gray-500" />
                </button>
              </div>
              <h1 className="text-xl font-semibold text-gray-800">
                {mesesPT[month]} {year}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              {/* Legenda compacta */}
              <div className="hidden md:flex items-center gap-3">
                {Object.entries(societyColors).map(([name, c]) => (
                  <span key={name} className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                    {name}
                  </span>
                ))}
              </div>
              <button
                onClick={() => setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1))}
                className="px-3 py-1.5 text-sm font-medium text-green-700 border border-green-200 rounded-lg hover:bg-green-50 transition"
              >
                Hoje
              </button>
            </div>
          </div>

          {/* DIAS DA SEMANA */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {diasSemana.map((d) => (
              <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          {/* GRADE DE DIAS */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <CalendarRange size={32} className="text-gray-200 animate-pulse" />
                <p className="text-gray-400 text-sm">Carregando eventos...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-7 flex-1 overflow-auto">
              {cells.map(({ date, isCurrentMonth }, i) => {
                const key = toDateKey(date);
                const dayEvents = monthEvents[key] ?? [];
                const isToday = toDateKey(date) === toDateKey(today);
                const isSelected = selectedKey === key;
                const maxVisible = 3;

                return (
                  <div
                    key={i}
                    onClick={() => setSelectedDay(isSelected ? null : date)}
                    className={`cal-cell border-b border-r border-gray-100 p-1.5 flex flex-col gap-1
                      ${isSelected ? "selected" : ""}
                      ${!isCurrentMonth ? "bg-gray-50/50" : ""}
                    `}
                  >
                    {/* Número do dia */}
                    <div className="flex justify-center mb-0.5">
                      <span className={`day-number
                        ${isToday ? "today" : ""}
                        ${isSelected && !isToday ? "selected-day" : ""}
                        ${!isCurrentMonth ? "text-gray-300" : "text-gray-700"}
                      `}>
                        {date.getDate()}
                      </span>
                    </div>

                    {/* Eventos */}
                    {dayEvents.slice(0, maxVisible).map((ev) => {
                      const c = getColor(ev.society?.name);
                      return (
                        <div key={ev.id} className={`event-pill ${c.pill}`}>
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
                          <span className="truncate">{ev.title}</span>
                        </div>
                      );
                    })}
                    {dayEvents.length > maxVisible && (
                      <span className="text-[10px] text-gray-400 pl-1">
                        +{dayEvents.length - maxVisible} mais
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* PAINEL LATERAL DO DIA SELECIONADO */}
        {selectedDay && (
          <div className="w-80 flex-shrink-0 border-l border-gray-100 flex flex-col slide-in">
            {/* Header do painel */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">
                  {diasSemana[selectedDay.getDay()]}
                </p>
                <p className="text-3xl font-bold text-gray-800 leading-tight">
                  {selectedDay.getDate()}
                </p>
                <p className="text-sm text-gray-500">
                  {mesesPT[selectedDay.getMonth()]} {selectedDay.getFullYear()}
                </p>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition mt-1"
              >
                <X size={15} className="text-gray-400" />
              </button>
            </div>

            {/* Lista de eventos */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {selectedEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CalendarRange size={32} className="text-gray-200 mb-2" />
                  <p className="text-gray-400 text-sm font-medium">Sem programações</p>
                </div>
              ) : (
                selectedEvents.map((ev) => {
                  const c = getColor(ev.society?.name);
                  const startTime = formatTime(ev.startTime);
                  const endTime   = formatTime(ev.endTime);
                  return (
                    <div key={ev.id} className={`rounded-xl p-3.5 border-l-4 ${c.pill.split(" ")[0].replace("100","50")} border-l-${c.dot.replace("bg-","")}`}
                      style={{ borderLeftColor: "" }}
                    >
                      <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest mb-1 ${c.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                        {ev.society?.name ?? "Geral"}
                      </div>
                      <p className="font-semibold text-gray-800 text-sm leading-snug">{ev.title}</p>
                      {ev.description && (
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{ev.description}</p>
                      )}
                      {startTime && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                          <Clock size={11} />
                          {startTime}{endTime ? ` – ${endTime}` : ""}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}