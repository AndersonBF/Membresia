"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";

type AttendanceExcelButtonProps = {
  events: any[];
};

const AttendanceExcelButton = ({ events }: AttendanceExcelButtonProps) => {
  const [exporting, setExporting] = useState(false);

  const exportToExcel = () => {
    setExporting(true);

    try {
      // Preparar dados para o Excel
      const reportData = events.map((event) => {
        const presentCount = event.attendances.filter(
          (att: any) => att.isPresent
        ).length;
        const absentCount = event.attendances.filter(
          (att: any) => !att.isPresent
        ).length;
        const totalMembers = event.attendances.length;
        const visitors = event.visitors || 0;
        const totalParticipants = presentCount + visitors;
        const attendancePercentage =
          totalMembers > 0
            ? ((presentCount / totalMembers) * 100).toFixed(1)
            : "0";

        return {
          Data: new Date(event.date).toLocaleDateString("pt-BR"),
          Título: event.title,
          Horário: event.startTime
            ? new Date(event.startTime).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "-",
          Sociedade: event.society?.name || "-",
          "Total Membros": totalMembers,
          Presentes: presentCount,
          Ausentes: absentCount,
          Visitas: visitors,
          "Total Participantes": totalParticipants,
          "% Presença": `${attendancePercentage}%`,
        };
      });

      // Criar workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(reportData);

      // Definir largura das colunas
      ws["!cols"] = [
        { wch: 12 }, { wch: 30 }, { wch: 10 }, { wch: 20 },
        { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 10 },
        { wch: 18 }, { wch: 12 },
      ];

      XLSX.utils.book_append_sheet(wb, ws, "Relatório de Presenças");

      const fileName = `Relatorio_Presencas_${new Date()
        .toLocaleDateString("pt-BR")
        .replace(/\//g, "-")}.xlsx`;

      XLSX.writeFile(wb, fileName);

      toast.success("Relatório Excel exportado com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar Excel:", error);
      toast.error("Erro ao exportar relatório");
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={exportToExcel}
      disabled={exporting}
      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
    >
      {exporting ? "Exportando..." : "📊 Exportar Excel"}
    </button>
  );
};

export default AttendanceExcelButton;