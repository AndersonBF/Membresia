import Menu from "@/components/Menu";
import Link from "next/dist/client/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
  <div className="h-screen flex">  
  {/*LEFT SIDE BAR*/}
<div className="w-[14%] md:w-[8%] lg:w-[16%] xl:w-[14%] p-4 bg-gradient-to-b from-green-900 to-emerald-950">
    <Link 
    href="/" 
    className="flex items-center justify-center lg:justify-start gap-2"
    >
    {/*<Image src="/logo.png" alt="Logo" width={32} height={32} />*/}
    <span className="hidden lg:block font-bold">  </span>
    </Link>
    <Menu />
  </div>
  {/*RIGHT CONTENT*/}
  <div className="w-[86%] md:w-[92%] lg:w-[84%] xl:w-[86%] bg-[#F7F8FA] overflow-scroll">
    <Navbar/>
    {children}

  </div>
  </div>
  );
}
