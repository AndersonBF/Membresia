"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { eventSchema, EventSchema } from "@/lib/formValidationSchemas";
import { createEvent, updateEvent } from "@/lib/actions";
import { Dispatch, SetStateAction, useTransition, useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { Globe, Lock } from "lucide-react";

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
  const [isPublic, setIsPublic] = useState<boolean>(data?.isPublic ?? false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<EventSchema>({
    resolver: zodResolver(eventSchema),
  });

  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onSubmit = handleSubmit((formData) => {
    startTransition(async () => {
      const action = type === "create" ? createEvent : updateEvent;
      const result = await action({ success: false, error: false }, formData);

      if (result.success) {
        toast.success(
          `Evento ${type === "create" ? "criado" : "atualizado"} com sucesso!`
        );
        setOpen(false);
        router.refresh();
      } else {
        toast.error("Ocorreu um erro ao salvar o evento!");
      }
    });
  });

  const { societies = [] } = relatedData || {};

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Criar novo evento" : "Atualizar evento"}
      </h1>

      {/* TÍTULO */}
      <InputField
        label="Título do Evento"
        name="title"
        defaultValue={data?.title || ""}
        register={register}
        error={errors?.title}
      />

      {/* DATA */}
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

      {/* ✅ SOCIEDADE */}
      <div className="flex flex-col gap-2">
        <label className="text-xs text-gray-500">Sociedade</label>
        <select
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
          {...register("societyId")}
          defaultValue={data?.societyId || ""}
        >
          <option value="">Selecione uma sociedade (opcional)</option>
          {societies.map((society: any) => (
            <option key={society.id} value={society.id}>
              {society.name}
            </option>
          ))}
        </select>
        {errors.societyId?.message && (
          <p className="text-xs text-red-400">
            {errors.societyId.message.toString()}
          </p>
        )}
      </div>

      {/* GRUPO (sem sociedade — ex.: EBD) */}
      <div className="flex flex-col gap-2">
        <label className="text-xs text-gray-500">Grupo (opcional)</label>
        <select
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
          {...register("category")}
          defaultValue={data?.category || ""}
        >
          <option value="">Nenhum</option>
          <option value="ebd">EBD — Escola Bíblica Dominical</option>
          <option value="diaconia">Diaconia</option>
          <option value="conselho">Conselho</option>
          <option value="ministerio">Ministério</option>
        </select>
        <p className="text-[11px] text-gray-400">
          Se selecionar um grupo, o evento aparecerá apenas para esse grupo (ignora a sociedade).
        </p>
      </div>

      {/* DESCRIÇÃO */}
      <div className="flex flex-col gap-2">
        <label className="text-xs text-gray-500">Descrição</label>
        <textarea
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm"
          rows={4}
          placeholder="Descreva o evento"
          {...register("description")}
          defaultValue={data?.description || ""}
        />
        {errors.description?.message && (
          <p className="text-xs text-red-400">
            {errors.description.message.toString()}
          </p>
        )}
      </div>

      {/* VISIBILIDADE */}
      <div className="flex flex-col gap-2">
        <label className="text-xs text-gray-500">Visibilidade</label>
        <button
          type="button"
          onClick={() => {
            const next = !isPublic
            setIsPublic(next)
            setValue("isPublic", next)
          }}
          className="flex items-center gap-3 p-3 rounded-lg border transition-colors text-left"
          style={{
            borderColor: isPublic ? "#3b82f6" : "#d1d5db",
            background: isPublic ? "#eff6ff" : "#f9fafb",
          }}
        >
          <div
            className="flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0"
            style={{ background: isPublic ? "#3b82f6" : "#6b7280" }}
          >
            {isPublic
              ? <Globe size={15} color="white" />
              : <Lock size={15} color="white" />
            }
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: isPublic ? "#1d4ed8" : "#374151" }}>
              {isPublic ? "Evento Público" : "Evento Privado"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {isPublic
                ? "Visível para toda a congregação"
                : "Visível apenas para membros do grupo"}
            </p>
          </div>
          {/* pill indicator */}
          <div className="ml-auto flex-shrink-0">
            <div
              className="w-10 h-5 rounded-full transition-colors relative"
              style={{ background: isPublic ? "#3b82f6" : "#d1d5db" }}
            >
              <div
                className="w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow-sm"
                style={{ left: isPublic ? "calc(100% - 18px)" : "2px" }}
              />
            </div>
          </div>
        </button>
        {/* hidden field so react-hook-form tracks the value */}
        <input type="hidden" {...register("isPublic")} value={isPublic ? "true" : "false"} />
      </div>

      {/* HORÁRIO DE INÍCIO */}
      <InputField
        label="Horário de Início"
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

      {/* HORÁRIO DE TÉRMINO */}
      <InputField
        label="Horário de Término"
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

      {/* CAMPO OCULTO PARA UPDATE */}
      {type === "update" && data && (
        <input
          type="hidden"
          {...register("id")}
          defaultValue={data.id}
        />
      )}

      <button 
        className="bg-blue-500 text-white p-2 rounded-md disabled:opacity-50"
        disabled={isPending}
      >
        {isPending 
          ? "Salvando..." 
          : type === "create" ? "Criar" : "Atualizar"}
      </button>
    </form>
  );
};

export default EventForm;