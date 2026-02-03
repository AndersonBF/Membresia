import prisma from "@/lib/prisma";
import Image from "next/image";

const UserCard = async ({type}:{type: "member" | "council" | "diaconate" | "internalsociety"}) => {

  const modelMap : Record<typeof type, any>= {
    member: prisma.member,
    council: prisma.council,
    diaconate: prisma.diaconate,
    internalsociety: prisma.internalSociety,
  }
  const data = await modelMap[type].count()
  return (
    <div className="rounded-2xl odd:bg-green-800 even:bg-green-200 p-4 flex-1 min-w-[130px]">
        <div className="flex justify-between items-center ">
            <span className="text-[10px] bg-white px-2 py-1 rounded-full text-green-600">2024/25</span>
            <Image src="/more.png" alt="" width={16} height={16}/>
        </div>
        <h1 className="text-2xl font-semibold my-4">{data}</h1>
        <h2 className="capiitalize text-sn fonte-medium text-black"> {type}</h2>
    </div>
  )
}

export default UserCard