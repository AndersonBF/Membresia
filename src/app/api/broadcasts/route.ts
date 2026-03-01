// app/api/broadcasts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

const societyMap: Record<string, number> = {
  saf: 3, uph: 4, ump: 5, upa: 6, ucp: 7,
};

export async function GET(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const roles = (user.publicMetadata?.roles as string[]) ?? [];
  const isSuperAdmin = roles.includes("superadmin");

  const { searchParams } = new URL(req.url);
  const societyId = searchParams.get("societyId");
  const exclusive = searchParams.get("exclusive") === "true";

  // IDs das sociedades que o usuário realmente pertence (sem superadmin override)
  const userSocietyIds: number[] = roles.flatMap((r) =>
    societyMap[r] ? [societyMap[r]] : []
  );

  // Filtro exclusivo: vê privadas só se pertence à sociedade (superadmin sem exceção)
  // Sem filtro exclusivo: superadmin vê tudo
  const canSeePrivate = (sid: number): boolean => {
    if (exclusive) return userSocietyIds.includes(sid);
    return isSuperAdmin || userSocietyIds.includes(sid);
  };

  let where: any = {};

  if (societyId && exclusive) {
    const sid = parseInt(societyId);
    where = canSeePrivate(sid)
      ? { societyId: sid }
      : { societyId: sid, isPublic: true };

  } else if (societyId) {
    const sid = parseInt(societyId);
    where = canSeePrivate(sid)
      ? { OR: [{ societyId: sid }, { isPublic: true }] }
      : { isPublic: true };

  } else {
    if (isSuperAdmin) {
      where = {};
    } else if (userSocietyIds.length > 0) {
      where = {
        OR: [
          { isPublic: true },
          { societyId: { in: userSocietyIds } },
        ],
      };
    } else {
      where = { isPublic: true };
    }
  }

  const broadcasts = await prisma.broadcast.findMany({
    where,
    include: {
      society: { select: { id: true, name: true } },
      reactions: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(broadcasts);
}

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const roles = (user.publicMetadata?.roles as string[]) ?? [];
  const isSuperAdmin = roles.includes("superadmin");

  const body = await req.json();
  const { title, message, isPublic, role } = body;

  if (!title || !message || !role) {
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
  }

  if (!isSuperAdmin && !roles.includes(role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const societyId = societyMap[role];
  if (!societyId) {
    return NextResponse.json({ error: "Sociedade não encontrada" }, { status: 400 });
  }

  const broadcast = await prisma.broadcast.create({
    data: {
      title,
      message,
      isPublic: isPublic ?? false,
      societyId,
      authorName: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
      authorRole: role,
    },
    include: {
      society: { select: { id: true, name: true } },
      reactions: true,
    },
  });

  return NextResponse.json(broadcast);
}