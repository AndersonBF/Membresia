import prisma from "@/lib/prisma"
import {auth } from "@clerk/nextjs/server";

const Announcements = async () => {

    const {userId, sessionClaims} = await auth(); // await getUserSession();
    const role = (sessionClaims?.metadata as {role?:string})?.role;

    const roleConditions = {
        admin:{}
        
    }

    const data = await prisma.notice.findMany({
        take: 3,
        orderBy:{ createdAt: "desc" },
    })
  return (
    <div className="bg-white p-4 rounded-md">
        <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold my-4">Announcements</h1>
            <span className="text-xs text-gray-400">View All</span>
            
        </div>
        <div className="flex flex-col gap-4 mt-4">
            {data[0] && <div className="bg-lamaSkyLight rounded-md p-4">
        
            <div className="flex items-center justify-between">
            <h2>{data[0]?.title}</h2>
            <span className="text-xs text-gray-400 bg-white rounded-md py1">
               {new Intl.DateTimeFormat('pt-BR').format(data[0].createdAt)}
            </span>
        </div>
        <p className=" text-gray-400 text-sm">{data[0].message}</p>
        </div>}
    </div>
    <div className="flex flex-col gap-4 mt-4">
        {data[1] && <div className="bg-lamaSkyLight rounded-md p-4">
            <div className="flex items-center justify-between">
            <h2>{data[1]?.title}</h2>
            <span className="text-xs text-gray-400 bg-white rounded-md py1">
                 {new Intl.DateTimeFormat('pt-BR').format(data[1].createdAt)}
            </span>
        </div>
        <p className=" text-gray-400 text-sm">{data[1]?.message}</p>
        </div>}
    </div>
    <div className="flex flex-col gap-4 mt-4">
        {data[2] && <div className="bg-lamaPurpleLight rounded-md p-4">
            <div className="flex items-center justify-between">
            <h2>{data[2]?.title}</h2>
            <span className="text-xs text-gray-400 bg-white rounded-md py1">
                 {new Intl.DateTimeFormat('pt-BR').format(data[2].createdAt)}
            </span>
        </div>
        <p className=" text-gray-400 text-sm">{data[2]?.message}</p>
        </div>}
    </div>
    </div>
  )
}

export default Announcements