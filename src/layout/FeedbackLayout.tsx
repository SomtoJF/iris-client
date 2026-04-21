import FeedbackSidebar from "@/components/feedback/FeedbackSidebar";
import { Outlet } from "react-router";

export default function FeedbackLayout() {
  return (
    <div className="flex h-screen w-full max-w-screen-2xl bg-gray-50 text-gray-900">
      <FeedbackSidebar />
      <main className="ml-[360px] w-full min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}

