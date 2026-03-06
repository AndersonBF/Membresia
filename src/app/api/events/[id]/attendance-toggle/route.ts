// src/app/api/events/[id]/attendance-toggle/route.ts
import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { sessionClaims } = await auth()
  const roles = (sessionClaims?.metadata as { roles?: string[] })?.roles ?? []
  const isAdmin = roles.includes("admin") || roles.includes("superadmin")

  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const id = parseInt(params.id)
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const event = await prisma.event.findUnique({ where: { id }, select: { requiresAttendance: true } })
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 })
  }

  const updated = await prisma.event.update({
    where: { id },
    data: { requiresAttendance: !event.requiresAttendance },
    select: { id: true, requiresAttendance: true },
  })

  return NextResponse.json(updated)
}