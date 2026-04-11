import { useUserStore } from "@/zustand/userstore";
import { Link } from "react-router";
import { SettingsIcon } from "lucide-react";

export default function Navbar() {
  const { user } = useUserStore();
  return (
    <nav className="w-full border-b border-gray-200 flex items-center justify-between py-3.5 gap-4">
      <img src="/logo-transparent.png" alt="Iris" className="h-12 w-auto" />
      <div className="flex items-center gap-4">
        <Link
          to="/settings/account"
          className="text-sm flex no-wrap items-center text-muted-foreground hover:text-black"
        >
          <SettingsIcon className="w-4 h-4 mr-1" /> Settings
        </Link>
        <div className="w-8 h-8 text-white font-semibold bg-purple-600 rounded-md flex items-center justify-center">
          {user?.firstName.charAt(0)}
          {user?.lastName.charAt(0)}
        </div>
      </div>
    </nav>
  );
}
