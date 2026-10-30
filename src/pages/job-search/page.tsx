import SearchJobsTab from "@/components/custom/SearchJobsTab";
import { usePageTitle } from "@/hooks/page-title";

export default function JobSearchPage() {
  usePageTitle("Job Search");
  return (
    <main className="min-h-[calc(100vh-3rem)] w-full bg-gray-50 px-6 py-8 text-gray-800 md:px-10 md:py-10">
      <div className="mx-auto w-full max-w-5xl">
        <h1 className="text-2xl font-extrabold tracking-tight">Job Search</h1>
        <p className="mt-1 text-sm text-gray-600">Find roles that match your experience and goals.</p>
        <div className="mt-6"><SearchJobsTab /></div>
      </div>
    </main>
  );
}
