import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { Prisma, Member } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

const MemberListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const columns = [
    { header: "Info", accessor: "info" },
    { header: "Gênero", accessor: "gender", className: "hidden md:table-cell" },
    {
      header: "Data Nascimento",
      accessor: "birthDate",
      className: "hidden lg:table-cell",
    },
    {
      header: "Telefone",
      accessor: "phone",
      className: "hidden lg:table-cell",
    },
    {
      header: "Email",
      accessor: "email",
      className: "hidden xl:table-cell",
    },
    {
      header: "Status",
      accessor: "isActive",
      className: "hidden md:table-cell",
    },
    { header: "Actions", accessor: "actions" },
  ];

  const renderRow = (item: Member) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">
        <Image
          src="/profile.png"
          alt=""
          width={40}
          height={40}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex flex-col">
          <h3 className="font-semibold">{item.name}</h3>
          <p className="text-xs text-gray-500">
            {item.username || `ID: ${item.id}`}
          </p>
        </div>
      </td>

      <td className="hidden md:table-cell">
        {item.gender === "MASCULINO" ? (
          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            M
          </span>
        ) : item.gender === "FEMININO" ? (
          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-pink-100 text-pink-800">
            F
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>

      <td className="hidden lg:table-cell">
        {item.birthDate ? (
          <div className="flex flex-col">
            <span>
              {new Date(item.birthDate).toLocaleDateString("pt-BR")}
            </span>
            <span className="text-xs text-gray-500">
              {Math.floor(
                (Date.now() - new Date(item.birthDate).getTime()) /
                  (365.25 * 24 * 60 * 60 * 1000)
              )}{" "}
              anos
            </span>
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>

      <td className="hidden lg:table-cell">{item.phone || "-"}</td>

      <td className="hidden xl:table-cell">
        {item.email || <span className="text-gray-400">-</span>}
      </td>

      <td className="hidden md:table-cell">
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${
            item.isActive
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {item.isActive ? "Ativo" : "Inativo"}
        </span>
      </td>

      <td>
        <div className="flex items-center gap-2">
          <Link href={`/list/members/${item.id}`}>
            <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky">
              <Image src="/view.png" alt="" width={16} height={16} />
            </button>
          </Link>

          {role === "admin" && (
            <>
              <FormContainer table="member" type="update" data={item} />
              <FormContainer table="member" type="delete" id={item.id} />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  const query: Prisma.MemberWhereInput = {};

  if (queryParams.search) {
    query.name = { contains: queryParams.search, mode: "insensitive" };
  }

  const [data, count] = await prisma.$transaction([
    prisma.member.findMany({
      where: query,
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: { name: "asc" },
    }),
    prisma.member.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">
          Todos os Membros
        </h1>

        <div className="flex flex-col md:flex-row items-center gap-4">
          <TableSearch />

          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 rounded-full bg-lamaYellow flex items-center justify-center">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>

            <button className="w-8 h-8 rounded-full bg-lamaYellow flex items-center justify-center">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>

            {role === "admin" && (
              <FormContainer table="member" type="create" />
            )}
          </div>
        </div>
      </div>

      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={data} />

      {/* PAGINATION */}
      <Pagination page={p} count={count} />

      {/* EXPORT */}
      <div className="flex justify-end mt-6">
        <Link
          href="/export/members"
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Exportar membros (Excel)
        </Link>
      </div>
    </div>
  );
};

export default MemberListPage;
