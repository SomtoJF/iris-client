import { fetchAllJobApplications, type JobApplication } from "@/services/job";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";

const LIMIT = 10;

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
      setJobApplications((prev) => (page === 1 ? res.data : [...prev, ...res.data]));
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
    <div className="w-full">
      <div className="flex flex-col gap-4">
        {jobApplications.map((jobApplication) => (
          <div key={jobApplication.id}>{jobApplication.url}</div>
        ))}
      </div>
      <Button onClick={handleLoadMore}>Load More</Button>
    </div>
  );
}
