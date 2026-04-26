import { Outlet } from "react-router";
import { useUserStore } from "@/zustand/userstore";
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
  const { user } = useUserStore();

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

  return (
    <div className="flex h-screen w-full">
      <SettingsSidebar items={settingsSidebarItems} />
      <main className="ml-[360px] min-w-0 w-full flex-1 px-8 py-10">
        <Outlet />
      </main>
    </div>
  );
}
