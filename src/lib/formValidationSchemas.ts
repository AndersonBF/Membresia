import {z} from "zod";


export const memberSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Nome é obrigatório!" }),
  email: z.string().email({ message: "Email inválido!" }).or(z.literal("")).optional(),
  phone: z.string().optional(),
});

export type MemberSchema = z.infer<typeof memberSchema>;

export const subjectSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Subject name is required!" }),
  members: z.array(z.string()).optional(),
  

});

export type SubjectSchema = z.infer<typeof subjectSchema>;




/* ===================== EVENT ===================== */

export const eventSchema = z.object({
  id: z.coerce.number().optional(),

  title: z.string().min(1, { message: "Title is required!" }),

  description: z.string().optional(),

  date: z.coerce.date({ message: "Date is required!" }),

  startTime: z.coerce.date().optional(),

  endTime: z.coerce.date().optional(),

  isPublic: z.coerce.boolean(),

  societyId: z.coerce.number().optional(),
});

export type EventSchema = z.infer<typeof eventSchema>;


// ... seus outros schemas (memberSchema, eventSchema, etc) ...

// ============================================
// DOCUMENT SCHEMA
// ============================================
export const documentSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "O título é obrigatório!" }),
  description: z.string().optional(),

  // Relações (usamos z.coerce.number para transformar a string do <select> em número)
  // Se vier vazio, o optional() resolve.
  societyId: z.coerce.number().optional(),
  councilId: z.coerce.number().optional(),
  diaconateId: z.coerce.number().optional(),
  ministryId: z.coerce.number().optional(),
  bibleSchoolClassId: z.coerce.number().optional(),

  // IMPORTANTE: Deixamos o file como any() ou optional() aqui.
  // Motivo: O input file retorna um FileList no navegador, o que é chato de validar com Zod puro.
  // Nós já garantimos que o arquivo existe manualmente lá no `onSubmit` do formulário.
  file: z.any().optional(),
});

// 👇 AQUI ESTÁ A LINHA QUE FALTOU:
export type DocumentSchema = z.infer<typeof documentSchema>;
