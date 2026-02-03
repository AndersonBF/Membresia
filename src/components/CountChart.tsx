"use client";
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from 'recharts';
import Image from 'next/image';

const CountChart = ({masculino, feminino}:{masculino: number; feminino:number}) => {
const data = [
  {
    name: 'Total',
    count: masculino+feminino,
    fill: 'white',
  },
  {
    name: 'Mulheres',
    count: feminino,
    fill: '#86efac', // verde claro (green-300)
  },
  {
    name: 'Homens',
    count: masculino,
    fill: '#065f46', // verde escuro (emerald-900)
  },
];


  return (
    <div className='relative w-full h-[75%]'>
    
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="40%"
            outerRadius="100%"
            barSize={32}
            data={data}
          >
            <RadialBar background dataKey="count" />
            <Tooltip />
          </RadialBarChart>
        </ResponsiveContainer>
        
        {/* ✅ CORREÇÃO 2: Imagem agora está dentro do container correto */}
        <Image
          src="/maleFemale.png"
          alt=""
          width={50}
          height={50}
          className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
        />
        </div>
     
  );
};

export default CountChart;