import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch"
import Image from "next/image";
import Table from "@/components/Table"
import { membrosData } from "@/lib/data";
import Link from "next/link";
import { role } from "@/lib/data";
import {Membro} from "@prisma/client"
import { PrismaClient } from "@prisma/client";
import FormModal from "@/components/FormModal";

export const dynamic = "force-dynamic";


type Member = {
  id: number;
  memberId: string;
  name: string;
  email?: string;
  phone: string;
  photo: string;
}


const columns = [
  {
    header: "Info",
    accessor: "info",
  },
  {
    header: "Student ID",
    accessor: "studentid",
    className: "hidden md:table-cell",
  },
  {
    header: "Sexo",
    accessor: "sexo",
    className: "hidden md:table-cell",
  },
  {
    header: "Telefone",
    accessor: "telefone",
    className: "hidden lg:table-cell",
  },
  {
    header: "Email",
    accessor: "email",
    className: "hidden lg:table-cell",
  },
  {
    header: "Status",
    accessor: "ativo",
    className: "hidden lg:table-cell",
  },
  {
    header: "Actions",
    accessor: "actions",
  }
];

const prisma = new PrismaClient();

const renderRow = (item: Membro  ) => (
  <tr key={item.id} className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurPleLight">
    <td className="flex items-center gap-4 p-4 ">
      <Image src={"/profile.png"} alt="" width={40} height={40} className=" xl:block w-10 h-10
    rounded-full object-cover"/>
      <div className="flex flex-col">
        <h3 className="font-semibold">{item.nome}</h3>
        <p className="text-xs text-gray-500">{item?.email}</p>
      </div>
    </td>
    <td className="hidden md:table-cell">{item.id}</td>
    <td className="hidden md:table-cell">{item.nome}</td>
    <td className="hidden md:table-cell">{item.sobrenome}</td>
    <td className="hidden md:table-cell">{item.email}</td>
    <td className="hidden md:table-cell">{item.telefone}</td>
    <td>
      <div className="flex items-center gap-2">
        <Link href={`/list/members/${item.id}`}>
          <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky">
            <Image src="/view.png" alt="" width={16} height={16} />
          </button>
        </Link>
        {role === "admin" && (
            // <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaPurple">
            //   <Image src="/delete.png" alt="" width={16} height={16} />
            // </button>
            <FormModal table="member" type="delete" id={item.id}/>
          )}
      </div>
    </td>
  </tr>

);
const MemberListPage = async () => {

    const members = await prisma.membro.findMany();

    console.log(members)

  return (
    <div className="bg-white p-4 rounded flex-1 m-4 mt-0">
      {/* top */}
      <div className="flex items-center justify-between">
        <h1 className=" hidden md:block text-lg  font-semibold">All members</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-faull md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {role === "admin" && (
             // <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaPurple">
            //   <Image src="/delete.png" alt="" width={16} height={16} />
            // </button>
            <FormModal table="member" type="create" />
            )}
          </div>
        </div>
      </div>
      {/* list */}
      <Table columns={columns} renderRow={renderRow} data={members} />
      <div className=""> </div>
      {/* pagination */}
      <div className="">
        <Pagination />
      </div>

    </div>
  )
}

export default MemberListPage