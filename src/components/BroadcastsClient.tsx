"use client";

import { useState } from "react";
import { MessageSquare, Filter } from "lucide-react";
import BroadcastFeed from "@/components/BroadcastFeed";

type SocietyColor = { color: string; light: string };

export default function BroadcastsClient({
  role,
  accentColor,
  isInsideRole,
  visibleRoles,
  roleLabels,
  societyColors,
  societyMap,
}: {
  role: string;
  accentColor: string;
  isInsideRole: boolean;
  visibleRoles: string[];
  roleLabels: Record<string, string>;
  societyColors: Record<string, SocietyColor>;
  societyMap: Record<string, number>;
}) {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // Calcula tudo baseado no filtro ativo
  const currentRole     = activeFilter ?? role;
  const currentSocietyId = activeFilter
    ? (societyMap[activeFilter] ?? null)
    : (societyMap[role] ?? null);
  const currentColor    = activeFilter
    ? (societyColors[activeFilter]?.color ?? accentColor)
    : accentColor;
  const isExclusive     = !!activeFilter;
  const isShowAll       = !isInsideRole && !activeFilter;

  return (
    <div className="p-6 flex gap-6 flex-col lg:flex-row min-h-screen bg-gray-50">

      {/* FEED PRINCIPAL */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
            style={{ background: currentColor }}
          >
            <MessageSquare size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Mensagens</h1>
            <p className="text-xs text-gray-400">
              {activeFilter
                ? `Filtrando por ${roleLabels[activeFilter]}`
                : isInsideRole
                ? `Comunicados da ${role.toUpperCase()}`
                : "Comunicados de todas as sociedades"}
            </p>
          </div>
        </div>

        <BroadcastFeed
          societyId={currentSocietyId}
          role={currentRole}
          accentColor={currentColor}
          showAll={isShowAll}
          exclusive={isExclusive}
        />
      </div>

      {/* SIDEBAR — FILTROS */}
      <div className="w-full lg:w-64 flex-shrink-0">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={14} className="text-gray-400" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
              Filtrar por sociedade
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            {/* Opção "Todas" */}
            <button
              onClick={() => setActiveFilter(null)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
              style={
                activeFilter === null
                  ? { background: accentColor + "15", color: accentColor }
                  : { color: "#6b7280" }
              }
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: activeFilter === null ? accentColor : "#d1d5db" }}
              />
              <span className="text-sm font-medium">
                {isInsideRole ? "Todas visíveis" : "Todas"}
              </span>
              {activeFilter === null && (
                <span
                  className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: accentColor + "20", color: accentColor }}
                >
                  ativo
                </span>
              )}
            </button>

            {/* Divisor */}
            <div className="border-t border-gray-100 my-1" />

            {/* Roles disponíveis */}
            {visibleRoles.map((r) => {
              const sc = societyColors[r] ?? { color: "#6b7280", light: "#f9fafb" };
              const isActive = activeFilter === r;
              return (
                <button
                  key={r}
                  onClick={() => setActiveFilter(isActive ? null : r)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
                  style={
                    isActive
                      ? { background: sc.color + "15", color: sc.color }
                      : { color: "#6b7280" }
                  }
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-all"
                    style={{ background: isActive ? sc.color : "#d1d5db" }}
                  />
                  <span className="text-sm font-medium">{roleLabels[r]}</span>
                  {isActive && (
                    <span
                      className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: sc.color + "20", color: sc.color }}
                    >
                      ativo
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}