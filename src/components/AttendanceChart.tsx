"use client"
import Image from 'next/image';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';


const data = [
  {
    name: 'Mon',
    present: 400,
    absent: 240,
    
  },
  {
    name: 'Tue',
    present: 300,
    absent: 198,
   
  },
  {
    name: 'Wed',
    present: 200,
    absent: 980,
    
  },
  {
    name: 'Thu',
    present: 278,
    absent: 398,
   
  },
  {
    name: 'Fri',
    present: 180,
    absent: 480,
   
  },
  {
    name: 'Sat',
    present: 239,
    absent: 380,
    
  },
  {
    name: 'Sun',
    present: 349,
    absent: 430,
   
  },
];

const AttendanceChart = () => {
  return <div className="bg-white rounded-lg  h-full p-4">
        <div className=''>
            <h1 className="text-xl font-bold">Attendance</h1>
            <Image src="/moreDark.png" alt="" width={20} height={20} />
        </div>
        
  
    <BarChart
        width={500} height={300} barSize={20}
      responsive
      data={data}
      margin={{
        top: 5,
        right: 0,
        left: 0,
        bottom: 5,
      }}
    >
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ddd" />
      <XAxis dataKey="name" axisLine={false} tick={{fill:"#d1d5db"}} tickLine={false} />
      <YAxis axisLine={false} tick={{fill:"#d1d5db"}} tickLine={false} />
      <Tooltip />
      <Legend 
      align="left" 
      verticalAlign='top' 
      wrapperStyle={{paddingTop:"20px", paddingBottom:"40px"}}/>
      <Bar dataKey="present" fill="#8884d8" activeBar={{ fill: 'pink', stroke: 'blue' }} 
      legendType='circle'
      radius={[10,10,0,0]}
      />
      <Bar dataKey="absent" fill="#82ca9d" activeBar={{ fill: 'gold', stroke: 'purple' }} 
        legendType='circle'
        radius={[10,10,0,0]}
      />
     
    </BarChart>
  

    </div>
  
}

export default AttendanceChart