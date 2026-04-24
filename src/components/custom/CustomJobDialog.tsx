import { useMemo, useState } from "react";
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
import { AlertTriangle, Loader2 } from "lucide-react";

/** Returns a user-facing message when the URL must not be used, or null if allowed. */
function blockedCustomJobUrlMessage(urlString: string): string | null {
  const trimmed = urlString.trim();
  if (!trimmed) return null;
  let host: string;
  try {
    host = new URL(trimmed).hostname.toLowerCase();
  } catch {
    return null;
  }
  if (host === "linkedin.com" || host.endsWith(".linkedin.com")) {
    return "LinkedIn job URLs are not supported. Try looking up the job on another site.";
  }
  if (host === "indeed.com" || host.endsWith(".indeed.com")) {
    return "Indeed job URLs are not supported. Try looking up the job on another site.";
  }
  if (
    host === "seek.com.au" ||
    host.endsWith(".seek.com.au") ||
    host === "seek.au" ||
    host.endsWith(".seek.au")
  ) {
    return "SEEK Australia job URLs are not supported. Try looking up the job on another site.";
  }
  return null;
}

interface CustomJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { jobUrl: string }) => void;
  isLoading: boolean;
}
export default function CustomJobDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: CustomJobDialogProps) {
  const [jobUrl, setJobUrl] = useState("");
  const blockedMessage = useMemo(
    () => blockedCustomJobUrlMessage(jobUrl),
    [jobUrl],
  );

  function handleSubmit() {
    if (blockedMessage) return;
    onSubmit({ jobUrl });
    setJobUrl("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Apply to job</DialogTitle>
            <DialogDescription>
              Enter the job posting URL to start your application. We&apos;ll
              handle the rest.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <Label htmlFor="job-url">Job URL</Label>
              <Input
                id="job-url"
                name="jobUrl"
                type="url"
                placeholder="https://..."
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                required
              />
              <FieldDescription className="flex items-center gap-1.5 text-xs text-yellow-700">
                <AlertTriangle
                  className="mt-0.5 size-3.5 shrink-0"
                  aria-hidden
                />
                <span>
                  Make sure the job URL leads to the job description page.
                </span>
              </FieldDescription>
              {blockedMessage ? (
                <p className="text-xs text-destructive" role="alert">
                  {blockedMessage}
                </p>
              ) : null}
            </Field>
          </FieldGroup>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              className="hover:opacity-80 cursor-pointer"
              disabled={!jobUrl.trim() || isLoading || Boolean(blockedMessage)}
              onClick={handleSubmit}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Apply"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </div>
    </Dialog>
  );
}
