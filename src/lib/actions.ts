"use server";

import { revalidatePath } from "next/cache";
import prisma from "./prisma";
import {
  MemberSchema,
  EventSchema,
  AttendanceSchema,
  documentSchema,
  bibleSchoolClassSchema,
  BibleSchoolClassSchema,
  classTeacherSchema,
  ClassTeacherSchema,
  bibleSchoolAttendanceSchema,
  BibleSchoolAttendanceSchema,
} from "./formValidationSchemas";
import { getEbdAccess, canAccessClass } from "./ebdAccess";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

/** Normaliza "YYYY-MM-DD" para meia-noite UTC (chave estável de BibleSchoolLesson) */
const normalizeSunday = (dateStr: string) => new Date(`${dateStr.slice(0, 10)}T00:00:00.000Z`);

type CurrentState = {
  success: boolean;
  error: boolean;
};

const societyMap: Record<string, number> = {
  saf: 3, uph: 4, ump: 5, upa: 6, ucp: 7,
}

// ===================== MEMBERS =====================

export const createMember = async (
  _: CurrentState,
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
    console.error(err);
    return { success: false, error: true };
  }
};

export const updateMember = async (
  _: CurrentState,
  data: MemberSchema & { roles?: string[]; cargos?: Record<string, string> }
): Promise<CurrentState> => {
  if (!data.id) return { success: false, error: true };

  try {
    await prisma.member.update({
      where: { id: data.id },
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        gender: data.gender === "M" ? "MASCULINO" : data.gender === "F" ? "FEMININO" : undefined,
      },
    });

    if (data.roles !== undefined) {
      // Atualiza sociedades com cargo
      await prisma.memberSociety.deleteMany({ where: { memberId: data.id } })
      const societyRoles = data.roles.filter((r) => societyMap[r])
      for (const r of societyRoles) {
        await prisma.memberSociety.create({
          data: {
            memberId: data.id!,
            societyId: societyMap[r],
            cargo: data.cargos?.[r] ?? null,
          },
        })
      }

      // Atualiza conselho
      await prisma.memberCouncil.deleteMany({ where: { memberId: data.id } })
      if (data.roles.includes("conselho")) {
        await prisma.memberCouncil.create({
          data: { memberId: data.id, councilId: 1 }
        })
      }

      // Atualiza diaconia
      await prisma.memberDiaconate.deleteMany({ where: { memberId: data.id } })
      if (data.roles.includes("diaconia")) {
        await prisma.memberDiaconate.create({
          data: { memberId: data.id, diaconateId: 1 }
        })
      }

      // Atualiza ministério
      // Se "ministerio" foi DESMARCADO, remove todos os vínculos.
      // Se ainda está marcado, preserva os vínculos específicos existentes
      // (gerenciados pelo AddMemberToMinistryButton).
      if (!data.roles.includes("ministerio")) {
        await prisma.memberMinistry.deleteMany({ where: { memberId: data.id } })
      }

      // Atualiza roles no Clerk
      try {
        const { clerkClient } = await import('@clerk/nextjs/server')
        const client = await clerkClient()
        // O formulário nem sempre envia username — resolve pelo id como fallback
        const dbMember = await prisma.member.findUnique({
          where: { id: data.id },
          select: { username: true },
        })
        const uname = data.username ?? dbMember?.username ?? ""
        if (uname) {
          const clerkUsers = await client.users.getUserList({ username: [uname] })
          if (clerkUsers.data.length > 0) {
            // Preserva papéis administrativos que não são geridos por este formulário
            const existing = (clerkUsers.data[0].publicMetadata?.roles as string[]) ?? []
            const preserved = existing.filter((r) => r === "admin" || r === "superadmin")
            const clerkRoles = Array.from(new Set(["member", ...preserved, ...data.roles]))
            await client.users.updateUserMetadata(clerkUsers.data[0].id, {
              publicMetadata: { roles: clerkRoles }
            })
          }
        }
      } catch (e) {
        console.error("Erro ao atualizar Clerk:", e)
      }
    }

    revalidatePath("/list/members");
    return { success: true, error: false };
  } catch (err) {
    console.error(err);
    return { success: false, error: true };
  }
};

export const deleteMember = async (
  _: CurrentState,
  data: FormData
): Promise<CurrentState> => {
  try {
    const id = Number(data.get("id"));
    await prisma.member.delete({ where: { id } });

    revalidatePath("/list/members");
    return { success: true, error: false };
  } catch (err) {
    console.error(err);
    return { success: false, error: true };
  }
};

