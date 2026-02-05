export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import ExcelJS from "exceljs";

export async function GET() {
  try {
    const members = await prisma.member.findMany();

    console.log("Membros encontrados:", members.length);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Membros");

    worksheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Nome", key: "name", width: 30 },
      { header: "Email", key: "email", width: 30 },
      { header: "Telefone", key: "phone", width: 20 },
      { header: "Criado em", key: "createdAt", width: 20 },
    ];

    members.forEach((member) => {
      worksheet.addRow({
        id: member.id,
        name: member.name,
        email: member.email ?? "",
        phone: member.phone ?? "",
        createdAt: member.createdAt
          ? member.createdAt.toISOString()
          : "",
      });
    });

    // 🔴 PONTO CRÍTICO: converter corretamente
    const arrayBuffer = await workbook.xlsx.writeBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="membros.xlsx"',
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Erro ao exportar membros:", error);
    return NextResponse.json(
      { error: "Erro ao gerar Excel" },
      { status: 500 }
    );
  }
}
