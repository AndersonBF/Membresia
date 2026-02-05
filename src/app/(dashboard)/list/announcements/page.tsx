import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { role } from "@/lib/data";
import Image from "next/image";

export const dynamic = "force-dynamic";

const announcementsData = [
  {
    id: 1,
    title: "Bem-vindo!",
    description: "Bem-vindo ao sistema de gerenciamento de membros",
    date: "2024-01-28",
    class: "Geral",
  },
  {
    id: 2,
    title: "Reunião Mensal",
    description: "Próxima reunião será dia 30 de Janeiro",
    date: "2024-01-25",
    class: "Importante",
  },
];

type Announcement = {
  id: number;
  title: string;
  class: string;
  date: string;
};

const columns = [
  {
    header: "Title",
    accessor: "title",
  },
  {
    header: "Class",
    accessor: "class",
  },
  {
    header: "Date",
    accessor: "date",
    className: "hidden md:table-cell",
  },
  {
    header: "Actions",
    accessor: "action",
  },
];

// 1. Recebemos searchParams como prop
const AnnouncementListPage = ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  
  // 2. Extraímos a página da URL (padrão é 1 se não existir)
  const { page } = searchParams;
  const p = page ? parseInt(page) : 1;

  // 3. Definimos o total (count). 
  // Como seus dados são estáticos por enquanto, usamos o length do array.
  // Quando conectar no Prisma, isso virá de "prisma.notice.count()"
  const count = announcementsData.length;

  const renderRow = (item: Announcement) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">{item.title}</td>
      <td>{item.class}</td>
      <td className="hidden md:table-cell">{item.date}</td>
      <td>
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <>
              <FormModal table="announcement" type="update" data={item} />
              <FormModal table="announcement" type="delete" id={item.id} />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">
          All Announcements
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {role === "admin" && (
              <FormModal table="announcement" type="create" />
            )}
          </div>
        </div>
      </div>
      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={announcementsData} />
      
      {/* PAGINATION - Agora com as variáveis definidas */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default AnnouncementListPage;