// ===================== EVENTS =====================

export const createEvent = async (
  _: CurrentState,
  data: EventSchema
): Promise<CurrentState> => {
  try {
    await prisma.event.create({
      data: {
        title: data.title,
        description: data.description || null,
        date: data.date,
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        isPublic: data.isPublic,
        // Um evento pertence a uma sociedade OU a um grupo (category), nunca aos dois.
        societyId: data.category ? null : (data.societyId || null),
        category: data.category || null,
      },
    });

    revalidatePath("/list/events");
    return { success: true, error: false };
  } catch (err) {
    console.error(err);
    return { success: false, error: true };
  }
};

export const updateEvent = async (
  _: CurrentState,
  data: EventSchema
): Promise<CurrentState> => {
  if (!data.id) return { success: false, error: true };

  try {
    await prisma.event.update({
      where: { id: data.id },
      data: {
        title: data.title,
        description: data.description || null,
        date: data.date,
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        isPublic: data.isPublic,
        societyId: data.category ? null : (data.societyId || null),
        category: data.category || null,
      },
    });

    revalidatePath("/list/events");
    return { success: true, error: false };
  } catch (err) {
    console.error(err);
    return { success: false, error: true };
  }
};

export const deleteEvent = async (
  _: CurrentState,
  data: FormData
): Promise<CurrentState> => {
  try {
    const id = Number(data.get("id"));
    await prisma.event.delete({ where: { id } });

    revalidatePath("/list/events");
    return { success: true, error: false };
  } catch (err) {
    console.error(err);
    return { success: false, error: true };
  }
};

// ===================== DOCUMENTS =====================

export const createDocument = async (
  _: CurrentState,
  data: FormData
): Promise<CurrentState> => {
  const parsed = documentSchema.safeParse(Object.fromEntries(data));
  if (!parsed.success) return { success: false, error: true };

  const file = data.get("file") as File;
  if (!file || file.size === 0) return { success: false, error: true };

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;

    const uploadDir = path.join(process.cwd(), "public/uploads");
    await mkdir(uploadDir, { recursive: true });

    await writeFile(path.join(uploadDir, fileName), buffer);

    await prisma.document.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        fileUrl: `/uploads/${fileName}`,
        societyId: parsed.data.societyId || null,
        councilId: parsed.data.councilId || null,
        diaconateId: parsed.data.diaconateId || null,
        ministryId: parsed.data.ministryId || null,
        bibleSchoolClassId: parsed.data.bibleSchoolClassId || null,
        bibleSchoolGeneral: parsed.data.bibleSchoolGeneral || false,
      },
    });

    revalidatePath("/list/documents");
    return { success: true, error: false };
  } catch (err) {
    console.error(err);
    return { success: false, error: true };
  }
};

export const deleteDocument = async (
  _: CurrentState,
  data: FormData
): Promise<CurrentState> => {
  try {
    const id = Number(data.get("id"));
    await prisma.document.delete({ where: { id } });

    revalidatePath("/list/documents");
    return { success: true, error: false };
  } catch (err) {
    console.error(err);
    return { success: false, error: true };
  }
};

// ===================== ATTENDANCE =====================

export const createAttendance = async (
  _: CurrentState,
  data: AttendanceSchema
): Promise<CurrentState> => {
  try {
    await prisma.attendance.create({
      data: {
        eventId: data.eventId,
        memberId: data.memberId,
        isPresent: data.isPresent,
      },
    });

    revalidatePath("/list/attendance");
    return { success: true, error: false };
  } catch (err) {
    console.error(err);
    return { success: false, error: true };
  }
};

export const updateAttendance = async (
  _: CurrentState,
  data: AttendanceSchema
): Promise<CurrentState> => {
  if (!data.id) return { success: false, error: true };

  try {
    await prisma.attendance.update({
      where: { id: data.id },
      data: { isPresent: data.isPresent },
    });

    revalidatePath("/list/attendance");
    return { success: true, error: false };
  } catch (err) {
    console.error(err);
    return { success: false, error: true };
  }
};

export const deleteAttendance = async (
  _: CurrentState,
  data: FormData
): Promise<CurrentState> => {
  try {
    const id = Number(data.get("id"));
    await prisma.attendance.delete({ where: { id } });

    revalidatePath("/list/attendance");
    return { success: true, error: false };
  } catch (err) {
    console.error(err);
    return { success: false, error: true };
  }
};

// ===================== BULK ATTENDANCE =====================

export const bulkUpdateAttendance = async (
  _: CurrentState,
  data: FormData
): Promise<CurrentState> => {
  try {
    const eventId = Number(data.get("eventId"));
    const attendanceData: {
      memberId: number;
      isPresent: boolean;
    }[] = JSON.parse(data.get("attendanceData") as string);

    await prisma.attendance.deleteMany({ where: { eventId } });

    await prisma.attendance.createMany({
      data: attendanceData.map((item) => ({
        eventId,
        memberId: item.memberId,
        isPresent: item.isPresent,
      })),
    });

    revalidatePath("/list/attendance");
    return { success: true, error: false };
  } catch (err) {
    console.error("Erro no bulkUpdateAttendance:", err);
    return { success: false, error: true };
  }
};

// ===================== FINANCE =====================

export const createFinance = async (
  _: CurrentState,
  data: FormData
): Promise<CurrentState> => {
  try {
    const description = data.get("description") as string;
    const type = data.get("type") as "ENTRADA" | "SAIDA";
    const value = parseFloat(data.get("value") as string);
    const date = new Date(data.get("date") as string);
    const societyId = data.get("societyId") ? Number(data.get("societyId")) : null;
    const councilId = data.get("councilId") ? Number(data.get("councilId")) : null;
    const roleContext = data.get("roleContext") as string | null;

    await prisma.finance.create({
      data: {
        description,
        type,
        value,
        date,
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        societyId,
        councilId,
      },
    });

    const path = roleContext
      ? `/list/finance?societyId=${societyId}&roleContext=${roleContext}`
      : "/list/finance";

    revalidatePath(path);
    revalidatePath("/list/finance");
    return { success: true, error: false };
  } catch (err) {
    console.error(err);
    return { success: false, error: true };
  }
};

export const deleteFinance = async (
  _: CurrentState,
  data: FormData
): Promise<CurrentState> => {
  try {
    const id = Number(data.get("id"));
    const roleContext = data.get("roleContext") as string | null;
    const societyId = data.get("societyId") as string | null;

    await prisma.finance.delete({ where: { id } });

    revalidatePath("/list/finance");
    if (roleContext && societyId) {
      revalidatePath(`/list/finance?societyId=${societyId}&roleContext=${roleContext}`);
    }

    return { success: true, error: false };
  } catch (err) {
    console.error(err);
    return { success: false, error: true };
  }
};

export const updateFinance = async (
  _: CurrentState,
  data: FormData
): Promise<CurrentState> => {
  try {
    const id = Number(data.get("id"));
    const description = data.get("description") as string;
    const type = data.get("type") as "ENTRADA" | "SAIDA";
    const value = parseFloat(data.get("value") as string);
    const date = new Date(data.get("date") as string);
    const roleContext = data.get("roleContext") as string | null;
    const societyId = data.get("societyId") ? Number(data.get("societyId")) : null;

    await prisma.finance.update({
      where: { id },
      data: {
        description,
        type,
        value,
        date,
        month: date.getMonth() + 1,
        year: date.getFullYear(),
      },
    });

    revalidatePath("/list/finance");
    if (roleContext && societyId) {
      revalidatePath(`/list/finance?societyId=${societyId}&roleContext=${roleContext}`);
    }

    return { success: true, error: false };
  } catch (err) {
    console.error(err);
    return { success: false, error: true };
  }
};

// ===================== EBD — TURMAS =====================

export const createBibleSchoolClass = async (
  _: CurrentState,
  data: BibleSchoolClassSchema
): Promise<CurrentState> => {
  const parsed = bibleSchoolClassSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: true };

  const access = await getEbdAccess();
  if (!access.canSeeAll) return { success: false, error: true };

  try {
    // Garante o registro raiz BibleSchool (id=1) antes de ligar a turma
    await prisma.bibleSchool.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1 },
    });

    await prisma.bibleSchoolClass.create({
      data: { name: parsed.data.name, bibleSchoolId: 1 },
    });

    revalidatePath("/ebd");
    revalidatePath("/ebd/turmas");
    return { success: true, error: false };
  } catch (err) {
    console.error(err);
    return { success: false, error: true };
  }
};

