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
import { AlertTriangle, Loader2 } from "lucide-react";

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

  function handleSubmit(_e: React.FormEvent) {
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
              disabled={!jobUrl || isLoading}
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
