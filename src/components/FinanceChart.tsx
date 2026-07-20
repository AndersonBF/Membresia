"use client"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts"
import Image from "next/image"

const data = [
  { name: "Jan",       income: 4000, expenses: 2400 },
  { name: "Feb",       income: 3000, expenses: 1398 },
  { name: "Mar",       income: 2000, expenses: 9800 },
  { name: "April",     income: 2780, expenses: 3908 },
  { name: "Maio",      income: 1890, expenses: 4800 },
  { name: "Junho",     income: 2390, expenses: 3800 },
  { name: "Julho",     income: 3490, expenses: 4300 },
  { name: "Agosto",    income: 1890, expenses: 4800 },
  { name: "Setembro",  income: 2390, expenses: 3800 },
  { name: "Outubro",   income: 3490, expenses: 4300 },
  { name: "Novembro",  income: 1890, expenses: 4800 },
  { name: "Dezembro",  income: 2390, expenses: 3800 },
]

const FinanceChart = () => {
  return (
    <div className="bg-white rounded-xl w-full h-full p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold">Finance</h1>
        <Image src="/moreDark.png" alt="" width={20} height={20} />
      </div>

      {/* IMPORTANTE: o container-pai deste componente precisa ter uma ALTURA definida
          (ex.: h-[450px]) para o height="90%" abaixo funcionar. Se não tiver, troque
          por uma altura fixa: <ResponsiveContainer width="100%" height={350}> */}
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tick={{ fill: "#d1d5db" }}
            tickLine={false}
            tickMargin={10}
          />
          <YAxis
            axisLine={false}
            tick={{ fill: "#d1d5db" }}
            tickLine={false}
            tickMargin={20}
          />
          <Tooltip />
          <Legend
            align="center"
            verticalAlign="top"
            wrapperStyle={{ paddingTop: "10px", paddingBottom: "30px" }}
          />
          <Line type="monotone" dataKey="expenses" stroke="#8884d8" strokeWidth={5} />
          <Line type="monotone" dataKey="income"   stroke="#82ca9d" strokeWidth={5} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default FinanceChart
