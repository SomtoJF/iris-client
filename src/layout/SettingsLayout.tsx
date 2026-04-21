import { Navigate, Outlet } from "react-router";
import { useFetchCurrentUser } from "@/hooks/user";
import { useUserStore } from "@/zustand/userstore";
import { Loader } from "lucide-react";
import { useEffect } from "react";
import SettingsSidebar, {
  type SettingsSidebarItem,
} from "@/components/custom/SettingsSidebar";

const settingsSidebarItems: SettingsSidebarItem[] = [
  {
    path: "/settings/account",
    label: "Account",
  },
  {
    path: "/settings/application-profile",
    label: "Application Profile",
  },
];

export default function SettingsLayout() {
  const { user, isFetching, isPending } = useFetchCurrentUser();
  const { setUser, clearUser } = useUserStore();

  useEffect(() => {
    if (isFetching) return;
    if (user) {
      setUser(user);
    } else {
      clearUser();
    }
  }, [user, isFetching, setUser, clearUser]);

  useEffect(() => {
    if (
      user?.isAdmin &&
      !settingsSidebarItems.some((item) => item.path === "/settings/admin")
    ) {
      settingsSidebarItems.push({
        path: "/settings/admin",
        label: "Admin",
      });
    }
  }, [user]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.isResumeOnboardingComplete) {
    return <Navigate to="/onboarding/resume" replace />;
  }

  if (!user.isOnboardingComplete) {
    return <Navigate to="/onboarding/application" replace />;
  }

  return (
    <div className="flex h-screen w-full">
      <SettingsSidebar items={settingsSidebarItems} />
      <main className="ml-[360px] min-w-0 w-full flex-1 px-8 py-10">
        <Outlet />
      </main>
    </div>
  );
}
