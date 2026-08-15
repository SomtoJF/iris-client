import { useUserStore } from "@/zustand/userstore";
import { Link, useNavigate } from "react-router";
import { Feather, SettingsIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { logout } from "@/services/auth";
import { ApiError } from "@/services/api";
import { queryKeys } from "@/querykeyfactory";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const { user, clearUser } = useUserStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      const alreadyLoggedOut = err instanceof ApiError && err.status === 401;
      if (!alreadyLoggedOut) {
        toast.error(err instanceof Error ? err.message : "Failed to logout");
        return;
      }
    }
    clearUser();
    queryClient.setQueryData(queryKeys.user.current, null);
    const userKey = JSON.stringify(queryKeys.user.current);
    queryClient.removeQueries({
      predicate: (query) => JSON.stringify(query.queryKey) !== userKey,
    });
    navigate("/login", { replace: true });
  };

  return (
    <nav className="w-full border-b border-gray-200 flex items-center justify-between py-1 gap-4 px-4 md:px-0">
      <img src="/logo-transparent.png" alt="Iris" className="h-12 w-auto" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="w-8 h-8 text-white font-semibold bg-purple-600 rounded-md flex items-center justify-center cursor-pointer outline-none"
            aria-label="Account menu"
          >
            {user?.firstName.charAt(0)}
            {user?.lastName.charAt(0)}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem asChild>
            <Link to="/feedback">
              <Feather /> Feedback
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/settings/account">
              <SettingsIcon /> Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={handleLogout}>
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}
