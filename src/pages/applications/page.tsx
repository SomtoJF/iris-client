import CustomJobDialog from "@/components/custom/CustomJobDialog";
import OngoingApplicationsTab from "@/components/custom/OngoingApplicationsTab";
import CoverLettersTab from "@/components/custom/CoverLettersTab";
import { Button } from "@/components/ui/button";
import { applyToJob, type jobApplicationSchema } from "@/services/job";
import { usePageTitle } from "@/hooks/page-title";
import { useSearchParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/querykeyfactory";
import { useState } from "react";
import { Send } from "lucide-react";
import { toast } from "@/hooks/toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import z from "zod";

const TAB_VALUES = ["ongoing-applications", "cover-letters"] as const;
type TabValue = (typeof TAB_VALUES)[number];

function tabFromSearchParams(params: URLSearchParams): TabValue {
  const tab = params.get("tab");
  return TAB_VALUES.includes(tab as TabValue)
    ? (tab as TabValue)
    : "ongoing-applications";
}

export default function ApplicationsPage() {
  usePageTitle("Applications");
  const [searchParams, setSearchParams] = useSearchParams();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  async function handleSubmit(data: z.infer<typeof jobApplicationSchema>) {
    try {
      setIsLoading(true);
      await applyToJob(data);
      toast.success("Job application initiated");
      queryClient.invalidateQueries({
        queryKey: queryKeys.jobApplication.lists(),
      });
      setIsDialogOpen(false);
    } catch (error: unknown) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to apply to job",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <main className="min-h-[calc(100vh-3rem)] w-full bg-gray-50 px-6 py-8 text-gray-800 md:px-10 md:py-10">
        <div className="mx-auto w-full max-w-5xl">
          <header className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">
                Applications
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage your applications and cover letters.
              </p>
            </div>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="cursor-pointer hover:opacity-80"
            >
              <Send className="mr-1 h-4 w-4" />
              Apply to Custom Job
            </Button>
          </header>
          <Tabs
            value={tabFromSearchParams(searchParams)}
            onValueChange={(value) => setSearchParams({ tab: value })}
            className="mt-6 w-full"
          >
            <TabsList
              variant="line"
              className="h-auto gap-0 rounded-none bg-transparent p-0"
            >
              <TabsTrigger
                value="ongoing-applications"
                className="rounded-none border-0 bg-transparent px-4 py-2 text-gray-600 shadow-none data-active:border-b-2 data-active:border-b-purple-500 data-active:bg-transparent data-active:font-medium data-active:text-gray-900 data-active:shadow-none"
              >
                My Applications
              </TabsTrigger>
              <TabsTrigger
                value="cover-letters"
                className="rounded-none border-0 bg-transparent px-4 py-2 text-gray-600 shadow-none data-active:border-b-2 data-active:border-b-purple-500 data-active:bg-transparent data-active:font-medium data-active:text-gray-900 data-active:shadow-none"
              >
                Cover Letters
              </TabsTrigger>
            </TabsList>
            <TabsContent value="ongoing-applications">
              <OngoingApplicationsTab />
            </TabsContent>
            <TabsContent value="cover-letters">
              <CoverLettersTab />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <CustomJobDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </>
  );
}
