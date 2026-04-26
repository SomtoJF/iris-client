import { Outlet } from "react-router";
import Navbar from "@/components/custom/Navbar";

export default function DashboardLayout() {
  return (
    <div className="w-full">
      <Navbar />
      <Outlet />
    </div>
  );
}
