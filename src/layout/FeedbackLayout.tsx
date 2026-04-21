import FeedbackSidebar from "@/components/feedback/FeedbackSidebar";
import { Outlet } from "react-router";

export default function FeedbackLayout() {
  return (
    <div className="flex h-screen min-h-0 w-full overflow-hidden bg-gray-50 text-gray-900">
      <FeedbackSidebar />
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

