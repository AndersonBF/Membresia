"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTransition, Dispatch, SetStateAction, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import InputField from "../InputField"; // Seu componente de texto
import { documentSchema, DocumentSchema } from "@/lib/formValidationSchemas";
import { createDocument } from "@/lib/actions";

const DocumentForm = ({
  setOpen,
  relatedData,
}: {
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: any;
}) => {
  // 1. Configuração do Formulário
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DocumentSchema>({
    resolver: zodResolver(documentSchema),
  });

  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [category, setCategory] = useState<string>(""); // Controla qual select aparece

  // 2. Função de Envio Corrigida
  const onSubmit = handleSubmit((data) => {
    
    // --- DEBUG: Veja isso no console do navegador (F12) se der erro ---
    console.log("Dados do Form:", data);
    
    // Preparando o FormData para enviar ao Server Action
    const formData = new FormData();
    formData.append("title", data.title);
    if (data.description) formData.append("description", data.description);

    // Lógica para enviar apenas o ID da categoria selecionada
    if (category === "society" && data.societyId) formData.append("societyId", data.societyId.toString());
    if (category === "ministry" && data.ministryId) formData.append("ministryId", data.ministryId.toString());
    if (category === "class" && data.bibleSchoolClassId) formData.append("bibleSchoolClassId", data.bibleSchoolClassId.toString());
    if (category === "council" && data.councilId) formData.append("councilId", data.councilId.toString());
    if (category === "diaconate" && data.diaconateId) formData.append("diaconateId", data.diaconateId.toString());

    // --- CORREÇÃO PRINCIPAL: CAPTURA DO ARQUIVO ---
    // O React Hook Form retorna um FileList. Precisamos pegar o item [0].
    // Usamos (data as any) porque o Zod no front às vezes tipa diferente do input file real.
    const fileList = (data as any).file;
    const fileToUpload = fileList && fileList.length > 0 ? fileList[0] : null;

    if (!fileToUpload) {
      toast.error("Por favor, selecione um arquivo para enviar.");
      return; // Para tudo se não tiver arquivo
    }

    formData.append("file", fileToUpload);

    // Envio com Transição (Server Action)
    startTransition(async () => {
      const result = await createDocument({ success: false, error: false }, formData);

      if (result.success) {
        toast.success("Documento enviado com sucesso!");
        setOpen(false); // Fecha o modal
        router.refresh(); // Atualiza a lista
      } else {
        toast.error("Erro ao salvar o documento.");
      }
    });
  });

  // Extraindo os dados das tabelas relacionadas
  const { societies, ministries, classes, councils, diaconates } = relatedData || {};

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">Novo Documento</h1>

      {/* Campos de Texto */}
      <div className="flex flex-col gap-4">
        <InputField
          label="Título do Documento"
          name="title"
          register={register}
          error={errors?.title}
        />
        
        <InputField
          label="Descrição (Opcional)"
          name="description"
          register={register}
          error={errors?.description}
        />
      </div>

      {/* Seleção de Categoria */}
      <div className="flex flex-col gap-2">
        <label className="text-xs text-gray-500">Vincular a qual grupo?</label>
        <select
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm cursor-pointer"
          onChange={(e) => setCategory(e.target.value)}
          defaultValue=""
        >
          <option value="">-- Geral (Sem vínculo) --</option>
          <option value="society">Sociedade Interna</option>
          <option value="ministry">Ministério</option>
          <option value="class">Classe EBD</option>
          <option value="council">Conselho</option>
          <option value="diaconate">Diaconia</option>
        </select>
      </div>

      {/* Selects Condicionais (Só aparecem se escolher a categoria acima) */}
      {category === "society" && societies && (
        <div className="flex flex-col gap-2 bg-gray-50 p-2 rounded">
          <label className="text-xs text-gray-500">Qual Sociedade?</label>
          <select className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm" {...register("societyId")}>
            <option value="">Selecione...</option>
            {societies.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      )}

      {category === "ministry" && ministries && (
        <div className="flex flex-col gap-2 bg-gray-50 p-2 rounded">
          <label className="text-xs text-gray-500">Qual Ministério?</label>
          <select className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm" {...register("ministryId")}>
            <option value="">Selecione...</option>
            {ministries.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
      )}

      {category === "class" && classes && (
        <div className="flex flex-col gap-2 bg-gray-50 p-2 rounded">
          <label className="text-xs text-gray-500">Qual Classe?</label>
          <select className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm" {...register("bibleSchoolClassId")}>
            <option value="">Selecione...</option>
            {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      )}

      {/* Para Conselho e Diaconia, pegamos o primeiro ID automaticamente (se houver) */}
      {category === "council" && councils && councils.length > 0 && (
         <input type="hidden" value={councils[0].id} {...register("councilId")} />
      )}
      
      {category === "diaconate" && diaconates && diaconates.length > 0 && (
         <input type="hidden" value={diaconates[0].id} {...register("diaconateId")} />
      )}

      {/* --- CORREÇÃO DO INPUT DE ARQUIVO --- */}
      <div className="flex flex-col gap-2 w-full">
        <label className="text-xs text-gray-500 font-semibold">Arquivo (PDF, Imagem, Word)</label>
        <input 
          type="file" 
          className="block w-full text-sm text-slate-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-violet-50 file:text-violet-700
            hover:file:bg-violet-100
            ring-[1.5px] ring-gray-300 rounded-md p-2"
          {...register("file")} // O nome "file" é crucial aqui
        />
        <span className="text-[10px] text-gray-400">Tamanho máximo recomendado: 4MB</span>
      </div>

      {/* Botão de Envio */}
      <button 
        className="bg-blue-400 text-white p-2 rounded-md hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        disabled={isPending}
      >
        {isPending ? "Enviando arquivo..." : "Salvar Documento"}
      </button>
    </form>
  );
};

export default DocumentForm;