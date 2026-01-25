"use client"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import Image from 'next/image';






const data = [
  {
    name: 'Jan',
    income: 4000,
    expenses: 2400,
    amt: 2400,
  },
  {
    name: 'Feb',
    income: 3000,
    expenses: 1398,
    amt: 2210,
  },
  {
    name: 'Mar',
    income: 2000,
    expenses: 9800,
    amt: 2290,
  },
  {
    name: 'April',
    income: 2780,
    expenses: 3908,
    amt: 2000,
  },
  {
    name: 'Maio',
    income: 1890,
    expenses: 4800,
    amt: 2181,
  },
  {
    name: 'Junho',
    income: 2390,
    expenses: 3800,
    amt: 2500,
  },
  {
    name: 'Julho',
    income: 3490,
    expenses: 4300,
    amt: 2100,
  },
  {
    name: 'Agosto',
    income: 1890,
    expenses: 4800,
    amt: 2181,
  },
  {
    name: 'Setembro',
    income: 2390,
    expenses: 3800,
    amt: 2500,
  },
  {
    name: 'Outubro',
    income: 3490,
    expenses: 4300,
    amt: 2100,
  },
  {
    name: 'Novembro',
    income: 1890,
    expenses: 4800,
    amt: 2181,
  },
  {
    name: 'Dezembro',
    income: 2390,
    expenses: 3800,
    amt: 2500,
  },
  
];
const FinanceChart = () => {
  return (
    <div className='bg-white rounded-xl w-full h-full p-4'>
            <div className='flex justify-between items-center '>  
                <h1 className='text-lg font-semibold'>Finance</h1>
                <Image src="/moreDark.png" alt="" width={20} height={20} />
            </div>
             <LineChart
      style={{ width: '100%', maxWidth: '1000px', height: '100%', maxHeight: '70vh', aspectRatio: 1.618 }}
      responsive
      data={data}
      margin={{
        top: 5,
        right: 0,
        left: 0,
        bottom: 5,
      }}
    >
      <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
      <XAxis 
      dataKey="name" 
      axisLine={false} 
      tick={{fill:"#d1d5db"}} 
      tickLine={false} />
      tickMargin={10}
      <YAxis axisLine={false} tick={{fill:"#d1d5db"}} tickLine={false} tickMargin={20}/>
      
      <Tooltip />
      <Legend 
      align="center" 
      verticalAlign='top' 
      wrapperStyle={{paddingTop:"10px", paddingBottom:"30px"}}/>
      <Line 
      type="monotone" 
      dataKey="expenses" 
      stroke="#8884d8" 
      strokeWidth={5} />
      <Line type="monotone" dataKey="income" stroke="#82ca9d" strokeWidth={5} />
    </LineChart>
            </div>

  )
}

export default FinanceChart