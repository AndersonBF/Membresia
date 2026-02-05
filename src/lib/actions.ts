"use server";

import { documentSchema } from "./formValidationSchemas";
import { revalidatePath } from "next/cache";
import { MemberSchema, EventSchema } from "./formValidationSchemas";
import prisma from "./prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

type CurrentState = { success: boolean; error: boolean };

export const createMember = async (
  currentState: CurrentState,
  data: MemberSchema
): Promise<CurrentState> => {
  try {
    await prisma.member.create({
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
      },
    });

    revalidatePath("/list/members");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateMember = async (
  currentState: CurrentState,
  data: MemberSchema
): Promise<CurrentState> => {
  if (!data.id) {
    return { success: false, error: true };
  }
  
  try {
    await prisma.member.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
      },
    });

    revalidatePath("/list/members");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteMember = async (
  currentState: CurrentState,
  data: FormData
): Promise<CurrentState> => {
  const id = data.get("id") as string;
  
  try {
    await prisma.member.delete({
      where: {
        id: parseInt(id),
      },
    });

    revalidatePath("/list/members");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

// ============ EVENT ACTIONS ============

export const createEvent = async (
  currentState: CurrentState,
  data: EventSchema
): Promise<CurrentState> => {
  try {
    console.log("Criando evento:", data); // ✅ Adicione
    await prisma.event.create({
      data: {
        title: data.title,
        description: data.description || null,
        date: data.date,
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        isPublic: data.isPublic,
        societyId: data.societyId || null,
      },
    });

    revalidatePath("/list/events");
    console.log("Evento criado com sucesso!"); // ✅ Adicione
    return { success: true, error: false };
  } catch (err) {
    console.log("Erro ao criar evento:", err); // ✅ Adicione
    return { success: false, error: true };
  }
};

export const updateEvent = async (
  currentState: CurrentState,
  data: EventSchema
): Promise<CurrentState> => {
  if (!data.id) {
    return { success: false, error: true };
  }

  try {
    await prisma.event.update({
      where: {
        id: data.id,
      },
      data: {
        title: data.title,
        description: data.description || null,
        date: data.date,
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        isPublic: data.isPublic,
        societyId: data.societyId || null,
      },
    });

    revalidatePath("/list/events");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteEvent = async (
  currentState: CurrentState,
  data: FormData
): Promise<CurrentState> => {
  const id = data.get("id") as string;

  try {
    await prisma.event.delete({
      where: {
        id: parseInt(id),
      },
    });

    revalidatePath("/list/events");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createDocument = async (
  currentState: CurrentState,
  data: FormData
): Promise<CurrentState> => {
  
  // 1. Converter FormData para Objeto para validação do Zod
  const rawData = Object.fromEntries(data);
  const validatedFields = documentSchema.safeParse(rawData);

  if (!validatedFields.success) {
    console.log(validatedFields.error.flatten().fieldErrors);
    return { success: false, error: true };
  }

  // 2. Processar o Arquivo
  const file = data.get("file") as File;

  if (!file || file.size === 0) {
    console.log("Arquivo ausente ou vazio");
    return { success: false, error: true };
  }

  try {
    // 3. Salvar Arquivo Localmente
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Gera nome único: Timestamp + NomeLimpo
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    
    // Caminho absoluto para salvar
    const uploadDir = path.join(process.cwd(), "public/uploads");
    
    // Garante que a pasta existe (opcional, mas recomendado)
    try { await mkdir(uploadDir, { recursive: true }); } catch (e) {}

    await writeFile(path.join(uploadDir, fileName), buffer);
    const fileUrl = `/uploads/${fileName}`;

    // 4. Salvar no Banco de Dados com as Relações
    await prisma.document.create({
      data: {
        title: validatedFields.data.title,
        description: validatedFields.data.description,
        fileUrl: fileUrl,
        
        // Conecta as relações se existirem no form
        societyId: validatedFields.data.societyId || null,
        councilId: validatedFields.data.councilId || null,
        diaconateId: validatedFields.data.diaconateId || null,
        ministryId: validatedFields.data.ministryId || null,
        bibleSchoolClassId: validatedFields.data.bibleSchoolClassId || null,
      },
    });

    revalidatePath("/list/documents");
    return { success: true, error: false };
  } catch (err) {
    console.log("Erro ao criar documento:", err);
    return { success: false, error: true };
  }
};

export const deleteDocument = async (
  currentState: CurrentState,
  data: FormData
): Promise<CurrentState> => {
  const id = data.get("id") as string;
  try {
    // Nota: O ideal seria deletar o arquivo físico aqui também usando fs.unlink
    await prisma.document.delete({
      where: { id: parseInt(id) },
    });
    revalidatePath("/list/documents");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};