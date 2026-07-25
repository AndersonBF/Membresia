import {z} from "zod";



export const memberSchema = z.object({
  id: z.coerce.number().optional(),

  name: z
    .string()
    .min(1, { message: "Nome é obrigatório!" }),

  username: z
    .string()
    .min(3, { message: "Usuário deve ter no mínimo 3 caracteres!" })
    .optional(),

  password: z
    .string()
    .min(6, { message: "Senha deve ter no mínimo 6 caracteres!" })
    .optional(),

  email: z
    .string()
    .email({ message: "Email inválido!" })
    .or(z.literal(""))
    .optional(),

  phone: z.string().optional(),

  birthDate: z.string().optional(),

  gender: z.enum(["M", "F"], {
    message: "Gênero é obrigatório!",
  }),

  isActive: z.coerce.boolean().default(true),
});

export type MemberSchema = z.infer<typeof memberSchema>;


export const subjectSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Subject name is required!" }),
  members: z.array(z.string()).optional(),
  

});

export type SubjectSchema = z.infer<typeof subjectSchema>;




/* ===================== EVENT ===================== */

// O <input type="datetime-local"> devolve a hora "de parede" sem fuso
// ("2026-02-02T18:00"). Se deixarmos o z.coerce.date() rodar, o navegador (fuso
// de SP) interpreta como local e salva 21:00Z — errado. Aqui interpretamos a
// hora de parede como UTC (convenção do projeto: event.startTime/endTime em UTC),
// então 18:00 vira 18:00Z e as telas (que formatam em UTC) mostram 18:00.
const wallClockUtc = z.preprocess((v) => {
  if (typeof v === "string") {
    if (v.trim() === "") return undefined
    const m = v.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(:\d{2})?$/)
    if (m) return new Date(`${m[1]}T${m[2]}${m[3] ?? ":00"}Z`)
  }
  return v
}, z.date().optional())

export const eventSchema = z.object({
  id: z.coerce.number().optional(),

  title: z.string().min(1, { message: "Title is required!" }),

  description: z.string().optional(),

  date: z.coerce.date({ message: "Date is required!" }),

  startTime: wallClockUtc,

  endTime: wallClockUtc,

  isPublic: z.coerce.boolean(),

  societyId: z.coerce.number().optional(),

  // Grupo sem InternalSociety (ex.: "ebd"). Vazio => evento de sociedade/geral.
  category: z.string().optional(),
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
  // Documento "EBD geral" (todas as turmas)
  bibleSchoolGeneral: z.coerce.boolean().optional(),


  file: z.any().optional(),
});

export type DocumentSchema = z.infer<typeof documentSchema>;

export const attendanceSchema = z.object({
  id: z.coerce.number().optional(),
  eventId: z.coerce.number({ message: "Event is required!" }),
  memberId: z.coerce.number({ message: "Member is required!" }),
  isPresent: z.boolean(),
});

export type AttendanceSchema = z.infer<typeof attendanceSchema>;

/* ===================== EBD — TURMAS / CHAMADA ===================== */

export const bibleSchoolClassSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "O nome da turma é obrigatório!" }),
});

export type BibleSchoolClassSchema = z.infer<typeof bibleSchoolClassSchema>;

export const classTeacherSchema = z.object({
  classId: z.coerce.number({ message: "Turma é obrigatória!" }),
  memberId: z.coerce.number({ message: "Membro é obrigatório!" }),
});

export type ClassTeacherSchema = z.infer<typeof classTeacherSchema>;

export const bibleSchoolAttendanceSchema = z.object({
  classId: z.coerce.number({ message: "Turma é obrigatória!" }),
  // Data do domingo no formato "YYYY-MM-DD"
  date: z.string().min(1, { message: "Data é obrigatória!" }),
  topic: z.string().optional(),
  records: z.array(
    z.object({
      memberId: z.coerce.number(),
      isPresent: z.coerce.boolean(),
    })
  ),
});

export type BibleSchoolAttendanceSchema = z.infer<typeof bibleSchoolAttendanceSchema>;
