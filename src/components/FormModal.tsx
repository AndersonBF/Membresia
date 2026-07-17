"use client";

import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { 
  deleteMember, 
  deleteEvent, 
  deleteDocument,
  deleteAttendance 
} from "@/lib/actions";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X } from "lucide-react";

const MemberForm = dynamic(() => import("./forms/MemberForm"), {
  loading: () => <p>Carregando...</p>,
});

const DocumentForm = dynamic(() => import("./forms/DocumentForm"), {
  loading: () => <p>Carregando...</p>,
});

const EventForm = dynamic(() => import("./forms/EventForm"), {
  loading: () => <p>Carregando...</p>,
});

type TableType = "member" | "assignment" | "result" | "attendance" | "event" | "announcement" | "document";

type FormModalProps = {
  table: TableType;
  type: "create" | "update" | "delete";
  data?: any;
  id?: number | string;
  relatedData?: any;
};

const FormModal = ({
  table,
  type,
  data,
  id,
  relatedData,
}: FormModalProps) => {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    // ✅ Debug detalhado
    console.log("🔍 INICIANDO DELETE:", {
      table: table,
      id: id,
      idType: typeof id,
      dataId: data?.id,
      timestamp: new Date().toISOString()
    });

    // ✅ Validação extra
    if (data && data.id !== id) {
      console.error("❌ ERRO CRÍTICO: ID não corresponde ao data!", {
        idPassado: id,
        idDoData: data.id
      });
      toast.error("Erro: ID inconsistente!");
      return;
    }

    const formData = new FormData();
    formData.append("id", String(id));
    formData.append("table", table);

    startTransition(async () => {
      let deleteAction;
      let entityName = "Registro";
      
      switch(table) {
        case "member":
          console.log("👤 Selecionou: deleteMember");
          deleteAction = deleteMember;
          entityName = "Membro";
          break;
        case "event":
          console.log("📅 Selecionou: deleteEvent");
          deleteAction = deleteEvent;
          entityName = "Evento";
          break;
        case "document":
          console.log("📄 Selecionou: deleteDocument");
          deleteAction = deleteDocument;
          entityName = "Documento";
          break;
        case "attendance":
          console.log("✅ Selecionou: deleteAttendance");
          deleteAction = deleteAttendance;
          entityName = "Presença";
          break;
        default:
          console.error("❓ Tabela desconhecida:", table);
          toast.error(`Exclusão não implementada para: ${table}`);
          return;
      }

      console.log(`🗑️ EXECUTANDO: delete${entityName} | ID: ${id}`);

      try {
        const result = await deleteAction(
          { success: false, error: false },
          formData
        );

        console.log("📊 RESULTADO:", {
          success: result.success,
          error: result.error,
          entityName,
          id
        });

        if (result.success) {
          toast.success(`✅ ${entityName} excluído com sucesso!`);
          setOpen(false);
          router.refresh();
        } else {
          toast.error(`❌ Erro ao excluir ${entityName.toLowerCase()}!`);
        }
      } catch (error) {
        console.error("💥 ERRO NA EXCLUSÃO:", error);
        toast.error(`Erro inesperado ao excluir ${entityName.toLowerCase()}!`);
      }
    });
  };

  const renderForm = () => {
    if (type === "delete") {
      return (
        <div className="flex flex-col gap-4">
          <div className="text-center">
            <p className="text-gray-700 font-semibold text-lg mb-2">
              ⚠️ Confirmar Exclusão
            </p>
            <p className="text-gray-600 text-sm">
              Tem certeza que deseja excluir este registro?
            </p>
          </div>

          {/* ✅ Informações de debug visíveis */}
          <div className="bg-gray-100 p-3 rounded-md text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-gray-600">Tabela:</span>
              <span className="font-semibold">{table}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">ID:</span>
              <span className="font-semibold">{id}</span>
            </div>
            {data?.title && (
              <div className="flex justify-between">
                <span className="text-gray-600">Título:</span>
                <span className="font-semibold truncate max-w-[200px]">
                  {data.title}
                </span>
              </div>
            )}
            {data?.name && (
              <div className="flex justify-between">
                <span className="text-gray-600">Nome:</span>
                <span className="font-semibold truncate max-w-[200px]">
                  {data.name}
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setOpen(false)}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-md transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-md transition disabled:opacity-50 font-semibold"
            >
              {isPending ? "Excluindo..." : "Confirmar"}
            </button>
          </div>
        </div>
      );
    }

    if (table === "member") {
      return <MemberForm type={type} data={data} setOpen={setOpen} />;
    }

    if (table === "document") {
      return (
        <DocumentForm
          type={type}
          data={data}
          relatedData={relatedData}
          setOpen={setOpen}
        />
      );
    }

    if (table === "event") {
      return (
        <EventForm
          type={type}
          data={data}
          relatedData={relatedData}
          setOpen={setOpen}
        />
      );
    }

    return null;
  };

  const Icon =
    type === "delete" ? Trash2 : type === "update" ? Pencil : Plus;

  const buttonStyle =
    type === "delete"
      ? "bg-red-600 hover:bg-red-700 text-white"
      : type === "update"
      ? "bg-blue-600 hover:bg-blue-700 text-white"
      : "bg-yellow-400 hover:bg-yellow-500 text-black";

  // Rótulo do botão de criação (os de editar/excluir continuam só com ícone)
  const createLabel: Record<TableType, string> = {
    member: "Adicionar membro",
    document: "Adicionar documento",
    event: "Adicionar evento",
    announcement: "Adicionar anúncio",
    attendance: "Adicionar presença",
    assignment: "Adicionar",
    result: "Adicionar",
  };

  return (
    <>
      {type === "create" ? (
        <button
          onClick={() => setOpen(true)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition ${buttonStyle}`}
        >
          <Icon size={15} />
          {createLabel[table]}
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className={`w-8 h-8 flex items-center justify-center rounded-full transition ${buttonStyle}`}
        >
          <Icon size={16} />
        </button>
      )}

      {open && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-md relative w-[90%] max-w-lg max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 text-gray-600 hover:text-black transition"
            >
              <X size={20} />
            </button>

            {renderForm()}
          </div>
        </div>
      )}
    </>
  );
};

export default FormModal;