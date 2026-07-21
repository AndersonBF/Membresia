/**
 * SEED DE DEMONSTRAÇÃO — popula um banco FICTÍCIO para o subdomínio de demo (igreja.*).
 *
 * ⚠️  SEGURANÇA (ver memória `membresia-db-safety`):
 *  - Este script é DESTRUTIVO (limpa e repopula).
 *  - Ele SÓ roda contra `DEMO_DATABASE_URL` — nunca contra o `DATABASE_URL` de produção.
 *
 * Como rodar (no banco de demonstração):
 *   DEMO_DATABASE_URL="postgresql://...banco-demo..." npx tsx prisma/seed-demo.ts
 */
import "dotenv/config"
import { PrismaClient, Gender, FinanceType } from "@prisma/client"

const DEMO_URL = process.env.DEMO_DATABASE_URL
const PROD_URL = process.env.DATABASE_URL

if (!DEMO_URL) {
  console.error("❌ DEMO_DATABASE_URL não definido. Abortando (o seed de demo NUNCA roda em produção).")
  process.exit(1)
}
if (PROD_URL && DEMO_URL === PROD_URL) {
  console.error("❌ DEMO_DATABASE_URL é igual ao DATABASE_URL de produção. Abortando por segurança.")
  process.exit(1)
}

const prisma = new PrismaClient({ datasources: { db: { url: DEMO_URL } } })

// Sociedades com IDs fixos (o app mapeia por eles): saf=3, uph=4, ump=5, upa=6, ucp=7
const SOC = { saf: 3, uph: 4, ump: 5, upa: 6, ucp: 7 }

function d(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
}

