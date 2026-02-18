import prisma from "@/lib/prisma";
import DocumentListClient from "@/components/DocumentListClient";

export default async function DocumentListPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | undefined };
}) {
  const societyId = searchParams?.societyId ? parseInt(searchParams.societyId) : null
  const role = searchParams?.role

  const whereClause: any = {}
  if (societyId) whereClause.societyId = societyId
  else if (role === "conselho") whereClause.councilId = 1
  else if (role === "diaconia") whereClause.diaconateId = 1
  else if (role === "ministerio") whereClause.ministryId = { not: null }
  else if (role === "ebd") whereClause.bibleSchoolClassId = { not: null }

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
      <DocumentListClient documents={documents} relatedData={relatedData} />
    </div>
  );
}