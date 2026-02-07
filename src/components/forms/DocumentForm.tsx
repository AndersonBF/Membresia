"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTransition, Dispatch, SetStateAction, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import InputField from "../InputField";
import { documentSchema, DocumentSchema } from "@/lib/formValidationSchemas";
import { createDocument } from "@/lib/actions";

type DocumentFormProps = {
  type: "create" | "update";
  data?: Partial<DocumentSchema>;
  relatedData?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
};

const DocumentForm = ({
  type,
  data,
  relatedData,
  setOpen,
}: DocumentFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DocumentSchema>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      title: data?.title ?? "",
      description: data?.description ?? "",
    },
  });

  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [category, setCategory] = useState<string>("");

  const onSubmit = handleSubmit((data) => {
    const formData = new FormData();

    formData.append("title", data.title);
    if (data.description) formData.append("description", data.description);

    if (category === "society" && data.societyId)
      formData.append("societyId", String(data.societyId));

    if (category === "ministry" && data.ministryId)
      formData.append("ministryId", String(data.ministryId));

    if (category === "class" && data.bibleSchoolClassId)
      formData.append("bibleSchoolClassId", String(data.bibleSchoolClassId));

    if (category === "council" && data.councilId)
      formData.append("councilId", String(data.councilId));

    if (category === "diaconate" && data.diaconateId)
      formData.append("diaconateId", String(data.diaconateId));

    const fileList = (data as any).file as FileList | undefined;
    const file = fileList?.[0];

    if (!file) {
      toast.error("Selecione um arquivo para enviar.");
      return;
    }

    formData.append("file", file);

    startTransition(async () => {
      const result = await createDocument(
        { success: false, error: false },
        formData
      );

      if (result.success) {
        toast.success("Documento salvo com sucesso!");
        setOpen(false);
        router.refresh();
      } else {
        toast.error("Erro ao salvar o documento.");
      }
    });
  });

  const { societies, ministries, classes, councils, diaconates } =
    relatedData || {};

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Novo Documento" : "Editar Documento"}
      </h1>

      {/* TÍTULO / DESCRIÇÃO */}
      <div className="flex flex-col gap-4">
        <InputField
          label="Título do Documento"
          name="title"
          register={register}
          error={errors.title}
        />

        <InputField
          label="Descrição (Opcional)"
          name="description"
          register={register}
          error={errors.description}
        />
      </div>

      {/* CATEGORIA */}
      <div className="flex flex-col gap-2">
        <label className="text-xs text-gray-500">
          Vincular a qual grupo?
        </label>
        <select
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm"
          onChange={(e) => setCategory(e.target.value)}
          defaultValue=""
        >
          <option value="">Geral (Sem vínculo)</option>
          <option value="society">Sociedade Interna</option>
          <option value="ministry">Ministério</option>
          <option value="class">Classe EBD</option>
          <option value="council">Conselho</option>
          <option value="diaconate">Diaconia</option>
        </select>
      </div>

      {category === "society" && societies && (
        <select {...register("societyId")} className="input">
          <option value="">Selecione...</option>
          {societies.map((s: any) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      )}

      {category === "ministry" && ministries && (
        <select {...register("ministryId")} className="input">
          <option value="">Selecione...</option>
          {ministries.map((m: any) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      )}

      {category === "class" && classes && (
        <select {...register("bibleSchoolClassId")} className="input">
          <option value="">Selecione...</option>
          {classes.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      )}

      {category === "council" && councils?.[0] && (
        <input
          type="hidden"
          value={councils[0].id}
          {...register("councilId")}
        />
      )}

      {category === "diaconate" && diaconates?.[0] && (
        <input
          type="hidden"
          value={diaconates[0].id}
          {...register("diaconateId")}
        />
      )}

      {/* ARQUIVO */}
      <div className="flex flex-col gap-2">
        <label className="text-xs text-gray-500 font-semibold">
          Arquivo
        </label>
        <input
          type="file"
          {...register("file")}
          className="ring-[1.5px] ring-gray-300 rounded-md p-2 text-sm"
        />
      </div>

      <button
        disabled={isPending}
        className="bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
      >
        {isPending ? "Salvando..." : "Salvar Documento"}
      </button>
    </form>
  );
};

export default DocumentForm;