export const updateBibleSchoolClass = async (
  _: CurrentState,
  data: BibleSchoolClassSchema
): Promise<CurrentState> => {
  const parsed = bibleSchoolClassSchema.safeParse(data);
  if (!parsed.success || !parsed.data.id) return { success: false, error: true };

  const access = await getEbdAccess();
  if (!access.canSeeAll) return { success: false, error: true };

  try {
    await prisma.bibleSchoolClass.update({
      where: { id: parsed.data.id },
      data: { name: parsed.data.name },
    });

    revalidatePath("/ebd");
    revalidatePath("/ebd/turmas");
    revalidatePath(`/ebd/turma/${parsed.data.id}`);
    return { success: true, error: false };
  } catch (err) {
    console.error(err);
    return { success: false, error: true };
  }
};

export const deleteBibleSchoolClass = async (
  _: CurrentState,
  data: FormData
): Promise<CurrentState> => {
  const access = await getEbdAccess();
  if (!access.canSeeAll) return { success: false, error: true };

  try {
    const id = Number(data.get("id"));
    await prisma.bibleSchoolClass.delete({ where: { id } });

    revalidatePath("/ebd");
    revalidatePath("/ebd/turmas");
    return { success: true, error: false };
  } catch (err) {
    console.error(err);
    return { success: false, error: true };
  }
};

// ===================== EBD — PROFESSORAS (ClassTeacher) =====================

export const assignClassTeacher = async (
  _: CurrentState,
  data: ClassTeacherSchema
): Promise<CurrentState> => {
  const parsed = classTeacherSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: true };

  const access = await getEbdAccess();
  if (!access.canSeeAll) return { success: false, error: true };

  try {
    await prisma.classTeacher.upsert({
      where: {
        memberId_classId: {
          memberId: parsed.data.memberId,
          classId: parsed.data.classId,
        },
      },
      update: {},
      create: { memberId: parsed.data.memberId, classId: parsed.data.classId },
    });

    revalidatePath("/ebd/turmas");
    revalidatePath(`/ebd/turma/${parsed.data.classId}`);
    return { success: true, error: false };
  } catch (err) {
    console.error(err);
    return { success: false, error: true };
  }
};

export const removeClassTeacher = async (
  _: CurrentState,
  data: FormData
): Promise<CurrentState> => {
  const access = await getEbdAccess();
  if (!access.canSeeAll) return { success: false, error: true };

  try {
    const classId = Number(data.get("classId"));
    const memberId = Number(data.get("memberId"));
    await prisma.classTeacher.deleteMany({ where: { classId, memberId } });

    revalidatePath("/ebd/turmas");
    revalidatePath(`/ebd/turma/${classId}`);
    return { success: true, error: false };
  } catch (err) {
    console.error(err);
    return { success: false, error: true };
  }
};

// ===================== EBD — CHAMADA POR TURMA =====================

export const saveBibleSchoolAttendance = async (
  _: CurrentState,
  data: BibleSchoolAttendanceSchema
): Promise<CurrentState> => {
  const parsed = bibleSchoolAttendanceSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: true };

  // Professora só grava na própria turma; superintendente/admin em qualquer uma
  const access = await getEbdAccess();
  if (!canAccessClass(access, parsed.data.classId)) {
    return { success: false, error: true };
  }

  try {
    const date = normalizeSunday(parsed.data.date);

    // Cria/atualiza a aula (BibleSchoolLesson) desse domingo para a turma
    const lesson = await prisma.bibleSchoolLesson.upsert({
      where: { classId_date: { classId: parsed.data.classId, date } },
      update: { topic: parsed.data.topic || null },
      create: {
        classId: parsed.data.classId,
        date,
        topic: parsed.data.topic || null,
      },
    });

    // Salva a presença de cada membro (upsert idempotente)
    await Promise.all(
      parsed.data.records.map((r) =>
        prisma.bibleSchoolAttendance.upsert({
          where: {
            lessonId_memberId: { lessonId: lesson.id, memberId: r.memberId },
          },
          update: { isPresent: r.isPresent },
          create: {
            lessonId: lesson.id,
            memberId: r.memberId,
            isPresent: r.isPresent,
          },
        })
      )
    );

    revalidatePath(`/ebd/turma/${parsed.data.classId}`);
    revalidatePath(`/ebd/turma/${parsed.data.classId}/chamada`);
    return { success: true, error: false };
  } catch (err) {
    console.error(err);
    return { success: false, error: true };
  }
};