import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {

    // Limpa todos os dados antes de popular
  await prisma.attendance.deleteMany();
  await prisma.classTeacher.deleteMany();
  await prisma.memberMinistry.deleteMany();
  await prisma.memberSociety.deleteMany();
  await prisma.memberCouncil.deleteMany();
  await prisma.memberDiaconate.deleteMany();
  await prisma.notice.deleteMany();
  await prisma.finance.deleteMany();
  await prisma.event.deleteMany();
  await prisma.member.deleteMany();
  await prisma.ministry.deleteMany();
  await prisma.internalSociety.deleteMany();
  await prisma.bibleSchoolClass.deleteMany();
  await prisma.bibleSchool.deleteMany();
  await prisma.council.deleteMany();
  await prisma.diaconate.deleteMany();

  console.log("🗑️ Banco limpo!");
  // ===============================================
  // MEMBROS
  // ===============================================
  const anderson = await prisma.member.create({
    data: {
      name: "Anderson Brito",
      email: "anderson@igreja.com",
      username: "anderson",
      phone: "11999999999",
      isActive: true,
    },
  });

  const maria = await prisma.member.create({
    data: {
      name: "Maria Silva",
      email: "maria@igreja.com",
      username: "maria",
      phone: "11888888888",
      isActive: true,
    },
  });

  const joao = await prisma.member.create({
    data: {
      name: "João Oliveira",
      email: "joao@igreja.com",
      username: "joao",
      phone: "11777777777",
      isActive: true,
    },
  });

  const ana = await prisma.member.create({
    data: {
      name: "Ana Costa",
      email: "ana@igreja.com",
      username: "ana",
      phone: "11666666666",
      isActive: true,
    },
  });

  const paulo = await prisma.member.create({
    data: {
      name: "Paulo Santos",
      email: "paulo@igreja.com",
      username: "paulo",
      phone: "11555555555",
      isActive: true,
    },
  });

  // ===============================================
  // MINISTÉRIOS
  // ===============================================
  const ministerioLouvore = await prisma.ministry.create({
    data: { name: "Ministério de Louvor" },
  });

  const ministerioEvangelismo = await prisma.ministry.create({
    data: { name: "Ministério de Evangelismo" },
  });

  // Associa membros aos ministérios
  await prisma.memberMinistry.createMany({
    data: [
      { memberId: anderson.id, ministryId: ministerioLouvore.id },
      { memberId: maria.id, ministryId: ministerioLouvore.id },
      { memberId: joao.id, ministryId: ministerioEvangelismo.id },
      { memberId: ana.id, ministryId: ministerioEvangelismo.id },
    ],
  });

  // ===============================================
  // SOCIEDADES INTERNAS
  // ===============================================
  const sociedadeMulheres = await prisma.internalSociety.create({
    data: { name: "Sociedade de Mulheres" },
  });

  const sociedadeHomens = await prisma.internalSociety.create({
    data: { name: "Sociedade de Homens" },
  });

  // Associa membros às sociedades
  await prisma.memberSociety.createMany({
    data: [
      { memberId: maria.id, societyId: sociedadeMulheres.id },
      { memberId: ana.id, societyId: sociedadeMulheres.id },
      { memberId: anderson.id, societyId: sociedadeHomens.id },
      { memberId: joao.id, societyId: sociedadeHomens.id },
      { memberId: paulo.id, societyId: sociedadeHomens.id },
    ],
  });

  // ===============================================
  // CONSELHO & DIACONIA
  // ===============================================
  const conselho = await prisma.council.create({
    data: { id: 1 },
  });

  const diaconia = await prisma.diaconate.create({
    data: { id: 1 },
  });

  // Anderson no Conselho, Paulo na Diaconia
  await prisma.memberCouncil.create({
    data: { memberId: anderson.id, councilId: conselho.id },
  });

  await prisma.memberDiaconate.create({
    data: { memberId: paulo.id, diaconateId: diaconia.id },
  });

  // ===============================================
  // ESCOLA BÍBLICA
  // ===============================================
  const bibleSchool = await prisma.bibleSchool.create({
    data: { id: 1 },
  });

  const classAduetos = await prisma.bibleSchoolClass.create({
    data: {
      name: "Classe de Adultos",
      bibleSchoolId: bibleSchool.id,
    },
  });

  const classJovens = await prisma.bibleSchoolClass.create({
    data: {
      name: "Classe de Jovens",
      bibleSchoolId: bibleSchool.id,
    },
  });

  // Associa membros às classes (via campo direto no Member)
  await prisma.member.update({
    where: { id: anderson.id },
    data: { bibleSchoolClassId: classAduetos.id },
  });

  await prisma.member.update({
    where: { id: maria.id },
    data: { bibleSchoolClassId: classAduetos.id },
  });

  await prisma.member.update({
    where: { id: joao.id },
    data: { bibleSchoolClassId: classJovens.id },
  });

  // Anderson como professor da classe de adultos
  await prisma.classTeacher.create({
    data: { memberId: anderson.id, classId: classAduetos.id },
  });

  // EVENTOS
// ===============================================
const evento1 = await prisma.event.create({
  data: {
    title: "Culto Dominical",
    description: "Culto de adoração semanal",
    date: new Date("2026-02-02T13:00:00.000Z"), // UTC explícito
    startTime: new Date("2026-02-02T13:00:00.000Z"),
    endTime: new Date("2026-02-02T15:00:00.000Z"),
    isPublic: true,
  },
});

const evento2 = await prisma.event.create({
  data: {
    title: "Noite de Evangelismo",
    description: "Evangelismo nas ruas",
    date: new Date("2026-02-05T21:00:00.000Z"),
    startTime: new Date("2026-02-05T21:00:00.000Z"),
    endTime: new Date("2026-02-06T00:00:00.000Z"),
    isPublic: false,
    societyId: sociedadeHomens.id,
  },
});
  // ===============================================
  // PRESENÇAS
  // ===============================================
  await prisma.attendance.createMany({
    data: [
      { memberId: anderson.id, eventId: evento1.id, isPresent: true },
      { memberId: maria.id, eventId: evento1.id, isPresent: true },
      { memberId: joao.id, eventId: evento1.id, isPresent: false },
      { memberId: anderson.id, eventId: evento2.id, isPresent: true },
      { memberId: paulo.id, eventId: evento2.id, isPresent: true },
    ],
  });

  // ===============================================
  // AVISOS
  // ===============================================
  await prisma.notice.create({
    data: {
      title: "Bem-vindos ao sistema!",
      message: "O sistema de gestão da congregação está ativo. Fique atento aos avisos.",
    },
  });

  // ===============================================
  // FINANCEIRO
  // ===============================================
  await prisma.finance.create({
    data: {
      month: 1,
      year: 2025,
      value: 5000.0,
      councilId: conselho.id,
    },
  });

  await prisma.finance.create({
    data: {
      month: 1,
      year: 2025,
      value: 1200.0,
      societyId: sociedadeMulheres.id,
    },
  });

  await prisma.finance.create({
    data: {
      month: 1,
      year: 2025,
      value: 800.0,
      societyId: sociedadeHomens.id,
    },
  });

  console.log("✅ Seed concluído com sucesso!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });