"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { memberSchema, MemberSchema } from "@/lib/formValidationSchemas";
import { createMember, updateMember } from "@/lib/actions";
import { Dispatch, SetStateAction, useTransition } from "react"; // Adicione useTransition
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const MemberForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: any;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MemberSchema>({
    resolver: zodResolver(memberSchema),
  });

  const router = useRouter();
  const [isPending, startTransition] = useTransition(); // Para indicar carregamento se necessário

  const onSubmit = handleSubmit((data) => {
    // startTransition permite que a UI fique responsiva enquanto a action roda
    startTransition(async () => {
      // 1. Escolhe a ação correta
      const actionToRun = type === "create" ? createMember : updateMember;

      // 2. Chama a Server Action DIRETAMENTE e espera a resposta (await)
      // Passamos um estado inicial "falso" apenas para satisfazer a assinatura da função (currentState)
      const result = await actionToRun({ success: false, error: false }, data);

      // 3. Verifica o resultado IMEDIATAMENTE
      if (result.success) {
        toast(`Membro ${type === "create" ? "criado" : "atualizado"} com sucesso!`);
        setOpen(false); // <--- Fecha o modal garantido
        router.refresh(); // <--- Atualiza a lista
      } else {
        toast.error("Ocorreu um erro!");
      }
    });
  });

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Criar novo membro" : "Atualizar membro"}
      </h1>
      
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Nome Completo"
          name="name"
          defaultValue={data?.name}
          register={register}
          error={errors?.name}
        />
        {/* Se for update, precisamos garantir que o ID vá junto no objeto data */}
        {data && (
           <input type="hidden" value={data.id} {...register("id")} />
        )}
        <InputField
          label="Email"
          name="email"
          defaultValue={data?.email}
          register={register}
          error={errors?.email}
        />
        <InputField
          label="Telefone"
          name="phone"
          defaultValue={data?.phone}
          register={register}
          error={errors?.phone}
        />
      </div>
      
      {/* Botão desabilitado enquanto carrega */}
      <button 
        className="bg-blue-400 text-white p-2 rounded-md disabled:opacity-50"
        disabled={isPending}
      >
        {isPending ? "Carregando..." : type === "create" ? "Criar" : "Atualizar"}
      </button>
    </form>
  );
};

export default MemberForm;