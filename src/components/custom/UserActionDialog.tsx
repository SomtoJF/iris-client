import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  fetchUserAction,
  sendWorkflowSignal,
  type UserActionLayoutItem,
  type UserActionResultItem,
} from "@/services/job";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/toast";
import { queryKeys } from "@/querykeyfactory";

interface UserActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobApplicationId: string | null;
}

function renderField(
  item: UserActionLayoutItem,
  value: string,
  onChange: (val: string) => void,
) {
  const component = item.component ?? "input";

  switch (component) {
    case "textarea":
      return (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={item.field_name}
        />
      );
    case "select":
      return (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="w-full">
            <SelectValue
              className="truncate"
              placeholder={`Select ${item.field_name}`}
            />
          </SelectTrigger>
          <SelectContent>
            {item.options?.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case "radio":
      return (
        <RadioGroup value={value} onValueChange={onChange}>
          {item.options?.map((opt) => {
            const id = `${item.field_name}-${opt}`;
            return (
              <div key={opt} className="flex items-center gap-2">
                <RadioGroupItem id={id} value={opt} />
                <Label htmlFor={id}>{opt}</Label>
              </div>
            );
          })}
        </RadioGroup>
      );
    default:
      return (
        <Input
          type={item.type ?? "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={item.field_name}
        />
      );
  }
}

export default function UserActionDialog({
  open,
  onOpenChange,
  jobApplicationId,
}: UserActionDialogProps) {
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const { data: userAction, isFetching } = useQuery({
    queryKey: ["user-action", jobApplicationId],
    queryFn: () => fetchUserAction(jobApplicationId!),
    enabled: open && !!jobApplicationId,
  });

  function updateField(fieldName: string, value: string) {
    setFormValues((prev) => ({ ...prev, [fieldName]: value }));
  }

  async function handleSubmit() {
    if (!userAction) return;

    const payload: UserActionResultItem[] = userAction.layout.map((item) => ({
      field_name: item.field_name,
      value: formValues[item.field_name] ?? "",
    }));

    setSubmitting(true);
    try {
      await sendWorkflowSignal(
        userAction.workflow_id,
        userAction.signal_name,
        payload,
      );
      toast.success("Action submitted");
      queryClient.invalidateQueries({
        queryKey: queryKeys.jobApplication.lists(),
      });
      setFormValues({});
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to submit action",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl w-fit">
        <DialogHeader>
          <DialogTitle>Action Required</DialogTitle>
          {userAction && (
            <DialogDescription className="text-wrap">
              <p>{userAction.action_details}</p>
            </DialogDescription>
          )}
        </DialogHeader>

        {isFetching ? (
          <div className="space-y-4 py-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : userAction ? (
          <div className="space-y-4 py-2">
            {userAction.layout.map((item) => (
              <div key={item.field_name} className="space-y-1.5">
                <Label>{item.field_name}</Label>
                {renderField(item, formValues[item.field_name] ?? "", (val) =>
                  updateField(item.field_name, val),
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-4">
            No pending action found.
          </p>
        )}

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !userAction || isFetching}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              "Submit"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
