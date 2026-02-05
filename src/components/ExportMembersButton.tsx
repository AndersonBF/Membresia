"use client";

const ExportMembersButton = () => {
  const handleExport = async () => {
    try {
      const response = await fetch("/api/members/export");

      if (!response.ok) {
        throw new Error("Erro ao exportar membros");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "membros.xlsx";
      document.body.appendChild(a);
      a.click();

      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Erro ao gerar planilha");
    }
  };

  return (
    <div className="flex justify-end mt-4">
      <button
        onClick={handleExport}
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
      >
        Exportar membros (Excel)
      </button>
    </div>
  );
};

export default ExportMembersButton;
