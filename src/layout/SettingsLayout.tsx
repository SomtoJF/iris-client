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
    <div className="flex h-screen max-w-screen-2xl">
      <SettingsSidebar items={settingsSidebarItems} />
      <main className="flex-1 py-10 px-8 w-full ml-48">
        <Outlet />
      </main>
    </div>
  );
}
