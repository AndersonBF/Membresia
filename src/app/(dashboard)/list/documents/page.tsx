import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import DocumentListClient from "@/components/DocumentListClient";
import { getEbdAccess, canAccessClass } from "@/lib/ebdAccess";
import { getManageableGroups, getMyMembership, societyMap } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function DocumentListPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | undefined };
}) {
  // Aceita tanto `role` quanto `roleContext` (o menu/atalhos usam roleContext)
  const roleContext = searchParams?.roleContext
  const role = searchParams?.role ?? roleContext
  // A sociedade pode vir por societyId OU por role/roleContext (ex.: "saf")
  const societyId = searchParams?.societyId
    ? parseInt(searchParams.societyId)
    : (role && societyMap[role]) || null
  const classId = searchParams?.classId ? parseInt(searchParams.classId) : null

  // Destino do botão "Voltar" conforme o contexto de origem
  const backHref = classId
    ? `/ebd/turma/${classId}`
    : roleContext
    ? `/${roleContext}`
    : null

  const whereClause: any = {}

  if (societyId) {
    whereClause.societyId = societyId
  } else if (classId) {
    // Documentos de UMA turma específica + os "EBD geral" (todas as turmas)
    const access = await getEbdAccess()
    if (!canAccessClass(access, classId)) notFound()
    whereClause.OR = [{ bibleSchoolClassId: classId }, { bibleSchoolGeneral: true }]
  } else if (role === "ebd") {
    // Visão geral da EBD: superintendente/admin veem todas as turmas + gerais;
    // professora vê apenas as turmas dela + gerais.
    const access = await getEbdAccess()
    if (access.canSeeAll) {
      whereClause.OR = [{ bibleSchoolClassId: { not: null } }, { bibleSchoolGeneral: true }]
    } else {
      whereClause.OR = [{ bibleSchoolClassId: { in: access.teacherClassIds } }, { bibleSchoolGeneral: true }]
    }
  } else if (role === "conselho") {
    whereClause.councilId = 1
  } else if (role === "diaconia") {
    whereClause.diaconateId = 1
  } else if (role === "ministerio") {
    whereClause.ministryId = { not: null }
  } else {
    // Sem contexto explícito (ex.: menu "Documentos" geral).
    // Admin vê tudo; demais veem apenas os documentos dos grupos a que
    // pertencem + os documentos gerais (sem vínculo).
    const { isAdmin } = await getManageableGroups()
    if (!isAdmin) {
      const me = await getMyMembership()
      const or: any[] = [
        // Gerais (sem qualquer vínculo)
        {
          societyId: null, ministryId: null, councilId: null,
          diaconateId: null, bibleSchoolClassId: null, bibleSchoolGeneral: false,
        },
      ]
      if (me.societyIds.length) or.push({ societyId: { in: me.societyIds } })
      if (me.hasCouncil) or.push({ councilId: { not: null } })
      if (me.hasDiaconate) or.push({ diaconateId: { not: null } })
      if (me.ministryIds.length) or.push({ ministryId: { in: me.ministryIds } })
      if (me.classIds.length) {
        or.push({ bibleSchoolClassId: { in: me.classIds } })
        or.push({ bibleSchoolGeneral: true })
      }
      whereClause.OR = or
    }
  }

  const documents = await prisma.document.findMany({
    where: whereClause,
    include: {
      society: true,
      ministry: true,
      bibleSchoolClass: true,
      council: true,
      diaconate: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const societies = await prisma.internalSociety.findMany();
  const ministries = await prisma.ministry.findMany();
  const classes = await prisma.bibleSchoolClass.findMany();
  const councils = await prisma.council.findMany();
  const diaconates = await prisma.diaconate.findMany();

  const relatedData = { societies, ministries, classes, councils, diaconates };

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <DocumentListClient
        documents={documents}
        relatedData={relatedData}
        defaultClassId={classId ?? undefined}
        backHref={backHref}
      />
    </div>
  );
}
