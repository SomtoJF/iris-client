import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  Loader2,
  RefreshCcw,
} from "lucide-react";
import {
  fetchCoverLetter,
  regenerateCoverLetter,
  type CoverLetterDetail,
} from "@/services/coverletter";
import { toast } from "@/hooks/toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/querykeyfactory";
import { useState } from "react";

interface CoverLetterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobApplicationId: string | null;
}

export default function CoverLetterDialog({
  open,
  onOpenChange,
  jobApplicationId,
}: CoverLetterDialogProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editInstructions, setEditInstructions] = useState("");
  const [ultraWrite, setUltraWrite] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<CoverLetterDetail>({
    queryKey: queryKeys.coverLetter.detail(jobApplicationId ?? ""),
    queryFn: () => fetchCoverLetter(jobApplicationId!),
    enabled: open && !!jobApplicationId,
  });

  const regenerateMutation = useMutation({
    mutationFn: regenerateCoverLetter,
    onSuccess: (result) => {
      // Regeneration runs in the background; the letter arrives via a realtime
      // event. Flip the detail to processing and close the dialog.
      queryClient.setQueryData(
        queryKeys.coverLetter.detail(result.jobApplicationId),
        (old: CoverLetterDetail | undefined) =>
          old ? { ...old, status: "processing" as const } : old,
      );
      queryClient.invalidateQueries({
        queryKey: queryKeys.coverLetter.lists(),
      });
      toast.success("Regeneration started");
      setIsEditorOpen(false);
      setEditInstructions("");
      setUltraWrite(false);
      onOpenChange(false);
    },
    onError: (err: unknown) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to regenerate cover letter",
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.coverLetter.lists() });
    },
  });
  const isRegenerating = regenerateMutation.isPending;

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && isRegenerating) return;
    if (!nextOpen) {
      setIsEditorOpen(false);
      setEditInstructions("");
      setUltraWrite(false);
    }
    onOpenChange(nextOpen);
  }

  function handleRegenerate() {
    if (!jobApplicationId) return;
    regenerateMutation.mutate({
      jobApplicationId,
      editInstructions: editInstructions.trim() || undefined,
      ultraWrite,
    });
  }

  async function handleCopy() {
    if (!data?.coverLetter) return;
    try {
      await navigator.clipboard.writeText(data.coverLetter);
      toast.success("Cover letter copied to clipboard");
    } catch {
      toast.error("Failed to copy cover letter");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-3xl max-h-[85vh] overflow-y-auto"
        onInteractOutside={(e) => {
          if (isRegenerating) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (isRegenerating) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {data ? `${data.jobTitle} @ ${data.companyName}` : "Cover Letter"}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <span>Your generated cover letter for this role.</span>
            {data?.url && (
              <a
                href={data.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 inline-flex items-center gap-1"
              >
                Job posting <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-40 w-full" />
          </div>
        )}

        {error && (
          <p className="text-sm text-red-500">Failed to load cover letter.</p>
        )}

        {data && (
          <div className="space-y-4">
            {data.coverLetter ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-700">
                    Cover Letter
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopy}
                    disabled={isRegenerating}
                  >
                    <Copy className="w-3.5 h-3.5 mr-1" /> Copy
                  </Button>
                </div>
                <div className="relative">
                  <div className="p-3 border rounded-lg bg-gray-50 text-sm text-gray-800 whitespace-pre-wrap max-h-[50vh] overflow-y-auto">
                    {data.coverLetter}
                  </div>
                  {isRegenerating && (
                    <div className="absolute inset-0 bg-white/70 rounded-lg flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                      <p className="text-sm text-gray-600">
                        Regenerating — this can take a minute or two...
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                {data.status === "processing"
                  ? "This cover letter is still being generated. Check back shortly."
                  : "No cover letter was generated for this application."}
              </p>
            )}

            {data.coverLetter && (
              <div className="space-y-3">
                <button
                  className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900 cursor-pointer disabled:opacity-50"
                  onClick={() => setIsEditorOpen((v) => !v)}
                  disabled={isRegenerating}
                >
                  {isEditorOpen ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  Request edits
                </button>

                {isEditorOpen && (
                  <div className="space-y-3 pl-5">
                    <Textarea
                      placeholder="Describe the changes you'd like, e.g. make it shorter, emphasize my leadership experience..."
                      value={editInstructions}
                      onChange={(e) => setEditInstructions(e.target.value)}
                      disabled={isRegenerating}
                      className="min-h-24"
                    />
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="ultra-write"
                        checked={ultraWrite}
                        onCheckedChange={(checked) =>
                          setUltraWrite(checked === true)
                        }
                        disabled={isRegenerating}
                      />
                      <Label
                        htmlFor="ultra-write"
                        className="text-sm text-gray-700 cursor-pointer"
                      >
                        UltraWrite — full re-analysis rewrite (slower, more
                        thorough)
                      </Label>
                    </div>
                    <Button
                      size="sm"
                      onClick={handleRegenerate}
                      disabled={isRegenerating}
                    >
                      {isRegenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-1" />
                          Regenerating...
                        </>
                      ) : (
                        <>
                          <RefreshCcw className="w-4 h-4 mr-1" /> Regenerate
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
