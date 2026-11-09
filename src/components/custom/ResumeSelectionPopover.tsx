import { ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Resume } from "@/services/resume";

export function ResumeSelectionPopover({
  selectedCount,
  resumes,
  selectedResumeId,
  onResumeChange,
  isLoading,
  open,
  onOpenChange,
  onConfirm,
  triggerLabel,
  description,
  emptyMessage,
  confirmLabel,
}: {
  selectedCount: number;
  resumes: Resume[];
  selectedResumeId: string;
  onResumeChange: (id: string) => void;
  isLoading: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  triggerLabel: string;
  description: string;
  emptyMessage: string;
  confirmLabel: string;
}) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button type="button">
          {triggerLabel} ({selectedCount})
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" side="bottom" className="w-80">
        <div>
          <p className="font-medium">Choose a resume</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        {resumes.length === 0 ? (
          <p className="py-3 text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <RadioGroup value={selectedResumeId} onValueChange={onResumeChange}>
            {resumes.map((resume) => (
              <label
                key={resume.id}
                className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 hover:bg-muted/50"
              >
                <RadioGroupItem value={resume.id} />
                <span className="min-w-0 flex-1 truncate">
                  {resume.displayName || resume.fileName}
                </span>
                {resume.isActive ? (
                  <span className="text-xs text-muted-foreground">Active</span>
                ) : null}
              </label>
            ))}
          </RadioGroup>
        )}
        <Button
          type="button"
          className="w-full"
          disabled={!selectedResumeId || resumes.length === 0 || isLoading}
          onClick={onConfirm}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : confirmLabel}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
