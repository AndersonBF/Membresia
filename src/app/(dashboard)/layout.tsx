import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import DemoBanner from "@/components/DemoBanner";
import { logPageview } from "@/lib/accessLog";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Registra o acesso (silencioso — nunca quebra a página)
  await logPageview();

  return (
    <div className="h-screen flex flex-col">
      <style dangerouslySetInnerHTML={{ __html: `
        .sidebar-scroll { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.18) transparent; }
        .sidebar-scroll::-webkit-scrollbar { width: 6px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 999px; }
        .sidebar-scroll:hover::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.30); }
      ` }} />
      <DemoBanner />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <div className="flex-1 min-w-0 bg-[#F7F8FA] overflow-y-auto overflow-x-hidden">
          <Navbar />
          {children}
        </div>
      </div>
    </div>
  );
}