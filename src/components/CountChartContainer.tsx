import CountChart from "./CountChart"
import Image from "next/image"
import prisma from "@/lib/prisma";

const CountChartContainer =  async() => {

    const data = await prisma.member.groupBy({
        by:["gender"],
        _count:true,
    });

    const masculino = data.find(d=>d.gender === "MASCULINO")?._count || 0;
    const feminino = data.find(d=>d.gender === "FEMININO")?._count || 0;

    console.log(data)
  return (
    <div className='bg-white rounded-xl w-full h-full p-4'>
          {/* TITULO */}
          <div className='flex justify-between items-center'>
            <h1 className='text-lg font-semibold'>Students</h1>
            <Image src="/moreDark.png" alt="" width={20} height={20} />
          </div>
    
          {/* CHART */}
          {/* ✅ CORREÇÃO 1: Adicionei relative e altura fixa */}
          <div className='relative w-full h-[75%]'>
            <CountChart masculino={masculino} feminino={feminino}/>
             </div>

      {/* BOTTOM */}
      <div className='flex justify-center gap-16'>
        <div className='flex flex-col gap-1'>
          <div className='w-5 h-5 bg-emerald-900 rounded-full' />
          <h1 className='font-bold'>{masculino}</h1>
          <h2 className='text-xs text-gray-600'>Homens ({Math.round(masculino / (masculino + feminino) * 100)}%)</h2>
        </div>
        <div className='flex flex-col gap-1'>
          <div className='w-5 h-5 bg-green-300 rounded-full' />
          <h1 className='font-bold'>{feminino}</h1>
          <h2 className='text-xs text-gray-600'>Mulheres ({Math.round(feminino / (masculino + feminino) * 100)}%)</h2>
        </div>
      </div>
    </div>

  )
}

export default CountChartContainer