import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Event, InternalSociety, Prisma } from "@prisma/client";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";

type EventList = Event & { society: InternalSociety | null };

const EventListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { sessionClaims } = await auth();
  const roles = (sessionClaims?.metadata as { roles?: string[] })?.roles ?? [];
  const isAdmin = roles.includes("admin") || roles.includes("superadmin");

  const societies = await prisma.internalSociety.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const columns = [
    { header: "Título", accessor: "title" },
    { header: "Descrição", accessor: "description", className: "hidden lg:table-cell" },
    { header: "Data", accessor: "date", className: "hidden md:table-cell" },
    { header: "Início", accessor: "startTime", className: "hidden md:table-cell" },
    { header: "Fim", accessor: "endTime", className: "hidden md:table-cell" },
    { header: "Sociedade", accessor: "society", className: "hidden lg:table-cell" },
    { header: "Público", accessor: "isPublic", className: "hidden md:table-cell" },
    ...(isAdmin ? [{ header: "Ações", accessor: "action" }] : []),
  ];

  const renderRow = (item: EventList) => (
    <tr key={item.id} className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight">
      <td className="flex items-center gap-4 p-4">{item.title}</td>
      <td className="hidden lg:table-cell">
        {item.description ? <span className="truncate max-w-xs block">{item.description}</span> : <span className="text-gray-400">-</span>}
      </td>
      <td className="hidden md:table-cell">{new Intl.DateTimeFormat("pt-BR").format(item.date)}</td>
      <td className="hidden md:table-cell">
        {item.startTime ? item.startTime.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", hour12: false }) : "-"}
      </td>
      <td className="hidden md:table-cell">
        {item.endTime ? item.endTime.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", hour12: false }) : "-"}
      </td>
      <td className="hidden lg:table-cell">{item.society?.name || <span className="text-gray-400">-</span>}</td>
      <td className="hidden md:table-cell">
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.isPublic ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
          {item.isPublic ? "Público" : "Privado"}
        </span>
      </td>
      <td>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <FormContainer table="event" type="update" data={item} relatedData={{ societies }} />
              <FormContainer table="event" type="delete" id={item.id} />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  const query: Prisma.EventWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "search":
            query.title = { contains: value, mode: "insensitive" };
            break;
          case "societyId":
            query.societyId = parseInt(value);
            break;
          case "role":
            if (["conselho", "diaconia", "ministerio", "ebd"].includes(value)) {
              query.isPublic = true;
            }
            break;
        }
      }
    }
  }

  // Se não é admin e não há filtro de sociedade/role, mostra só públicos
  if (!isAdmin && !queryParams.societyId && !queryParams.role) {
    query.isPublic = true;
  }

  const [data, count] = await prisma.$transaction([
    prisma.event.findMany({
      where: query,
      include: { society: true },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: { date: "asc" },
    }),
    prisma.event.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">Eventos</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {isAdmin && <FormContainer table="event" type="create" relatedData={{ societies }} />}
          </div>
        </div>
      </div>
      <Table columns={columns} renderRow={renderRow} data={data} />
      <Pagination page={p} count={count} />
    </div>
  );
};

export default EventListPage;