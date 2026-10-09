import { Outlet } from "react-router";
import Navbar from "@/components/custom/Navbar";
import ClaudeSidebar from "@/components/pixel-perfect/claude-sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

export default function DashboardLayout() {
  const mobile = useIsMobile();
  return (
    <div className="w-full flex max-h-screen overflow-auto">
      {!mobile && (
        <div className="flex-none w-72 h-full sticky top-0">
          <ClaudeSidebar />
        </div>
      )}
      <div className="w-full max-w-screen-xl">
        {mobile ? (
          <Navbar />
        ) : (
          <div className="w-full border-b border-gray-200 flex items-center justify-between py-1 gap-4 px-4 md:px-0 h-12"></div>
        )}
        <Outlet />
      </div>
    </div>
  );
}
