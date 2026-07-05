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
import { Loader2 } from "lucide-react";
import {
  createCoverLetter,
  type CreateCoverLetterResponse,
} from "@/services/coverletter";
import { toast } from "@/hooks/toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/querykeyfactory";

interface CreateCoverLetterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (result: CreateCoverLetterResponse) => void;
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
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createCoverLetter,
    onSuccess: (result) => {
      toast.success("Cover letter generated");
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
    jobDescription.trim();

  function resetForm() {
    setCompanyName("");
    setJobTitle("");
    setUrl("");
    setJobDescription("");
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && isCreating) return;
    onOpenChange(nextOpen);
  }

  function handleSubmit() {
    if (!canSubmit || isCreating) return;
    createMutation.mutate({
      companyName: companyName.trim(),
      jobTitle: jobTitle.trim(),
      url: url.trim(),
      jobDescription: jobDescription.trim(),
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
            Tell us about the role and we&apos;ll write a cover letter using
            your active resume.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <Label htmlFor="cl-company">Company Name</Label>
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
            <Label htmlFor="cl-title">Job Title</Label>
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
            <Label htmlFor="cl-url">Job URL</Label>
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
            <Label htmlFor="cl-description">Job Description</Label>
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
                Generating your cover letter — this can take a minute or two.
                Keep this tab open.
              </FieldDescription>
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
