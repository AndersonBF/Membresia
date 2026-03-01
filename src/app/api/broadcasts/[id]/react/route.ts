// app/api/broadcasts/[id]/react/route.ts
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const broadcastId = parseInt(params.id);
  const { emoji } = await req.json();

  if (!emoji) return NextResponse.json({ error: "Emoji obrigatório" }, { status: 400 });

  // Toggle: se já reagiu com esse emoji, remove; senão, adiciona
  const existing = await prisma.broadcastReaction.findUnique({
    where: { broadcastId_userId_emoji: { broadcastId, userId: user.id, emoji } },
  });

  if (existing) {
    await prisma.broadcastReaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.broadcastReaction.create({
      data: {
        broadcastId,
        userId: user.id,
        userName: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
        emoji,
      },
    });
  }

  // Retorna reactions atualizadas
  const reactions = await prisma.broadcastReaction.findMany({
    where: { broadcastId },
  });

  return NextResponse.json(reactions);
}