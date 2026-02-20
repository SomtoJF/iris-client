import { fetchAllJobApplications, type JobApplication } from "@/services/job";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, Loader2, CheckCircle2, X } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import type { LucideIcon } from "lucide-react";

dayjs.extend(relativeTime);

const LIMIT = 10;

type JobStatus = JobApplication["status"];

function getStatusTagConfig(status: JobStatus): {
  className: string;
  icon: LucideIcon;
} {
  switch (status) {
    case "applied":
      return {
        className:
          "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
        icon: CheckCircle2,
      };
    case "processing":
      return {
        className:
          "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
        icon: Loader2,
      };
    case "failed":
      return {
        className:
          "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
        icon: X,
      };
    default:
      return {
        className: "bg-muted text-muted-foreground border-border",
        icon: Loader2,
      };
  }
}

export default function OngoingApplicationsTab() {
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    handleFetchJobApplications();
  }, [page]);

  const handleFetchJobApplications = async () => {
    setIsLoading(true);
    try {
      const res = await fetchAllJobApplications(page, LIMIT);
      setJobApplications((prev) =>
        page === 1 ? res.data : [...prev, ...res.data],
      );
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMore = () => {
    setPage(page + 1);
  };

  if (isLoading) {
    return (
      <div className="w-full flex justify-center items-center h-full">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full pb-8">
      <div className="flex flex-col gap-4">
        {jobApplications.map((jobApplication) => (
          <div key={jobApplication.id} className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <a
                href={jobApplication.url}
                target="_blank"
                className="text-sm font-medium text-blue-500 hover:text-blue-600 cursor-pointer"
              >
                {jobApplication.url} <Link className="w-4 h-4 ml-2" />
              </a>
              {(() => {
                const { className, icon: Icon } = getStatusTagConfig(
                  jobApplication.status,
                );
                return (
                  <Badge variant="outline" className={className}>
                    <Icon
                      className={`w-3 h-3 ${jobApplication.status === "processing" ? "animate-spin" : ""}`}
                    />
                    <span className="capitalize">{jobApplication.status}</span>
                  </Badge>
                );
              })()}
            </div>
            <span className="text-sm text-gray-500">
              {dayjs(jobApplication.createdAt).fromNow()}
            </span>
          </div>
        ))}
      </div>
      <div className="flex justify-center mt-4">
        <Button onClick={handleLoadMore} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Load More"
          )}
        </Button>
      </div>
    </div>
  );
}
