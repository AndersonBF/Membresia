import AttendanceChart from "@/components/AttendanceChart"
import CountChart from "@/components/CountChart"
import UserCard from "@/components/UserCard"
import FinanceChart from "@/components/FinanceChart"
import EventCalendar from "@/components/EventCalendar"
import Announcements from "@/components/Announcements"

const AdminPage = () => {
  return (
    <div className='p-4 flex gap-4 flex-col md:flex-row'>
    {/* Conteúdo da página de administração pode ser adicionado aqui */}
    <div className="w-full lg:w-2/3 flex flex-col gap-8">l
    {/* Conteúdo da página de administração pode ser adicionado aqui */}
    <div className="flex gap-4 justify-between flex-wrap">
      <UserCard type="member"/>
      <UserCard type="position"/>
      <UserCard type="parent"/>
      <UserCard type="admin"/>
    </div>
    {/*middle charts*/}
    <div className="flex gap-4 flex-col lg:flex-row">
      {/* count chart*/}
      <div className="w-full lg:w-1/3 h-[450px]">
      <CountChart/></div>
       {/* attendance chart*/}
      <div className="w-full lg:w-2/3 h-[450px]">
      <AttendanceChart/>
      </div>
    </div>
    {/* bottom chart*/}
    <div className="w-full h-[500px]">
       <FinanceChart/>
       </div>
    </div>
    {/* right side */}
    <div className="w-full lg:w-1/3 flex flex-col gap-8">
    <EventCalendar/>
    <Announcements/>
    </div>
    </div>
    
  )
}

export default AdminPage