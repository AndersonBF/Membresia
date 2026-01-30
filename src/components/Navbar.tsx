import { UserButton } from "@clerk/nextjs"
import Image from "next/image"
import { Input } from "postcss/lib/postcss"
import { currentUser } from "@clerk/nextjs/server";

const Navbar = async() => {

    const user = await currentUser();
  return (
    <div className="flex items-center justify-between p-4 ">
    {/* Navbar content can be added here */}
      <div className="hidden md:flex items-center gap-2 tex-xs rounded-full ring-[1.5x] ring-gray-300 px-3 ">
        <Image src="/search.png" alt="" width={14} height={14} />
        <input type="text" placeholder="Search..." className="w-[200px] p-2 bg-transparent outline-none" />
      </div>
    {/* icones e usuarios*/}
    <div className = "flex items-center gap-6 justify-end">
      <div className="bg-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer ">
        <Image src="/message.png"  alt="" width={20} height={20} />
       </div>
       <div className="bg-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer relative">
        <Image src="/announcement.png" alt="" width={20} height={20} />
        <div className="absolute -top-3 -right-3 w-5 h-5 flex items-center justify-center bg-purple-500 text-white rounded-full text-xs">1</div>
      </div>
      <div className="flex flex-col">
        <span className="text-xs leading-3 font-medium">Ander</span>
        <span className="text-[10px] text-gray-500 text-right">{user?.publicMetadata?.role as string }</span>
      </div>
      {/*<Image src="/avatar.png" alt="" width={36} height={36} className=" rounded-full"/>*/}
      <UserButton/>
    </div>
    </div>
    
  )
}

export default Navbar