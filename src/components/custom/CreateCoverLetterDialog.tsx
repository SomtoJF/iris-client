import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  createCoverLetter,
  type CreateCoverLetterResponse,
} from "@/services/coverletter";
import { fetchResumes } from "@/services/resume";
import { toast } from "@/hooks/toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/querykeyfactory";

interface CreateCoverLetterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (result: CreateCoverLetterResponse) => void;
}

function RequiredMark() {
  return <span className="text-red-500">*</span>;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function CreateCoverLetterDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateCoverLetterDialogProps) {
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [url, setUrl] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  // null = no explicit user pick yet; falls back to the active/first resume below.
  const [pickedResumeId, setPickedResumeId] = useState<string | null>(null);
  const [resumesOpen, setResumesOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: resumes = [] } = useQuery({
    queryKey: queryKeys.resume.all,
    queryFn: fetchResumes,
    enabled: open,
  });

  // Effective selection: the user's explicit pick, else the active resume, else the first.
  const selectedResumeId =
    pickedResumeId ??
    resumes.find((r) => r.isActive)?.id ??
    resumes[0]?.id ??
    null;

  const createMutation = useMutation({
    mutationFn: createCoverLetter,
    onSuccess: (result) => {
      toast.success("Cover letter generation started");
      queryClient.invalidateQueries({
        queryKey: queryKeys.coverLetter.lists(),
      });
      resetForm();
      onOpenChange(false);
      onCreated(result);
    },
    onError: (err: unknown) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to create cover letter",
      );
      queryClient.invalidateQueries({
        queryKey: queryKeys.coverLetter.lists(),
      });
    },
  });
  const isCreating = createMutation.isPending;

  const canSubmit =
    companyName.trim() &&
    jobTitle.trim() &&
    url.trim() &&
    jobDescription.trim() &&
    !!selectedResumeId;

  const selectedResume = resumes.find((r) => r.id === selectedResumeId);

  function resetForm() {
    setCompanyName("");
    setJobTitle("");
    setUrl("");
    setJobDescription("");
    setPickedResumeId(null);
    setResumesOpen(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && isCreating) return;
    onOpenChange(nextOpen);
  }

  function handleSubmit() {
    if (!canSubmit || isCreating || !selectedResumeId) return;
    createMutation.mutate({
      companyName: companyName.trim(),
      jobTitle: jobTitle.trim(),
      url: url.trim(),
      jobDescription: jobDescription.trim(),
      resumeId: selectedResumeId,
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-lg max-h-[85vh] overflow-y-auto"
        onInteractOutside={(e) => {
          if (isCreating) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (isCreating) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>New Cover Letter</DialogTitle>
          <DialogDescription>
            Tell us about the role and pick the resume to use.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <Label htmlFor="cl-company">
              Company Name <RequiredMark />
            </Label>
            <Input
              id="cl-company"
              placeholder="Acme Inc."
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={isCreating}
              required
            />
          </Field>
          <Field>
            <Label htmlFor="cl-title">
              Job Title <RequiredMark />
            </Label>
            <Input
              id="cl-title"
              placeholder="Senior Software Engineer"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              disabled={isCreating}
              required
            />
          </Field>
          <Field>
            <Label htmlFor="cl-url">
              Job URL <RequiredMark />
            </Label>
            <Input
              id="cl-url"
              type="url"
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isCreating}
              required
            />
          </Field>
          <Field>
            <Label htmlFor="cl-description">
              Job Description <RequiredMark />
            </Label>
            <Textarea
              id="cl-description"
              placeholder="Paste the job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              disabled={isCreating}
              className="min-h-40 max-h-52"
              required
            />
            {isCreating && (
              <FieldDescription className="text-xs text-amber-700">
                Starting generation — this runs in the background and can take a
                minute or two. You'll be notified when it's ready.
              </FieldDescription>
            )}
          </Field>
          <Field>
            <button
              type="button"
              className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900 cursor-pointer disabled:opacity-50"
              onClick={() => setResumesOpen((v) => !v)}
              disabled={isCreating}
            >
              {resumesOpen ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              Resume <RequiredMark />
              {selectedResume && (
                <span className="text-gray-500 font-normal ml-1 truncate">
                  — {selectedResume.fileName}
                </span>
              )}
            </button>

            {resumesOpen && (
              <div className="max-h-60 overflow-y-auto pl-5">
                {resumes.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No resumes uploaded yet
                  </p>
                ) : (
                  <RadioGroup
                    value={selectedResumeId ?? undefined}
                    onValueChange={setPickedResumeId}
                    disabled={isCreating}
                    className="gap-2"
                  >
                    {resumes.map((resume) => {
                      const isSelected = resume.id === selectedResumeId;
                      return (
                        <Label
                          key={resume.id}
                          htmlFor={`resume-${resume.id}`}
                          className={`flex w-full items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? "ring-2 ring-purple-500 bg-purple-50"
                              : "bg-gray-50 hover:bg-gray-100"
                          }`}
                        >
                          <RadioGroupItem
                            id={`resume-${resume.id}`}
                            value={resume.id}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium truncate">
                                {resume.fileName}
                              </p>
                              {resume.isActive && (
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded shrink-0">
                                  Active
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(resume.fileSize)}
                            </p>
                          </div>
                        </Label>
                      );
                    })}
                  </RadioGroup>
                )}
              </div>
            )}
          </Field>
        </FieldGroup>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isCreating}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="submit"
            className="hover:opacity-80 cursor-pointer"
            disabled={!canSubmit || isCreating}
            onClick={handleSubmit}
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
                Generating...
              </>
            ) : (
              "Generate"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
