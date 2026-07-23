"use client";

import { bulkUpdateAttendance } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { ClipboardX, Plus, X } from "lucide-react";
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType, AlignmentType } from "docx";
import { saveAs } from "file-saver";
import AttendanceSheetScanner, { type CreatedMember, type CreatedVisitor } from "@/components/AttendanceSheetScanner";

type VisitorOption = { id: number; name: string; phone?: string | null };

type AttendanceTakerProps = {
  event: any;
  members: any[];
  existingAttendance: any[];
  /** Visitantes já cadastrados no escopo do evento */
  visitors?: VisitorOption[];
  /** Presenças de visitantes já gravadas para este evento */
  existingVisitorAttendance?: { visitorId: number; isPresent: boolean }[];
  /** Grupos sem visitantes (diaconia) escondem o bloco por completo */
  showVisitors?: boolean;
  /** Grupo do evento — onde entram os cadastros feitos pela leitura da folha */
  scopeRole?: string | null;
  backUrl?: string;
};

const AttendanceTaker = ({
  event,
  members: initialMembers,
  existingAttendance,
  visitors: initialVisitors = [],
  existingVisitorAttendance = [],
  showVisitors = true,
  scopeRole = null,
  backUrl = "/list/attendance",
}: AttendanceTakerProps) => {
  const router = useRouter();
  const [attendance, setAttendance] = useState<{ [key: number]: boolean }>({});
  const [excludedMembers, setExcludedMembers] = useState<Set<number>>(new Set());
  // Visitantes já cadastrados → marcados/desmarcados nesta chamada
  const [visitorAttendance, setVisitorAttendance] = useState<{ [key: number]: boolean }>({});
  // Visitantes digitados na hora → criados ao salvar
  const [newVisitors, setNewVisitors] = useState<{ name: string; phone: string }[]>([]);
  const [visitorName, setVisitorName] = useState("");
  const [visitorPhone, setVisitorPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  // Pessoas cadastradas na hora pela leitura da folha. Ficam em estado local
  // para não recarregar a página e perder a chamada em andamento.
  const [addedMembers, setAddedMembers] = useState<any[]>([]);
  const [addedVisitors, setAddedVisitors] = useState<VisitorOption[]>([]);

  const members = useMemo(
    () => [...initialMembers, ...addedMembers],
    [initialMembers, addedMembers],
  );
  const visitors = useMemo(
    () => [...initialVisitors, ...addedVisitors],
    [initialVisitors, addedVisitors],
  );

  useEffect(() => {
    const map: { [key: number]: boolean } = {};
    existingVisitorAttendance.forEach((va) => {
      map[va.visitorId] = va.isPresent;
    });
    setVisitorAttendance(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(existingVisitorAttendance)]);

  // Depende só dos membros vindos do servidor: incluir os cadastrados na hora
  // faria o efeito rodar de novo e apagar as marcações da leitura da folha.
  useEffect(() => {
    if (existingAttendance.length > 0) {
      const attendanceMap: { [key: number]: boolean } = {};
      existingAttendance.forEach((att) => {
        attendanceMap[att.memberId] = att.isPresent;
      });
      setAttendance(attendanceMap);
    } else {
      const attendanceMap: { [key: number]: boolean } = {};
      initialMembers.forEach((member) => {
        attendanceMap[member.id] = true;
      });
      setAttendance(attendanceMap);
    }
  }, [existingAttendance, initialMembers]);

  // ── Guard: evento sem presença ──────────────────────────────────────────────
  if (event.requiresAttendance === false) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
          <ClipboardX size={32} className="text-gray-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-1">Presença desativada</h2>
          <p className="text-sm text-gray-400 max-w-xs">
            Este evento foi marcado como <strong>sem controle de presença</strong>.
            Para reativar, volte à lista e use o botão de toggle no evento.
          </p>
        </div>
        <button
          onClick={() => router.push(backUrl)}
          className="mt-2 px-5 py-2.5 bg-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-300 transition"
        >
          ← Voltar para a lista
        </button>
      </div>
    );
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const toggleMemberExclusion = (memberId: number) => {
    setExcludedMembers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(memberId)) { newSet.delete(memberId); } else { newSet.add(memberId); }
      return newSet;
    });
  };

  const toggleAttendance = (memberId: number) => {
    setAttendance((prev) => ({ ...prev, [memberId]: !prev[memberId] }));
  };

  const markAllPresent = () => {
    const m: { [key: number]: boolean } = {};
    members.forEach((member) => { if (!excludedMembers.has(member.id)) m[member.id] = true; });
    setAttendance(m);
  };

  const markAllAbsent = () => {
    const m: { [key: number]: boolean } = {};
    members.forEach((member) => { if (!excludedMembers.has(member.id)) m[member.id] = false; });
    setAttendance(m);
  };

  // Foto da folha de papel: reconhecidos entram como presentes, o resto como
  // ausente. Membros excluídos da chamada não são tocados.
  const applyScan = (presentIds: number[]) => {
    const present = new Set(presentIds);
    const m: { [key: number]: boolean } = {};
    members.forEach((member) => {
      if (!excludedMembers.has(member.id)) m[member.id] = present.has(member.id);
    });
    // Membros criados agora ainda não estão em `members` nesta renderização.
    presentIds.forEach((id) => { m[id] = true });
    setAttendance(m);
  };

  // ── Visitantes ──────────────────────────────────────────────────────────────
  const toggleVisitor = (visitorId: number) => {
    setVisitorAttendance((prev) => ({ ...prev, [visitorId]: !prev[visitorId] }));
  };

  const addNewVisitor = () => {
    const name = visitorName.trim();
    if (!name) {
      toast.error("Digite o nome do visitante");
      return;
    }
    // Se já existe cadastrado com esse nome, apenas marca presença
    const existing = visitors.find((v) => v.name.trim().toLowerCase() === name.toLowerCase());
    if (existing) {
      setVisitorAttendance((prev) => ({ ...prev, [existing.id]: true }));
      toast.info(`${existing.name} já é cadastrado — marcado como presente.`);
    } else {
      setNewVisitors((prev) => [...prev, { name, phone: visitorPhone.trim() }]);
    }
    setVisitorName("");
    setVisitorPhone("");
  };

  const removeNewVisitor = (index: number) => {
    setNewVisitors((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("eventId", event.id.toString());

    const attendanceData = members
      .filter((member) => !excludedMembers.has(member.id))
      .map((member) => ({ memberId: member.id, isPresent: attendance[member.id] || false }));

    formData.append("attendanceData", JSON.stringify(attendanceData));
    formData.append(
      "visitorData",
      JSON.stringify(
        visitors.map((v) => ({ visitorId: v.id, isPresent: visitorAttendance[v.id] || false }))
      )
    );
    formData.append("newVisitors", JSON.stringify(newVisitors));

    const result = await bulkUpdateAttendance({ success: false, error: false }, formData);
    setLoading(false);

    if (result.success) {
      toast.success("Presença salva com sucesso!");
      router.push(backUrl);
      router.refresh();
    } else {
      toast.error("Erro ao salvar presença");
    }
  };

  const activeMembers        = members.filter((m) => !excludedMembers.has(m.id));
  const excludedMembersList  = members.filter((m) =>  excludedMembers.has(m.id));
  const presentCount         = activeMembers.filter((m) => attendance[m.id]).length;
  const absentCount          = activeMembers.length - presentCount;
  const attendancePercentage = activeMembers.length > 0 ? ((presentCount / activeMembers.length) * 100).toFixed(1) : 0;

  const presentVisitors      = visitors.filter((v) => visitorAttendance[v.id]);
  const visitorCount         = presentVisitors.length + newVisitors.length;
  const presentVisitorNames  = [...presentVisitors.map((v) => v.name), ...newVisitors.map((v) => v.name)];
  const totalParticipants    = presentCount + visitorCount;

  const exportToWord = async () => {
    setExporting(true);
    try {
      const presentMembers = activeMembers.filter((m) => attendance[m.id]);
      const absentMembers  = activeMembers.filter((m) => !attendance[m.id]);

      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({ text: "RELATÓRIO DE PRESENÇA", heading: "Heading1", alignment: AlignmentType.CENTER, spacing: { after: 300 } }),
            new Paragraph({ children: [new TextRun({ text: `Evento: `, bold: true }), new TextRun({ text: event.title })], spacing: { after: 200 } }),
            new Paragraph({ children: [new TextRun({ text: "Data: ", bold: true }), new TextRun({ text: new Date(event.date).toLocaleDateString("pt-BR") })], spacing: { after: 200 } }),
            new Paragraph({ text: "ESTATÍSTICAS", heading: "Heading2", spacing: { before: 400, after: 200 } }),
            new Paragraph({ children: [new TextRun({ text: `Total de Membros Ativos: `, bold: true }), new TextRun({ text: `${activeMembers.length}` })], spacing: { after: 100 } }),
            ...(excludedMembersList.length > 0 ? [new Paragraph({ children: [new TextRun({ text: `Membros Excluídos: `, bold: true, color: "999999" }), new TextRun({ text: `${excludedMembersList.length}`, color: "999999" })], spacing: { after: 100 } })] : []),
            new Paragraph({ children: [new TextRun({ text: `Presentes: `, bold: true, color: "008000" }), new TextRun({ text: `${presentCount}`, color: "008000" })], spacing: { after: 100 } }),
            new Paragraph({ children: [new TextRun({ text: `Ausentes: `, bold: true, color: "FF0000" }), new TextRun({ text: `${absentCount}`, color: "FF0000" })], spacing: { after: 100 } }),
            new Paragraph({ children: [new TextRun({ text: `Visitas: `, bold: true, color: "0000FF" }), new TextRun({ text: `${visitorCount}`, color: "0000FF" })], spacing: { after: 100 } }),
            new Paragraph({ children: [new TextRun({ text: `Total de Participantes: `, bold: true }), new TextRun({ text: `${totalParticipants}` })], spacing: { after: 100 } }),
            new Paragraph({ children: [new TextRun({ text: `Percentual de Presença: `, bold: true }), new TextRun({ text: `${attendancePercentage}%` })], spacing: { after: 400 } }),
            new Paragraph({ text: "MEMBROS PRESENTES", heading: "Heading2", spacing: { before: 400, after: 200 } }),
            new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "Nome" })], shading: { fill: "D3D3D3" } }), new TableCell({ children: [new Paragraph({ text: "Email" })], shading: { fill: "D3D3D3" } })] }), ...presentMembers.map((member) => new TableRow({ children: [new TableCell({ children: [new Paragraph(member.name)] }), new TableCell({ children: [new Paragraph(member.email || "-")] })] }))] }),
            new Paragraph({ text: "MEMBROS AUSENTES", heading: "Heading2", spacing: { before: 400, after: 200 } }),
            new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "Nome" })], shading: { fill: "D3D3D3" } }), new TableCell({ children: [new Paragraph({ text: "Email" })], shading: { fill: "D3D3D3" } })] }), ...absentMembers.map((member) => new TableRow({ children: [new TableCell({ children: [new Paragraph(member.name)] }), new TableCell({ children: [new Paragraph(member.email || "-")] })] }))] }),
            ...(presentVisitorNames.length > 0 ? [
              new Paragraph({ text: "VISITANTES PRESENTES", heading: "Heading2", spacing: { before: 400, after: 200 } }),
              new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "Nome" })], shading: { fill: "D3D3D3" } })] }), ...presentVisitorNames.map((name) => new TableRow({ children: [new TableCell({ children: [new Paragraph(name)] })] }))] }),
            ] : []),
            ...(excludedMembersList.length > 0 ? [
              new Paragraph({ text: "MEMBROS EXCLUÍDOS (NÃO ERAM MEMBROS NESTA DATA)", heading: "Heading2", spacing: { before: 400, after: 200 } }),
              new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "Nome" })], shading: { fill: "D3D3D3" } }), new TableCell({ children: [new Paragraph({ text: "Email" })], shading: { fill: "D3D3D3" } })] }), ...excludedMembersList.map((member) => new TableRow({ children: [new TableCell({ children: [new Paragraph(member.name)] }), new TableCell({ children: [new Paragraph(member.email || "-")] })] }))] }),
            ] : []),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `Presenca_${event.title.replace(/\s+/g, "_")}_${new Date(event.date).toLocaleDateString("pt-BR").replace(/\//g, "-")}.docx`);
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
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-bold mb-2 break-words">{event.title}</h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
              <span className="whitespace-nowrap">📅 {new Date(event.date).toLocaleDateString("pt-BR")}</span>
              {event.startTime && (
                <span className="whitespace-nowrap">🕐 {new Date(event.startTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
              )}
              {event.society && <span className="whitespace-nowrap">👥 {event.society.name}</span>}
            </div>
            {event.description && <p className="mt-2 text-sm text-gray-700">{event.description}</p>}
          </div>
          <button type="button" onClick={exportToWord} disabled={exporting}
            className="sm:ml-4 self-start shrink-0 px-4 py-2 bg-purple-500 text-white rounded-md text-sm hover:bg-purple-600 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap">
            {exporting ? "Exportando..." : "📄 Exportar Word"}
          </button>
        </div>
      </div>

      {members.length > 0 ? (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-wrap">
            <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-4">
              <button type="button" onClick={markAllPresent} className="px-3 sm:px-4 py-2 bg-green-500 text-white rounded-md text-sm hover:bg-green-600">
                ✓ Todos Presentes
              </button>
              <button type="button" onClick={markAllAbsent} className="px-3 sm:px-4 py-2 bg-red-500 text-white rounded-md text-sm hover:bg-red-600">
                ✗ Todos Ausentes
              </button>
            </div>

            {scopeRole && (
              <AttendanceSheetScanner
                candidates={activeMembers.map((m) => ({ id: m.id, name: m.name }))}
                onApply={applyScan}
                role={scopeRole}
                allowVisitors={showVisitors}
                onMembersCreated={(created: CreatedMember[]) =>
                  setAddedMembers((prev) => [...prev, ...created])
                }
                onVisitorsCreated={(created: CreatedVisitor[]) => {
                  setAddedVisitors((prev) => [...prev, ...created]);
                  // Visitante que estava na folha entra presente no evento.
                  setVisitorAttendance((prev) => {
                    const next = { ...prev };
                    created.forEach((v) => { next[v.id] = true });
                    return next;
                  });
                }}
                accentColor="#7c3aed"
              />
            )}

            <div className="sm:ml-auto flex items-center gap-4 sm:gap-6">
              <div className="shrink-0">
                <div className="text-2xl font-bold text-blue-600 leading-none">{attendancePercentage}%</div>
                <div className="text-xs text-gray-500">Presença</div>
              </div>
              {/* Contadores como itens de flex: com " | " no meio do texto eles
                  quebravam a linha em qualquer lugar no celular. */}
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm font-semibold">
                <span className="text-green-600 whitespace-nowrap">Presentes: {presentCount}</span>
                <span className="text-red-600 whitespace-nowrap">Ausentes: {absentCount}</span>
                {showVisitors && <span className="text-blue-600 whitespace-nowrap">Visitas: {visitorCount}</span>}
                <span className="text-gray-600 whitespace-nowrap">Total: {totalParticipants}</span>
              </div>
            </div>
          </div>

          {excludedMembersList.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-yellow-700 font-semibold">⚠️ {excludedMembersList.length} membro(s) excluído(s)</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {excludedMembersList.map((member) => (
                  <span key={member.id} onClick={() => toggleMemberExclusion(member.id)}
                    className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm cursor-pointer hover:bg-yellow-200">
                    {member.name} ✕
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="border rounded-md">
            <div className="bg-gray-50 p-3 border-b">
              <h2 className="font-semibold">Lista de Membros ({activeMembers.length} ativos)</h2>
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              {activeMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between gap-2 sm:gap-3 p-3 sm:p-4 border-b hover:bg-gray-50">
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    <input type="checkbox" checked={attendance[member.id] || false}
                      onChange={() => toggleAttendance(member.id)}
                      className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 cursor-pointer accent-green-500" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm sm:text-base break-words">{member.name}</div>
                      {member.email && <div className="text-xs text-gray-500 truncate">{member.email}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <span className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap ${attendance[member.id] ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {attendance[member.id] ? "✓ Presente" : "✗ Ausente"}
                    </span>
                    <button type="button" onClick={() => toggleMemberExclusion(member.id)}
                      className="px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300"
                      title="Não era membro nesta data">🚫</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── VISITANTES ─────────────────────────────────────────────────── */}
          {showVisitors && (
          <div className="border rounded-md">
            <div className="bg-blue-50 p-3 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <h2 className="font-semibold text-blue-900">👤 Visitantes ({visitorCount} presente(s))</h2>
              <span className="text-xs text-blue-700">Marque quem veio ou adicione novos pelo nome</span>
            </div>

            {/* Adicionar visitante pelo nome */}
            <div className="p-3 border-b bg-white flex flex-wrap gap-2 items-center">
              <input
                type="text"
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addNewVisitor(); } }}
                placeholder="Nome do visitante"
                className="flex-1 min-w-[180px] px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="text"
                value={visitorPhone}
                onChange={(e) => setVisitorPhone(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addNewVisitor(); } }}
                placeholder="Telefone (opcional)"
                className="flex-1 min-w-[140px] sm:flex-none sm:w-[170px] px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button type="button" onClick={addNewVisitor}
                className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 flex items-center gap-1.5">
                <Plus size={15} /> Adicionar
              </button>
            </div>

            {/* Novos visitantes desta chamada */}
            {newVisitors.length > 0 && (
              <div className="p-3 border-b bg-blue-50/40 flex flex-wrap gap-2">
                {newVisitors.map((v, i) => (
                  <span key={`${v.name}-${i}`}
                    className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-1.5">
                    {v.name}{v.phone && <span className="text-blue-500 text-xs">· {v.phone}</span>}
                    <button type="button" onClick={() => removeNewVisitor(i)} className="hover:text-blue-950">
                      <X size={13} />
                    </button>
                  </span>
                ))}
                <span className="text-xs text-blue-600 self-center ml-1">
                  serão cadastrados na lista de visitantes ao salvar
                </span>
              </div>
            )}

            {/* Visitantes já cadastrados no grupo */}
            {visitors.length > 0 ? (
              <div className="max-h-[300px] overflow-y-auto">
                {visitors.map((v) => (
                  <div key={v.id} className="flex items-center justify-between gap-2 sm:gap-3 p-3 sm:p-4 border-b hover:bg-gray-50">
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <input type="checkbox" checked={visitorAttendance[v.id] || false}
                        onChange={() => toggleVisitor(v.id)}
                        className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 cursor-pointer accent-blue-500" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm sm:text-base break-words">{v.name}</div>
                        {v.phone && <div className="text-xs text-gray-500 truncate">{v.phone}</div>}
                      </div>
                    </div>
                    <span className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 ${visitorAttendance[v.id] ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-500"}`}>
                      {visitorAttendance[v.id] ? "✓ Presente" : "Ausente"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-sm text-gray-400 text-center">
                Nenhum visitante cadastrado ainda neste grupo.
              </div>
            )}
          </div>
          )}

          <div className="flex gap-2 sm:gap-4 sticky bottom-0 bg-white pt-4 pb-2 border-t">
            <button type="submit" disabled={loading}
              className="flex-1 bg-blue-500 text-white px-4 sm:px-6 py-3 rounded-md hover:bg-blue-600 disabled:opacity-50 font-semibold whitespace-nowrap">
              {loading ? "Salvando..." : "💾 Salvar Presença"}
            </button>
            <button type="button" onClick={() => router.push(backUrl)}
              className="bg-gray-500 text-white px-4 sm:px-6 py-3 rounded-md hover:bg-gray-600 whitespace-nowrap shrink-0">
              Cancelar
            </button>
          </div>
        </>
      ) : (
        <div className="text-center p-8 text-gray-500">Nenhum membro encontrado para este evento</div>
      )}
    </form>
  );
};

export default AttendanceTaker;