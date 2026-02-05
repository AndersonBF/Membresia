import prisma from "@/lib/prisma";
import DocumentListClient from "@/components/DocumentListClient"; // Importe o arquivo novo

export default async function DocumentListPage() {
  
  // 1. Buscar dados no Servidor (Server Side)
  const documents = await prisma.document.findMany({
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

  // 2. Renderizar o Componente Cliente passando os dados
  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
       <DocumentListClient documents={documents} relatedData={relatedData} />
    </div>
  );
}