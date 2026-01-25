import Announcements from "@/components/Announcements"
import EventCalendar from "@/components/EventCalendar"

const MemberPage = () => {
  return (
    <div className="p-4 flex gap-4 flex-col xl:flex-row">
    {/* left */}
    <div className="w-full xl:w-2/3"></div>
    {/* right side */}
    <div className="w-full xl:w-1/3 flex flex-col gap-8 ">
    <EventCalendar/>
    <Announcements/>
    </div>
    </div>
  )
}

export default MemberPage