async function main() {
  console.log("🌱 Seed DEMO no banco:", DEMO_URL!.replace(/:\/\/[^@]*@/, "://***@"))

  // ── Limpeza ──
  await prisma.attendance.deleteMany()
  await prisma.bibleSchoolAttendance.deleteMany()
  await prisma.bibleSchoolLesson.deleteMany()
  await prisma.classTeacher.deleteMany()
  await prisma.memberMinistry.deleteMany()
  await prisma.memberSociety.deleteMany()
  await prisma.memberCouncil.deleteMany()
  await prisma.memberDiaconate.deleteMany()
  await prisma.notice.deleteMany()
  await prisma.finance.deleteMany()
  await prisma.event.deleteMany()
  await prisma.visitorContact.deleteMany()
  await prisma.pastorDiaryEntry.deleteMany()
  await prisma.groupCover.deleteMany()
  await prisma.member.deleteMany()
  await prisma.ministry.deleteMany()
  await prisma.internalSociety.deleteMany()
  await prisma.bibleSchoolClass.deleteMany()
  await prisma.bibleSchool.deleteMany()
  await prisma.council.deleteMany()
  await prisma.diaconate.deleteMany()
  console.log("🗑️  Banco de demo limpo.")

  // ── Configurações da igreja fake (para o subdomínio de demonstração) ──
  const demoSettings = {
    churchName: "Igreja Presbiteriana Central (Demonstração)",
    slug: "igreja",
    whatsapp: "5545988887777",
    city: "Cascavel",
    state: "PR",
    address: "Av. Brasil, 4500 — Centro",
    phone: "(45) 98888-7777",
    email: "contato@ipcentral-demo.com",
    website: "https://exemplo.membrese.com",
    founded: "2005",
    pastor: "Rev. Exemplo de Demonstração",
    about:
      "Igreja de demonstração do sistema Membresia. Todos os dados aqui são fictícios, " +
      "criados apenas para você conhecer as funcionalidades por dentro.",
  }
  await prisma.churchSettings.upsert({
    where: { id: 1 },
    update: demoSettings,
    create: { id: 1, ...demoSettings },
  })

  // ── Membros ──
  const nomes: { nome: string; g: Gender; ano: number; mes: number; dia: number }[] = [
    { nome: "João Pereira", g: "MASCULINO", ano: 1980, mes: 3, dia: 12 },
    { nome: "Maria Souza", g: "FEMININO", ano: 1985, mes: 7, dia: 4 },
    { nome: "Pedro Almeida", g: "MASCULINO", ano: 1990, mes: 11, dia: 22 },
    { nome: "Ana Ribeiro", g: "FEMININO", ano: 1992, mes: 1, dia: 30 },
    { nome: "Lucas Martins", g: "MASCULINO", ano: 2001, mes: 5, dia: 9 },
    { nome: "Beatriz Lima", g: "FEMININO", ano: 2003, mes: 9, dia: 18 },
    { nome: "Rafael Costa", g: "MASCULINO", ano: 1975, mes: 2, dia: 27 },
    { nome: "Juliana Rocha", g: "FEMININO", ano: 1988, mes: 12, dia: 6 },
    { nome: "Carlos Mendes", g: "MASCULINO", ano: 1968, mes: 6, dia: 15 },
    { nome: "Fernanda Dias", g: "FEMININO", ano: 1995, mes: 4, dia: 2 },
    { nome: "Gabriel Nunes", g: "MASCULINO", ano: 2008, mes: 8, dia: 21 },
    { nome: "Larissa Freitas", g: "FEMININO", ano: 2010, mes: 10, dia: 14 },
    { nome: "Marcos Teixeira", g: "MASCULINO", ano: 1983, mes: 3, dia: 25 },
    { nome: "Patrícia Gomes", g: "FEMININO", ano: 1979, mes: 7, dia: 19 },
    { nome: "Tiago Barbosa", g: "MASCULINO", ano: 1997, mes: 11, dia: 8 },
    { nome: "Camila Azevedo", g: "FEMININO", ano: 1999, mes: 5, dia: 11 },
    { nome: "Rodrigo Pinto", g: "MASCULINO", ano: 1972, mes: 9, dia: 3 },
    { nome: "Sônia Cardoso", g: "FEMININO", ano: 1965, mes: 1, dia: 28 },
  ]

  const members: { id: number; name: string; g: Gender }[] = []
  for (const p of nomes) {
    const m = await prisma.member.create({
      data: {
        name: p.nome,
        gender: p.g,
        birthDate: d(p.ano, p.mes, p.dia),
        isActive: true,
      },
    })
    members.push({ id: m.id, name: m.name, g: p.g })
  }
  const M = (i: number) => members[i].id

  // ── Sociedades (IDs fixos) ──
  await prisma.internalSociety.createMany({
    data: [
      { id: SOC.saf, name: "SAF" },
      { id: SOC.uph, name: "UPH" },
      { id: SOC.ump, name: "UMP" },
      { id: SOC.upa, name: "UPA" },
      { id: SOC.ucp, name: "UCP" },
    ],
  })

  const mulheres = members.filter((m) => m.g === "FEMININO").map((m) => m.id)
  const homens = members.filter((m) => m.g === "MASCULINO").map((m) => m.id)

  await prisma.memberSociety.createMany({
    data: [
      // SAF (mulheres)
      { memberId: mulheres[0], societyId: SOC.saf, cargo: "Presidente" },
      { memberId: mulheres[1], societyId: SOC.saf, cargo: "Vice-Presidente" },
      { memberId: mulheres[2], societyId: SOC.saf, cargo: "1º Secretário" },
      { memberId: mulheres[3], societyId: SOC.saf, cargo: "Tesoureiro" },
      { memberId: mulheres[4], societyId: SOC.saf },
      // UPH (homens)
      { memberId: homens[0], societyId: SOC.uph, cargo: "Presidente" },
      { memberId: homens[1], societyId: SOC.uph, cargo: "Tesoureiro" },
      { memberId: homens[2], societyId: SOC.uph },
      { memberId: homens[3], societyId: SOC.uph },
      // UMP (jovens)
      { memberId: M(4), societyId: SOC.ump, cargo: "Presidente" },
      { memberId: M(15), societyId: SOC.ump, cargo: "1º Secretário" },
      { memberId: M(14), societyId: SOC.ump },
      // UPA (adolescentes)
      { memberId: M(5), societyId: SOC.upa, cargo: "Presidente" },
      { memberId: M(10), societyId: SOC.upa },
      // UCP (crianças)
      { memberId: M(11), societyId: SOC.ucp },
    ],
  })

  // ── Conselho & Diaconia ──
  await prisma.council.create({ data: { id: 1 } })
  await prisma.diaconate.create({ data: { id: 1 } })
  await prisma.memberCouncil.createMany({
    data: [
      { memberId: homens[0], councilId: 1, cargo: "Presidente" },
      { memberId: homens[4], councilId: 1, cargo: "Secretário" },
    ],
  })
  await prisma.memberDiaconate.createMany({
    data: [
      { memberId: homens[2], diaconateId: 1, cargo: "Presidente" },
      { memberId: homens[3], diaconateId: 1, cargo: "Tesoureiro" },
    ],
  })

  // ── Ministérios ──
  const louvor = await prisma.ministry.create({ data: { name: "Louvor e Adoração" } })
  const evang = await prisma.ministry.create({ data: { name: "Evangelismo" } })
  await prisma.memberMinistry.createMany({
    data: [
      { memberId: M(1), ministryId: louvor.id },
      { memberId: M(4), ministryId: louvor.id },
      { memberId: M(9), ministryId: louvor.id },
      { memberId: M(0), ministryId: evang.id },
      { memberId: M(6), ministryId: evang.id },
    ],
  })

  // ── Escola Bíblica ──
  await prisma.bibleSchool.create({ data: { id: 1 } })
  const turmaAdultos = await prisma.bibleSchoolClass.create({ data: { name: "Adultos", bibleSchoolId: 1 } })
  const turmaJovens = await prisma.bibleSchoolClass.create({ data: { name: "Jovens", bibleSchoolId: 1 } })
  const turmaCriancas = await prisma.bibleSchoolClass.create({ data: { name: "Crianças", bibleSchoolId: 1 } })

  const adultos = [homens[0], homens[1], mulheres[0], mulheres[1], mulheres[6]]
  const jovens = [M(4), M(5), M(14), M(15)]
  const criancas = [M(10), M(11)]
  for (const id of adultos) await prisma.member.update({ where: { id }, data: { bibleSchoolClassId: turmaAdultos.id } })
  for (const id of jovens) await prisma.member.update({ where: { id }, data: { bibleSchoolClassId: turmaJovens.id } })
  for (const id of criancas) await prisma.member.update({ where: { id }, data: { bibleSchoolClassId: turmaCriancas.id } })

  await prisma.classTeacher.createMany({
    data: [
      { memberId: homens[0], classId: turmaAdultos.id },
      { memberId: mulheres[0], classId: turmaJovens.id },
    ],
  })

  // Aulas + presenças (últimos 3 domingos)
  const today = new Date()
  for (let w = 0; w < 3; w++) {
    const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - (today.getUTCDay() + 7 * w)))
    const lesson = await prisma.bibleSchoolLesson.create({
      data: { classId: turmaAdultos.id, date, topic: `Lição ${w + 1}` },
    })
    await prisma.bibleSchoolAttendance.createMany({
      data: adultos.map((id, i) => ({ lessonId: lesson.id, memberId: id, isPresent: i % 3 !== 0 })),
    })
  }

  // ── Eventos + presenças ──
  const y = today.getUTCFullYear()
  const m = today.getUTCMonth() + 1
  const culto = await prisma.event.create({
    data: { title: "Culto de Adoração", description: "Culto dominical", date: d(y, m, 7), isPublic: true, category: null },
  })
  const eventoUph = await prisma.event.create({
    data: { title: "Café da Manhã UPH", date: d(y, m, 14), societyId: SOC.uph },
  })
  const eventoEbd = await prisma.event.create({
    data: { title: "Encontro de Professores", date: d(y, m, 21), category: "ebd" },
  })
  await prisma.attendance.createMany({
    data: [
      ...members.slice(0, 12).map((mm, i) => ({ memberId: mm.id, eventId: culto.id, isPresent: i % 4 !== 0 })),
      ...homens.slice(0, 4).map((id) => ({ memberId: id, eventId: eventoUph.id, isPresent: true })),
      { memberId: homens[0], eventId: eventoEbd.id, isPresent: true },
      { memberId: mulheres[0], eventId: eventoEbd.id, isPresent: true },
    ],
  })

  // ── Finanças (conselho + SAF) ──
  const financas: { description: string; type: FinanceType; value: number; month: number; councilId?: number; societyId?: number }[] = []
  for (let i = 0; i < 4; i++) {
    const mm = ((m - 1 - i + 12) % 12) + 1
    financas.push(
      { description: "Dízimos e ofertas", type: "ENTRADA", value: 3200 + i * 120, month: mm, councilId: 1 },
      { description: "Despesas de manutenção", type: "SAIDA", value: 850 + i * 40, month: mm, councilId: 1 },
      { description: "Contribuições SAF", type: "ENTRADA", value: 420 + i * 15, month: mm, societyId: SOC.saf },
    )
  }
  await prisma.finance.createMany({
    data: financas.map((f) => ({
      description: f.description,
      type: f.type,
      value: f.value,
      month: f.month,
      year: y,
      councilId: f.councilId ?? null,
      societyId: f.societyId ?? null,
    })),
  })

  // ── Avisos + visitantes de exemplo ──
  await prisma.notice.create({
    data: { title: "Bem-vindo à demonstração", message: "Este é um ambiente de demonstração com dados fictícios." },
  })
  await prisma.visitorContact.createMany({
    data: [
      { name: "Visitante Exemplo", phone: "45999998888", message: "Gostaria de conhecer a igreja no domingo." },
      { name: "Família Teste", phone: "45999997777", handled: true },
    ],
  })

  console.log("✅ Seed DEMO concluído.")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
