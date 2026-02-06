"use server";

import { revalidatePath } from "next/cache";
import prisma from "./prisma";
import {
  MemberSchema,
  EventSchema,
  AttendanceSchema,
  documentSchema,
} from "./formValidationSchemas";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

type CurrentState = {
  success: boolean;
  error: boolean;
};

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
  data: MemberSchema
): Promise<CurrentState> => {
  if (!data.id) return { success: false, error: true };

  try {
    await prisma.member.update({
      where: { id: data.id },
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
        societyId: data.societyId || null,
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
        societyId: data.societyId || null,
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

    // Apaga tudo do evento
    await prisma.attendance.deleteMany({
      where: { eventId },
    });

    // Cria novamente
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
