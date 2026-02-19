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
import { Field, FieldGroup } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

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

  function handleSubmit(e: React.FormEvent) {
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
              open the page and automatically apply to the job.
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
