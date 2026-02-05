"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { eventSchema, EventSchema } from "@/lib/formValidationSchemas";
import { createEvent, updateEvent } from "@/lib/actions";
import { Dispatch, SetStateAction, useTransition } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const EventForm = ({
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
  } = useForm<EventSchema>({
    resolver: zodResolver(eventSchema),
  });

  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onSubmit = handleSubmit((data) => {
    // Usamos startTransition para não travar a UI enquanto a action roda
    startTransition(async () => {
      const action = type === "create" ? createEvent : updateEvent;

      // Chama a action diretamente e espera a resposta
      const result = await action({ success: false, error: false }, data);

      if (result.success) {
        toast(`Evento ${type === "create" ? "criado" : "atualizado"} com sucesso!`);
        setOpen(false); // Fecha o modal imediatamente
        router.refresh(); // Atualiza a lista na tela
      } else {
        toast.error("Ocorreu um erro ao salvar o evento!");
      }
    });
  });

  const { societies = [] } = relatedData || {};

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Criar novo evento" : "Atualizar evento"}
      </h1>

      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Título"
          name="title"
          defaultValue={data?.title}
          register={register}
          error={errors?.title}
        />

        {/* Campo oculto para garantir o ID no update */}
        {data && (
           <input type="hidden" value={data.id} {...register("id")} />
        )}

        <InputField
          label="Data"
          name="date"
          type="date"
          defaultValue={
            data?.date
              ? new Date(data.date).toISOString().split("T")[0]
              : ""
          }
          register={register}
          error={errors?.date}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs text-gray-500">Descrição</label>
        <textarea
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm"
          {...register("description")}
          defaultValue={data?.description}
        />
        {errors.description?.message && (
          <p className="text-xs text-red-400">
            {errors.description.message.toString()}
          </p>
        )}
      </div>

      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Início"
          name="startTime"
          type="datetime-local"
          defaultValue={
            data?.startTime
              ? new Date(data.startTime).toISOString().slice(0, 16)
              : ""
          }
          register={register}
          error={errors?.startTime}
        />

        <InputField
          label="Fim"
          name="endTime"
          type="datetime-local"
          defaultValue={
            data?.endTime
              ? new Date(data.endTime).toISOString().slice(0, 16)
              : ""
          }
          register={register}
          error={errors?.endTime}
        />
      </div>

      <button 
        className="bg-blue-400 text-white p-2 rounded-md disabled:opacity-50"
        disabled={isPending}
      >
        {isPending ? "Salvando..." : type === "create" ? "Criar" : "Atualizar"}
      </button>
    </form>
  );
};

export default EventForm;