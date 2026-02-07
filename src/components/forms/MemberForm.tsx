"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { memberSchema, MemberSchema } from "@/lib/formValidationSchemas";
import { createMember, updateMember } from "@/lib/actions";
import { Dispatch, SetStateAction, useTransition } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import InputField from "../InputField";

const MemberForm = ({
  type,
  data,
  setOpen,
}: {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MemberSchema>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      isActive: true,
      gender: "M", // exigido pelo schema
    },
  });

  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onSubmit = handleSubmit((formData) => {
    startTransition(async () => {
      const action =
        type === "create" ? createMember : updateMember;

      const result = await action(
        { success: false, error: false },
        formData
      );

      if (result.success) {
        toast.success(
          `Membro ${type === "create" ? "criado" : "atualizado"} com sucesso!`
        );
        setOpen(false);
        router.refresh();
      } else {
        toast.error("Erro ao salvar!");
      }
    });
  });

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Criar membro" : "Editar membro"}
      </h1>

      {/* CAMPOS VISÍVEIS */}
      <InputField
        label="Nome"
        name="name"
        defaultValue={data?.name}
        register={register}
        error={errors.name}
      />

      <InputField
        label="Email"
        name="email"
        defaultValue={data?.email}
        register={register}
        error={errors.email}
      />

      <InputField
        label="Telefone"
        name="phone"
        defaultValue={data?.phone}
        register={register}
        error={errors.phone}
      />

      {/* CAMPOS OBRIGATÓRIOS DO SCHEMA (HIDDEN) */}
      <input
        type="hidden"
        {...register("username")}
        defaultValue={data?.username ?? "usuario_temp"}
      />

      <input type="hidden" {...register("gender")} value="M" />

      <input type="hidden" {...register("isActive")} value="true" />

      {type === "create" && (
        <input
          type="hidden"
          {...register("password")}
          value="123456"
        />
      )}

      {type === "update" && (
        <input
          type="hidden"
          {...register("id")}
          defaultValue={data.id}
        />
      )}

      <button
        disabled={isPending}
        className="bg-blue-500 text-white p-2 rounded-md disabled:opacity-50"
      >
        {isPending
          ? "Salvando..."
          : type === "create"
          ? "Criar"
          : "Atualizar"}
      </button>
    </form>
  );
};

export default MemberForm;
