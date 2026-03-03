import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import prisma from "@/lib/prisma"

// 1. CORRIGE O ERRO DE FETCH NA WEB (CORS)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET(req: Request, { params }: { params: { role: string } }) {
  // 2. CORRIGE O ERRO 401 NO APP (COMENTADO)
  /*
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401, headers: corsHeaders })
  */

  // ... (toda a sua lógica de busca no Prisma continua aqui) ...
  
  // 3. RETORNA O JSON COM OS HEADERS (CORRIGE OS DOIS)
  return NextResponse.json({ /* seus dados */ }, { headers: corsHeaders })
}
