import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
// import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";
import { createIssue, type IssueType } from "@/services/issue";
import { fetchAllJobApplications, type JobApplication } from "@/services/job";
import { toast } from "@/hooks/toast";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ChevronDown } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/querykeyfactory";
import { cn } from "@/lib/utils";

import "@blocknote/core/fonts/inter.css";
import { en } from "@blocknote/core/locales";
import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import "@blocknote/shadcn/style.css";

const ISSUE_TYPES: { value: IssueType; label: string }[] = [
  { value: "bug", label: "Bug" },
  { value: "feature_request", label: "Feature request" },
];

export default function FeedbackNewIssuePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<IssueType>("bug");
  const [jobApplicationId, setJobApplicationId] = useState<string | undefined>(
    undefined,
  );
  const [jobApplicationLabel, setJobApplicationLabel] = useState<
    string | undefined
  >(undefined);

  const schema = useMemo(() => {
    const disallowedBlockTypes = new Set([
      "heading",
      "image",
      "video",
      "audio",
      "file",
    ]);

    const blockSpecs = Object.fromEntries(
      Object.entries(defaultBlockSpecs).filter(
        ([blockType]) => !disallowedBlockTypes.has(blockType),
      ),
    );

    return BlockNoteSchema.create({
      blockSpecs,
    });
  }, []);

  const editor = useCreateBlockNote({
    schema,
    dictionary: {
      ...en,
      placeholders: {
        ...en.placeholders,
        emptyDocument:
          "Include details, steps to reproduce, expected vs actual behavior…",
        default:
          "Include details, steps to reproduce, expected vs actual behavior…",
      },
    },
  });

  const onSubmit = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    try {
      setIsSubmitting(true);
      const contentJson = JSON.stringify(editor.document);
      const contentText = await editor.blocksToMarkdownLossy(editor.document);
      await createIssue({
        title: title.trim(),
        type,
        jobApplicationId,
        contentJson,
        contentText,
      });
      toast.success("Issue created");
      queryClient.invalidateQueries({ queryKey: queryKeys.issue.lists() });
      navigate("/feedback");
    } catch (e) {
      console.error(e);
      toast.error((e as Error)?.message ?? "Failed to create issue");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full px-8 py-8">
      <div className="max-w-4xl">
        <h1 className="text-2xl font-extrabold tracking-tight text-balance">
          Create new issue
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Ask a question, report a bug, or request a feature.
        </p>

        <div className="mt-6 rounded-lg border border-gray-200 bg-white">
          <div className="p-6">
            <div className="grid grid-cols-1 gap-5">
              <div className="grid gap-2">
                <Label htmlFor="issue-title">Title</Label>
                <Input
                  id="issue-title"
                  placeholder="e.g. Resume upload fails for PDF files"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="grid gap-2">
                  <Label>Type</Label>
                  <Select
                    value={type}
                    onValueChange={(v) => setType(v as IssueType)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ISSUE_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Link job application (optional)</Label>
                  <JobApplicationPicker
                    value={jobApplicationId}
                    label={jobApplicationLabel}
                    onPick={(ja) => {
                      setJobApplicationId(ja?.id);
                      setJobApplicationLabel(
                        ja ? `${ja.jobTitle} — ${ja.companyName}` : undefined,
                      );
                    }}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Description</Label>
                <div className="rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                  <BlockNoteView
                    editor={editor}
                    theme="light"
                    className={cn(
                      "min-h-[200px]",
                      "[&_.bn-editor]:min-h-[200px] [&_.bn-editor]:px-3 [&_.bn-editor]:py-2",
                    )}
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  This will be used to generate the one-line summary in the
                  feed.
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="p-6 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/feedback")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="button" onClick={onSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Creating…" : "Create issue"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function JobApplicationPicker({
  value,
  label,
  onPick,
}: {
  value?: string;
  label?: string;
  onPick: (next?: JobApplication) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<JobApplication[]>([]);

  const load = async (nextSearch: string) => {
    try {
      setIsLoading(true);
      const res = await fetchAllJobApplications(1, 20, nextSearch || undefined);
      setResults(res.data);
    } catch (e) {
      console.error(e);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  type JobStatus = JobApplication["status"];

  function getStatusTagConfig(status: JobStatus): {
    textStyles: string;
    iconStyles: string;
  } {
    switch (status) {
      case "applied":
        return {
          textStyles: "text-green-600",
          iconStyles: "bg-green-600 opacity-50",
        };
      case "processing":
        return {
          textStyles: "text-amber-500 animate-pulse",
          iconStyles: "bg-amber-500 animate-pulse opacity-50",
        };
      case "failed":
        return {
          textStyles: "text-red-500",
          iconStyles: "bg-red-500 opacity-50",
        };
      case "blocked":
        return {
          textStyles: "text-pink-500",
          iconStyles: "bg-pink-500 opacity-50",
        };
      default:
        return {
          textStyles: "text-muted-foreground",
          iconStyles: "bg-muted-foreground animate-pulse",
        };
    }
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) void load(search);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-between px-3 py-2 h-8 overflow-hidden",
            !value && "text-muted-foreground",
          )}
        >
          <span className="flex-1 min-w-0 truncate text-left">
            {label ?? "Select"}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="min-w-[--radix-popper-anchor-width] p-0">
        <Command className="w-full max-h-[260px]">
          <CommandList>
            <div className="sticky top-0 z-10 bg-popover">
              <CommandInput
                placeholder="Search job applications..."
                value={search}
                onValueChange={(v) => {
                  setSearch(v);
                  void load(v);
                }}
              />
            </div>
            <CommandEmpty>
              {isLoading ? "Loading…" : "No matches."}
            </CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="(none)"
                onSelect={() => {
                  onPick(undefined);
                  setOpen(false);
                }}
              >
                <span className="text-sm text-muted-foreground">(None)</span>
              </CommandItem>
              {results.map((ja) => {
                const { iconStyles, textStyles } = getStatusTagConfig(
                  ja.status,
                );

                return (
                  <CommandItem
                    key={ja.id}
                    value={`${ja.jobTitle} ${ja.companyName}`}
                    className="flex items-start gap-2"
                    onSelect={() => {
                      onPick(ja);
                      setOpen(false);
                    }}
                  >
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="truncate">{ja.jobTitle}</span>
                      <div className="flex gap-2">
                        <span className="text-sm text-gray-500 truncate">
                          {" "}
                          {ja.companyName}
                        </span>
                        <div className="flex items-center">
                          <span
                            className={cn(
                              "w-3 h-3 rounded-full mr-2",
                              iconStyles,
                            )}
                          />
                          <p className={cn(textStyles)}>
                            {toTitleCase(ja.status)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function toTitleCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
