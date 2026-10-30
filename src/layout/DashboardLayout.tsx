import { Outlet } from "react-router";
import Navbar from "@/components/custom/Navbar";
import ClaudeSidebar, {
  SIDEBAR_COLLAPSED_WIDTH,
  SIDEBAR_EXPANDED_WIDTH,
} from "@/components/pixel-perfect/claude-sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";

export default function DashboardLayout() {
  const mobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="w-full flex max-h-screen overflow-auto">
      {!mobile && (
        <div
          className="flex-none h-full sticky top-0 overflow-hidden"
          style={{
            width: sidebarCollapsed
              ? SIDEBAR_COLLAPSED_WIDTH
              : SIDEBAR_EXPANDED_WIDTH,
            transition: "width 300ms cubic-bezier(0.165,0.85,0.45,1)",
          }}
        >
          <ClaudeSidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed((collapsed) => !collapsed)}
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
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
