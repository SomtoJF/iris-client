import { usePageTitle } from "@/hooks/page-title";

export default function Dashboard() {
  usePageTitle("Overview");

  return (
    <main className="min-h-[calc(100vh-3rem)] w-full bg-gray-50 px-6 py-8 text-gray-800 md:px-10 md:py-10">
      <div className="mx-auto w-full max-w-5xl">
        <h1 className="text-2xl font-extrabold tracking-tight">Overview</h1>
        <p className="mt-1 text-sm text-gray-600">Your job search workspace, all in one place.</p>
      </div>
    </main>
  );
}
