"use client";

import { bulkUpdateAttendance } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType, AlignmentType } from "docx";
import { saveAs } from "file-saver";

type AttendanceTakerProps = {
  event: any;
  members: any[];
  existingAttendance: any[];
};

const AttendanceTaker = ({
  event,
  members,
  existingAttendance,
}: AttendanceTakerProps) => {
  const router = useRouter();
  const [attendance, setAttendance] = useState<{ [key: number]: boolean }>({});
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Inicializar attendance com dados existentes
  useEffect(() => {
    if (existingAttendance.length > 0) {
      const attendanceMap: { [key: number]: boolean } = {};
      existingAttendance.forEach((att) => {
        attendanceMap[att.memberId] = att.isPresent;
      });
      setAttendance(attendanceMap);
    } else {
      // Inicializar todos como presentes por padrão
      const attendanceMap: { [key: number]: boolean } = {};
      members.forEach((member) => {
        attendanceMap[member.id] = true;
      });
      setAttendance(attendanceMap);
    }
  }, [existingAttendance, members]);

  const toggleAttendance = (memberId: number) => {
    setAttendance((prev) => ({
      ...prev,
      [memberId]: !prev[memberId],
    }));
  };

  const markAllPresent = () => {
    const newAttendance: { [key: number]: boolean } = {};
    members.forEach((member) => {
      newAttendance[member.id] = true;
    });
    setAttendance(newAttendance);
  };

  const markAllAbsent = () => {
    const newAttendance: { [key: number]: boolean } = {};
    members.forEach((member) => {
      newAttendance[member.id] = false;
    });
    setAttendance(newAttendance);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    const formData = new FormData();
    formData.append("eventId", event.id.toString());

    const attendanceData = members.map((member) => ({
      memberId: member.id,
      isPresent: attendance[member.id] || false,
    }));

    formData.append("attendanceData", JSON.stringify(attendanceData));

    const result = await bulkUpdateAttendance(
      { success: false, error: false },
      formData
    );

    setLoading(false);

    if (result.success) {
      toast.success("Presença salva com sucesso!");
      router.push("/list/attendance"); // ✅ Volta para a tela de presença
      router.refresh();
    } else {
      toast.error("Erro ao salvar presença");
    }
  };

  const presentCount = Object.values(attendance).filter((v) => v).length;
  const absentCount = members.length - presentCount;
  const attendancePercentage = members.length > 0 
    ? ((presentCount / members.length) * 100).toFixed(1) 
    : 0;

  // ✅ Função para exportar para Word
  const exportToWord = async () => {
    setExporting(true);

    try {
      const presentMembers = members.filter((m) => attendance[m.id]);
      const absentMembers = members.filter((m) => !attendance[m.id]);

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              // Título
              new Paragraph({
                text: "RELATÓRIO DE PRESENÇA",
                heading: "Heading1",
                alignment: AlignmentType.CENTER,
                spacing: { after: 300 },
              }),

              // Informações do Evento
              new Paragraph({
                text: `Evento: ${event.title}`,
                spacing: { after: 200 },
                children: [
                  new TextRun({
                    text: `Evento: `,
                    bold: true,
                  }),
                  new TextRun({
                    text: event.title,
                  }),
                ],
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Data: ",
                    bold: true,
                  }),
                  new TextRun({
                    text: new Date(event.date).toLocaleDateString("pt-BR"),
                  }),
                ],
                spacing: { after: 200 },
              }),

              ...(event.startTime
                ? [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Horário: ",
                          bold: true,
                        }),
                        new TextRun({
                          text: new Date(event.startTime).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          }),
                        }),
                      ],
                      spacing: { after: 200 },
                    }),
                  ]
                : []),

              ...(event.society
                ? [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Sociedade: ",
                          bold: true,
                        }),
                        new TextRun({
                          text: event.society.name,
                        }),
                      ],
                      spacing: { after: 200 },
                    }),
                  ]
                : []),

              // Estatísticas
              new Paragraph({
                text: "ESTATÍSTICAS",
                heading: "Heading2",
                spacing: { before: 400, after: 200 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: `Total de Membros: `,
                    bold: true,
                  }),
                  new TextRun({
                    text: `${members.length}`,
                  }),
                ],
                spacing: { after: 100 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: `Presentes: `,
                    bold: true,
                    color: "008000",
                  }),
                  new TextRun({
                    text: `${presentCount}`,
                    color: "008000",
                  }),
                ],
                spacing: { after: 100 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: `Ausentes: `,
                    bold: true,
                    color: "FF0000",
                  }),
                  new TextRun({
                    text: `${absentCount}`,
                    color: "FF0000",
                  }),
                ],
                spacing: { after: 100 },
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: `Percentual de Presença: `,
                    bold: true,
                  }),
                  new TextRun({
                    text: `${attendancePercentage}%`,
                  }),
                ],
                spacing: { after: 400 },
              }),

              // Tabela de Presentes
              new Paragraph({
                text: "MEMBROS PRESENTES",
                heading: "Heading2",
                spacing: { before: 400, after: 200 },
              }),

              new Table({
                width: {
                  size: 100,
                  type: WidthType.PERCENTAGE,
                },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({ text: "Nome" })],
                        shading: { fill: "D3D3D3" },
                      }),
                      new TableCell({
                        children: [new Paragraph({ text: "Email" })],
                        shading: { fill: "D3D3D3" },
                      }),
                    ],
                  }),
                  ...presentMembers.map(
                    (member) =>
                      new TableRow({
                        children: [
                          new TableCell({
                            children: [new Paragraph(member.name)],
                          }),
                          new TableCell({
                            children: [new Paragraph(member.email || "-")],
                          }),
                        ],
                      })
                  ),
                ],
              }),

              // Tabela de Ausentes
              new Paragraph({
                text: "MEMBROS AUSENTES",
                heading: "Heading2",
                spacing: { before: 400, after: 200 },
              }),

              new Table({
                width: {
                  size: 100,
                  type: WidthType.PERCENTAGE,
                },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({ text: "Nome" })],
                        shading: { fill: "D3D3D3" },
                      }),
                      new TableCell({
                        children: [new Paragraph({ text: "Email" })],
                        shading: { fill: "D3D3D3" },
                      }),
                    ],
                  }),
                  ...absentMembers.map(
                    (member) =>
                      new TableRow({
                        children: [
                          new TableCell({
                            children: [new Paragraph(member.name)],
                          }),
                          new TableCell({
                            children: [new Paragraph(member.email || "-")],
                          }),
                        ],
                      })
                  ),
                ],
              }),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const fileName = `Presenca_${event.title.replace(/\s+/g, "_")}_${new Date(event.date).toLocaleDateString("pt-BR").replace(/\//g, "-")}.docx`;
      saveAs(blob, fileName);

      toast.success("Arquivo exportado com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar:", error);
      toast.error("Erro ao exportar arquivo");
    } finally {
      setExporting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Event Info */}
      <div className="bg-lamaSkyLight p-4 rounded-md">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h1 className="text-xl font-bold mb-2">{event.title}</h1>
            <div className="flex gap-4 text-sm text-gray-600">
              <span>📅 {new Date(event.date).toLocaleDateString("pt-BR")}</span>
              {event.startTime && (
                <span>
                  🕐{" "}
                  {new Date(event.startTime).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
              {event.society && <span>👥 {event.society.name}</span>}
            </div>
            {event.description && (
              <p className="mt-2 text-sm text-gray-700">{event.description}</p>
            )}
          </div>

          {/* ✅ Botão de Exportar */}
          <button
            type="button"
            onClick={exportToWord}
            disabled={exporting}
            className="ml-4 px-4 py-2 bg-purple-500 text-white rounded-md text-sm hover:bg-purple-600 disabled:opacity-50 flex items-center gap-2"
          >
            {exporting ? "Exportando..." : "📄 Exportar Word"}
          </button>
        </div>
      </div>

      {members.length > 0 ? (
        <>
          {/* Quick Actions e Estatísticas */}
          <div className="flex gap-4 items-center flex-wrap">
            <button
              type="button"
              onClick={markAllPresent}
              className="px-4 py-2 bg-green-500 text-white rounded-md text-sm hover:bg-green-600"
            >
              ✓ Marcar Todos Presentes
            </button>
            <button
              type="button"
              onClick={markAllAbsent}
              className="px-4 py-2 bg-red-500 text-white rounded-md text-sm hover:bg-red-600"
            >
              ✗ Marcar Todos Ausentes
            </button>

            {/* ✅ Estatísticas com Porcentagem */}
            <div className="ml-auto flex gap-6 items-center">
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {attendancePercentage}%
                </div>
                <div className="text-xs text-gray-500">Presença</div>
              </div>
              <div className="text-sm font-semibold">
                <span className="text-green-600">Presentes: {presentCount}</span>
                {" | "}
                <span className="text-red-600">Ausentes: {absentCount}</span>
                {" | "}
                <span className="text-gray-600">Total: {members.length}</span>
              </div>
            </div>
          </div>

          {/* Members List */}
          <div className="border rounded-md">
            <div className="bg-gray-50 p-3 border-b">
              <h2 className="font-semibold">Lista de Membros</h2>
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              {members.map((member) => (
                <div
                  key={member.id}
                  onClick={() => toggleAttendance(member.id)}
                  className="flex items-center justify-between p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={attendance[member.id] || false}
                      onChange={() => toggleAttendance(member.id)}
                      className="w-6 h-6 cursor-pointer accent-green-500"
                    />
                    <div>
                      <div className="font-medium text-base">{member.name}</div>
                      {member.email && (
                        <div className="text-xs text-gray-500">{member.email}</div>
                      )}
                    </div>
                  </div>
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      attendance[member.id]
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {attendance[member.id] ? "✓ Presente" : "✗ Ausente"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 sticky bottom-0 bg-white pt-4 border-t">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 disabled:opacity-50 font-semibold"
            >
              {loading ? "Salvando..." : "💾 Salvar Presença"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/list/attendance")}
              className="bg-gray-500 text-white px-6 py-3 rounded-md hover:bg-gray-600"
            >
              Cancelar
            </button>
          </div>
        </>
      ) : (
        <div className="text-center p-8 text-gray-500">
          Nenhum membro encontrado para este evento
        </div>
      )}
    </form>
  );
};

export default AttendanceTaker;