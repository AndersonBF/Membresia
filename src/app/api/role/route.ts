// src/app/api/role/route.ts
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export async function GET() {
  const { sessionClaims } = await auth()
  const roles = (sessionClaims?.metadata as { roles?: string[] })?.roles ?? []
  const isAdmin = roles.includes("admin") || roles.includes("superadmin")
  return NextResponse.json({ roles, isAdmin })
}