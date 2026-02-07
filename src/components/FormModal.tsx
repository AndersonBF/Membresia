"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { deleteMember } from "@/lib/actions";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const MemberForm = dynamic(() => import("./forms/MemberForm"), {
  loading: () => <p>Carregando...</p>,
});

type FormModalProps = {
  table: "member";
  type: "create" | "update" | "delete";
  data?: any;
  id?: number;
};

const FormModal = ({ table, type, data, id }: FormModalProps) => {
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
          <p className="text-center">
            Tem certeza que deseja excluir?
          </p>

          <button
            onClick={handleDelete}
            disabled={isPending}
            className="bg-red-600 text-white py-2 rounded-md disabled:opacity-50"
          >
            {isPending ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      );
    }

    if (table === "member") {
      return (
        <MemberForm
          type={type}
          data={data}
          setOpen={setOpen}
        />
      );
    }

    return null;
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`w-7 h-7 flex items-center justify-center rounded-full ${
          type === "delete"
            ? "bg-red-200"
            : type === "update"
            ? "bg-lamaSky"
            : "bg-lamaYellow"
        }`}
      >
        <Image
          src={
            type === "delete"
              ? "/delete.png"
              : type === "update"
              ? "/edit.png"
              : "/create.png"
          }
          alt={type}
          width={16}
          height={16}
        />
      </button>

      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-md relative w-[90%] max-w-lg">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3"
            >
              ✕
            </button>

            {renderForm()}
          </div>
        </div>
      )}
    </>
  );
};

export default FormModal;
