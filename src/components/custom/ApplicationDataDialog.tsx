import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, FileText } from "lucide-react";
import {
  fetchJobApplicationData,
  type JobApplicationDataResponse,
} from "@/services/job";
import { getResumeDownloadUrl } from "@/services/resume";
import { toast } from "@/hooks/toast";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface ApplicationDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobApplicationId: string | null;
}

export default function ApplicationDataDialog({
  open,
  onOpenChange,
  jobApplicationId,
}: ApplicationDataDialogProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const { data, isLoading, error } = useQuery<JobApplicationDataResponse>({
    queryKey: ["job-application-data", jobApplicationId],
    queryFn: () => fetchJobApplicationData(jobApplicationId!),
    enabled: open && !!jobApplicationId,
  });

  async function handleDownloadResume() {
    if (!data?.resume) return;
    try {
      setIsDownloading(true);
      const url = await getResumeDownloadUrl(data.resume.id);
      const link = document.createElement("a");
      link.href = url;
      link.download = data.resume.fileName;
      link.click();
    } catch {
      toast.error("Failed to download resume");
    } finally {
      setIsDownloading(false);
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Application Data</DialogTitle>
          <DialogDescription>
            Questions, answers, and documents submitted with this application.
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <p className="text-sm text-red-500">
            Failed to load application data.
          </p>
        )}

        {data && (
          <div className="space-y-6">
            {/* Questions & Answers */}
            {data.questions.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700">
                  Questions
                </h3>
                {data.questions.map((q, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">
                        {q.question}
                      </p>
                      {q.is_optional && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                          Optional
                        </span>
                      )}
                    </div>
                    <div className="p-3 border rounded-lg bg-gray-50 text-sm text-gray-800 whitespace-pre-wrap">
                      {q.answer || (
                        <span className="text-gray-400 italic">No answer</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Cover Letter */}
            {data.cover_letter && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-700">
                  Cover Letter
                </h3>
                <div className="p-3 border rounded-lg bg-gray-50 text-sm text-gray-800 whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {data.cover_letter}
                </div>
              </div>
            )}

            {/* Resume */}
            {data.resume && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-700">Resume</h3>
                <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">
                        {data.resume.fileName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(data.resume.fileSize)}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="icon-sm"
                    variant="outline"
                    disabled={isDownloading}
                    onClick={handleDownloadResume}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
