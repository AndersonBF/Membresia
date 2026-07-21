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
import { getManageableGroups, roleForSocietyId } from "./permissions";
import { currentUser } from "@clerk/nextjs/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// societyId → role key (inverso do societyMap), usado para saber a que grupos
// um membro pertence.
const societyIdToRole: Record<number, string> = {
  3: "saf", 4: "uph", 5: "ump", 6: "upa", 7: "ucp",
}

/** Grupos (roles) a que um membro pertence, a partir das suas relações. */
async function getMemberGroups(memberId: number): Promise<Set<string>> {
  const m = await prisma.member.findUnique({
    where: { id: memberId },
    select: {
      societies: { select: { societyId: true } },
      council: { select: { id: true } },
      diaconate: { select: { id: true } },
      ministries: { select: { id: true } },
      bibleSchoolClassId: true,
    },
  })
  const g = new Set<string>()
  m?.societies.forEach((s) => { if (societyIdToRole[s.societyId]) g.add(societyIdToRole[s.societyId]) })
  if (m?.council) g.add("conselho")
  if (m?.diaconate) g.add("diaconia")
  if (m?.ministries.length) g.add("ministerio")
  if (m?.bibleSchoolClassId) g.add("ebd")
  return g
}

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
    // Permissões: admin/superadmin editam qualquer membro e seus papéis.
    // Líder (com cargo) edita apenas o perfil básico de membros do seu grupo,
    // sem alterar papéis/cargos (evita escalonamento de privilégio).
    const { isAdmin, groups } = await getManageableGroups()
    if (!isAdmin && groups.size === 0) return { success: false, error: true }

    let allowRoleChanges = isAdmin
    if (!isAdmin) {
      const targetGroups = await getMemberGroups(data.id)
      const shares = [...targetGroups].some((g) => groups.has(g))
      if (!shares) return { success: false, error: true }
      allowRoleChanges = false
    }

    await prisma.member.update({
      where: { id: data.id },
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        gender: data.gender === "M" ? "MASCULINO" : data.gender === "F" ? "FEMININO" : undefined,
      },
    });

    if (allowRoleChanges && data.roles !== undefined) {
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
          data: { memberId: data.id, councilId: 1, cargo: data.cargos?.["conselho"] ?? null }
        })
      }

      // Atualiza diaconia
      await prisma.memberDiaconate.deleteMany({ where: { memberId: data.id } })
      if (data.roles.includes("diaconia")) {
        await prisma.memberDiaconate.create({
          data: { memberId: data.id, diaconateId: 1, cargo: data.cargos?.["diaconia"] ?? null }
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
            // Só admin/superadmin real podem conceder/remover a função Pastor.
            const actorRoles = ((await currentUser())?.publicMetadata?.roles as string[]) ?? []
            const isRealAdmin = actorRoles.includes("admin") || actorRoles.includes("superadmin")

            // Papéis recebidos do formulário — descarta "pastor" se o ator não for admin real.
            const incomingRoles = isRealAdmin
              ? data.roles
              : data.roles.filter((r) => r !== "pastor")

            // Preserva papéis administrativos que não são geridos por este formulário.
            // "pastor" no alvo só é preservado quando o ator não pode geri-lo (evita remoção indevida).
            const existing = (clerkUsers.data[0].publicMetadata?.roles as string[]) ?? []
            const preserved = existing.filter(
              (r) => r === "admin" || r === "superadmin" || (!isRealAdmin && r === "pastor")
            )
            const clerkRoles = Array.from(new Set(["member", ...preserved, ...incomingRoles]))
            // Preserva a igreja (tenant) já amarrada ao usuário.
            const existingChurch = (clerkUsers.data[0].publicMetadata as { church?: string })?.church
            await client.users.updateUserMetadata(clerkUsers.data[0].id, {
              publicMetadata: { roles: clerkRoles, ...(existingChurch ? { church: existingChurch } : {}) }
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

    // Permissões: admin/superadmin removem qualquer membro. Um líder (com cargo)
    // só pode remover um membro cujos grupos estejam TODOS dentro dos grupos que
    // ele gere — evita apagar cadastros de outros grupos.
    const { isAdmin, groups } = await getManageableGroups()
    if (!isAdmin) {
      if (groups.size === 0) return { success: false, error: true }
      const targetGroups = await getMemberGroups(id)
      if (targetGroups.size === 0) return { success: false, error: true }
      const withinScope = [...targetGroups].every((g) => groups.has(g))
      if (!withinScope) return { success: false, error: true }
    }

    await prisma.member.delete({ where: { id } });

    revalidatePath("/list/members");
    return { success: true, error: false };
  } catch (err) {
    console.error(err);
    return { success: false, error: true };
  }
};

// ===================== EVENTS =====================

/** Role de grupo a que um evento pertence (society → role, ou category). */
function eventGroupRole(societyId?: number | null, category?: string | null): string | null {
  if (category) return category
  if (societyId) return roleForSocietyId(societyId)
  return null
}

/** Admin, ou líder (com cargo) do grupo do evento. */
async function canManageEventGroup(societyId?: number | null, category?: string | null): Promise<boolean> {
  const { isAdmin, groups } = await getManageableGroups()
  if (isAdmin) return true
  const role = eventGroupRole(societyId, category)
  return !!role && groups.has(role)
}

export const createEvent = async (
  _: CurrentState,
  data: EventSchema
): Promise<CurrentState> => {
  try {
    // Admin cria qualquer evento; líder só cria eventos do seu grupo.
    const target = data.category ? null : (data.societyId || null)
    if (!(await canManageEventGroup(target, data.category || null))) {
      return { success: false, error: true }
    }

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
    // Precisa poder gerir tanto o grupo atual do evento quanto o destino.
    const existing = await prisma.event.findUnique({
      where: { id: data.id },
      select: { societyId: true, category: true },
    })
    if (!existing) return { success: false, error: true }
    const newTarget = data.category ? null : (data.societyId || null)
    const canOld = await canManageEventGroup(existing.societyId, existing.category)
    const canNew = await canManageEventGroup(newTarget, data.category || null)
    if (!canOld || !canNew) return { success: false, error: true }

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

    const existing = await prisma.event.findUnique({
      where: { id },
      select: { societyId: true, category: true },
    })
    if (!existing) return { success: false, error: true }
    if (!(await canManageEventGroup(existing.societyId, existing.category))) {
      return { success: false, error: true }
    }

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

/** Admin, ou líder (com cargo) da sociedade/conselho do lançamento. */
async function canManageFinanceScope(societyId?: number | null, councilId?: number | null): Promise<boolean> {
  const { isAdmin, groups } = await getManageableGroups()
  if (isAdmin) return true
  const role = societyId ? roleForSocietyId(societyId) : (councilId ? "conselho" : null)
  return !!role && groups.has(role)
}

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

    // Só admin ou líder da sociedade/conselho pode lançar
    if (!(await canManageFinanceScope(societyId, councilId))) {
      return { success: false, error: true }
    }

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

    // Verifica o escopo real do lançamento antes de excluir
    const existing = await prisma.finance.findUnique({
      where: { id },
      select: { societyId: true, councilId: true },
    })
    if (!existing) return { success: false, error: true }
    if (!(await canManageFinanceScope(existing.societyId, existing.councilId))) {
      return { success: false, error: true }
    }

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

    // Verifica o escopo real do lançamento antes de atualizar
    const existing = await prisma.finance.findUnique({
      where: { id },
      select: { societyId: true, councilId: true },
    })
    if (!existing) return { success: false, error: true }
    if (!(await canManageFinanceScope(existing.societyId, existing.councilId))) {
      return { success: false, error: true }
    }

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