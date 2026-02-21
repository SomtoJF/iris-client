import CustomJobDialog from "@/components/custom/CustomJobDialog";
import ResumeUploadDialog from "@/components/custom/ResumeUploadDialog";
import { Button } from "@/components/ui/button";
import { applyToJob, type jobApplicationSchema } from "@/services/job";
import { Send, Upload } from "lucide-react";
import { useState } from "react";
import z from "zod";
import { toast } from "@/hooks/toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SearchJobsTab from "@/components/custom/SearchJobsTab";
import OngoingApplicationsTab from "@/components/custom/OngoingApplicationsTab";
import { useSearchParams } from "react-router";

const TAB_VALUES = ["search-jobs", "ongoing-applications"] as const;
type TabValue = (typeof TAB_VALUES)[number];

function tabFromSearchParams(searchParams: URLSearchParams): TabValue {
  const tab = searchParams.get("tab");
  return TAB_VALUES.includes(tab as TabValue)
    ? (tab as TabValue)
    : "search-jobs";
}

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = tabFromSearchParams(searchParams);
  const [isCustomJobDialogOpen, setIsCustomJobDialogOpen] = useState(false);
  const [isResumeUploadDialogOpen, setIsResumeUploadDialogOpen] =
    useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };
  const handleCustomJobDialogOpenChange = (open: boolean) => {
    setIsCustomJobDialogOpen(open);
  };
  const handleCustomJobDialogSubmit = async (
    data: z.infer<typeof jobApplicationSchema>,
  ) => {
    try {
      setIsLoading(true);
      await applyToJob(data);
      toast.success("Job application initiated");
    } catch (error) {
      console.error(error);
      toast.error("Failed to apply to job");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResumeUploadSubmit = (file: File) => {
    // Template handler - will implement upload logic later
    console.log("Resume upload:", file);
  };
  return (
    <>
      <div className="bg-gray-50 text-gray-800 w-full px-10 py-10">
        <header>
          <h1 className="scroll-m-20 text-2xl font-extrabold tracking-tight text-balance">
            Apply To Custom Job
          </h1>
          <p className="text-sm text-gray-600">
            Upload your resume and automate your job applications.
          </p>
          <div className="flex gap-2 mt-4">
            <Button
              onClick={() => setIsResumeUploadDialogOpen(true)}
              className="hover:opacity-80 cursor-pointer"
            >
              <Upload className="w-4 h-4 mr-1" />
              Upload Resume
            </Button>
            <Button
              onClick={() => setIsCustomJobDialogOpen(true)}
              className="hover:opacity-80 cursor-pointer"
            >
              <Send className="w-4 h-4 mr-1" />
              Apply to Custom Job
            </Button>
          </div>
        </header>
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full mt-5"
        >
          <TabsList
            variant="line"
            className="bg-transparent rounded-none p-0 border-b border-gray-200 h-auto gap-0"
          >
            <TabsTrigger
              value="search-jobs"
              className="rounded-none border-0 bg-transparent px-4 py-2 shadow-none data-active:bg-transparent data-active:shadow-none focus-visible:ring-0 focus-visible:outline-none after:hidden data-active:border-b-2 data-active:border-b-purple-500 data-active:border-t-0 data-active:-mb-px text-gray-600 data-active:text-gray-900 data-active:font-medium"
            >
              Search Jobs
            </TabsTrigger>
            <TabsTrigger
              value="ongoing-applications"
              className="rounded-none border-0 bg-transparent px-4 py-2 shadow-none data-active:bg-transparent data-active:shadow-none focus-visible:ring-0 focus-visible:outline-none after:hidden data-active:border-b-2 data-active:border-b-purple-500 data-active:border-t-0 data-active:-mb-px text-gray-600 data-active:text-gray-900 data-active:font-medium"
            >
              Ongoing Applications
            </TabsTrigger>
          </TabsList>
          <TabsContent value="search-jobs">
            <SearchJobsTab />
          </TabsContent>

          <TabsContent value="ongoing-applications">
            <OngoingApplicationsTab />
          </TabsContent>
        </Tabs>
      </div>
      <CustomJobDialog
        open={isCustomJobDialogOpen}
        onOpenChange={handleCustomJobDialogOpenChange}
        onSubmit={handleCustomJobDialogSubmit}
        isLoading={isLoading}
      />
      <ResumeUploadDialog
        open={isResumeUploadDialogOpen}
        onOpenChange={setIsResumeUploadDialogOpen}
        onSubmit={handleResumeUploadSubmit}
      />
    </>
  );
}
