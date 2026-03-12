import { Link, useLocation } from "react-router";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsSidebarProps {
  items: SettingsSidebarItem[];
}

export type SettingsSidebarItem = {
  label: string;
  path: string;
};

export default function SettingsSidebar({ items }: SettingsSidebarProps) {
  const location = useLocation();

  return (
    <aside className="w-48 h-screen border-r flex flex-col shrink-0">
      <div className="px-4 pt-6 pb-2">
        <h2 className="text-sm font-semibold tracking-wide">Settings</h2>
      </div>

      <Link
        to="/dashboard"
        className="flex items-center gap-1.5 px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to dashboard
      </Link>

      <div className="mt-2 px-2">
        <div className="h-px bg-border" />
      </div>

      <nav className="flex flex-col gap-0.5 px-2 mt-2">
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
