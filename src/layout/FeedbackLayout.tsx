import FeedbackSidebar from "@/components/feedback/FeedbackSidebar";
import { Outlet } from "react-router";

export default function FeedbackLayout() {
  return (
    <div className="flex w-full min-h-[calc(100vh-49px)] bg-gray-50 text-gray-900">
      <FeedbackSidebar />
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}

