"use client";

import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { deleteMember } from "@/lib/actions";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X } from "lucide-react";

const MemberForm = dynamic(() => import("./forms/MemberForm"), {
  loading: () => <p>Carregando...</p>,
});

const DocumentForm = dynamic(() => import("./forms/DocumentForm"), {
  loading: () => <p>Carregando...</p>,
});

type TableType = "member" | "assignment" | "result" | "attendance" | "event" | "announcement" | "document";

type FormModalProps = {
  table: TableType;
  type: "create" | "update" | "delete";
  data?: any;
  id?: number | string;
  relatedData?: any; // ✅ AGORA EXISTE
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
    const formData = new FormData();
    formData.append("id", String(id));

    startTransition(async () => {
      const result = await deleteMember(
        { success: false, error: false },
        formData
      );

      if (result.success) {
        toast.success("Registro excluído!");
        setOpen(false);
        router.refresh();
      } else {
        toast.error("Erro ao excluir!");
      }
    });
  };

  const renderForm = () => {
    if (type === "delete") {
      return (
        <div className="flex flex-col gap-4">
          <p className="text-center text-gray-700">
            Tem certeza que deseja excluir?
          </p>

          <button
            onClick={handleDelete}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700 text-white py-2 rounded-md transition disabled:opacity-50"
          >
            {isPending ? "Excluindo..." : "Excluir"}
          </button>
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

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`w-8 h-8 flex items-center justify-center rounded-full transition ${buttonStyle}`}
      >
        <Icon size={16} />
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-md relative w-[90%] max-w-lg">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 text-gray-600 hover:text-black"
            >
              <X size={18} />
            </button>

            {renderForm()}
          </div>
        </div>
      )}
    </>
  );
};

export default FormModal;
