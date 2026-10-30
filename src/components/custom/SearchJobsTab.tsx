"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { countries } from "country-data-list";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { ChevronDown, History, Loader2, Search } from "lucide-react";
import { useSearchParams } from "react-router";

import { CountryDropdown } from "@/components/ui/country-dropdown";
import type { Country } from "@/components/ui/country-dropdown";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/toast";
import { queryKeys } from "@/querykeyfactory";
import { applyToJob } from "@/services/job";
import { fetchResumes, type Resume } from "@/services/resume";
import {
  fetchJobSearchHistory,
  searchJobs,
  type DiscoveredJob,
  type JobSearchHistoryEntry,
} from "@/services/jobSearch";
import { cn } from "@/lib/utils";

dayjs.extend(relativeTime);

const DATE_RANGE_OPTIONS = [
  { value: "any", label: "Any time" },
  { value: "1d", label: "Past 24 hours" },
  { value: "w", label: "Past week" },
  { value: "m", label: "Past month" },
  { value: "y", label: "Past year" },
] as const;

function normalizeDateCutoff(code: string | null | undefined): string {
  if (code == null) return "any";
  const n = code.trim().toLowerCase();
  if (["any", "all", "anytime"].includes(n)) return "any";
  if (["1d", "d", "day"].includes(n)) return "1d";
  if (["w", "week", "7d"].includes(n)) return "w";
  if (["m", "month", "30d"].includes(n)) return "m";
  if (["y", "year"].includes(n)) return "y";
  return DATE_RANGE_OPTIONS.some((o) => o.value === n) ? n : "any";
}

function dateCutoffLabel(code: string | null | undefined): string {
  if (code == null) return "Any time";
  const map: Record<string, string> = {
    "": "Any time",
    any: "Any time",
    all: "Any time",
    anytime: "Any time",
    "1d": "Past 24 hours",
    d: "Past 24 hours",
    day: "Past 24 hours",
    w: "Past week",
    week: "Past week",
    "7d": "Past week",
    m: "Past month",
    month: "Past month",
    "30d": "Past month",
    y: "Past year",
    year: "Past year",
  };
  return map[code] ?? code;
}

function countryNameFromAlpha2(alpha2: string): string {
  const c = countries.all.find(
    (x) => x.alpha2?.toUpperCase() === alpha2.toUpperCase(),
  );
  return c?.name ?? alpha2;
}

function JobResultRow({
  job,
  applyingUrl,
  selected,
  onToggleSelected,
  onApply,
}: {
  job: DiscoveredJob;
  applyingUrl: string | null;
  selected: boolean;
  onToggleSelected: (url: string) => void;
  onApply: (url: string) => void;
}) {
  const pending = applyingUrl === job.url;
  const disabled = job.applied || pending;

  const datePostedLabel = useMemo(() => {
    if (!job.datePosted) return null;
    const d = dayjs(job.datePosted);
    if (!d.isValid()) return job.datePosted;
    return d.fromNow();
  }, [job.datePosted]);

  return (
    <div
      className={cn(
        "group relative flex flex-row items-start gap-3 border-b border-border py-4 last:border-b-0 hover:bg-muted/50",
      )}
    >
      <a
        href={job.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${job.title} at ${job.companyName}`}
        className="absolute inset-0"
      />
      <div className="relative z-10 shrink-0 pt-1">
        <Checkbox
          aria-label={`Select ${job.title} at ${job.companyName}`}
          checked={selected}
          onCheckedChange={() => onToggleSelected(job.url)}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="truncate font-semibold text-foreground transition-colors group-hover:text-purple-600">
            {job.title}
          </span>
          {datePostedLabel ? (
            <span className="shrink-0 text-sm text-muted-foreground">
              {datePostedLabel}
            </span>
          ) : null}
        </div>
        <p className="mt-1 truncate text-sm text-foreground">
          {job.companyName}
        </p>
      </div>

      <div className="relative z-10 shrink-0 pt-0.5">
        <Button
          type="button"
          size="sm"
          disabled={disabled}
          onClick={() => onApply(job.url)}
        >
          {job.applied ? (
            "Applied"
          ) : pending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            "Apply now"
          )}
        </Button>
      </div>
    </div>
  );
}

function HistoryEntryRow({
  entry,
  onUseSearch,
}: {
  entry: JobSearchHistoryEntry;
  onUseSearch: (entry: JobSearchHistoryEntry) => void;
}) {
  return (
    <div className="flex flex-row items-start gap-3 border-b border-border py-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="truncate font-semibold text-foreground">
            {entry.searchQuery}
          </span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {dayjs(entry.requestedAt).format("MMM D, YYYY h:mm A")}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {countryNameFromAlpha2(entry.location)} ·{" "}
          {dateCutoffLabel(entry.dateCutoff)}
        </p>
      </div>
      <div className="shrink-0 pt-0.5">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => onUseSearch(entry)}
        >
          Use search
        </Button>
      </div>
    </div>
  );
}

function BulkApplyPopover({
  selectedCount,
  resumes,
  selectedResumeId,
  onResumeChange,
  isApplying,
  open,
  onOpenChange,
  onConfirm,
}: {
  selectedCount: number;
  resumes: Resume[];
  selectedResumeId: string;
  onResumeChange: (id: string) => void;
  isApplying: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button type="button">
          Apply to ({selectedCount}) jobs{" "}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" side="bottom" className="w-80">
        <div>
          <p className="font-medium">Choose a resume</p>
          <p className="text-xs text-muted-foreground">
            Use this resume for the selected jobs.
          </p>
        </div>
        {resumes.length === 0 ? (
          <p className="py-3 text-sm text-muted-foreground">
            Upload a resume before applying.
          </p>
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
          disabled={!selectedResumeId || resumes.length === 0 || isApplying}
          onClick={onConfirm}
        >
          {isApplying ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            "Confirm application"
          )}
        </Button>
      </PopoverContent>
    </Popover>
  );
}

export default function SearchJobsTab() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  // UI select value is always a string; "any" is our sentinel for "no cutoff".
  const [dateCutoff, setDateCutoff] = useState<string>("any");
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [jobs, setJobs] = useState<DiscoveredJob[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [applyingUrl, setApplyingUrl] = useState<string | null>(null);
  const [selectedJobUrls, setSelectedJobUrls] = useState<Set<string>>(
    () => new Set(),
  );
  const [applyPopoverOpen, setApplyPopoverOpen] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [isBulkApplying, setIsBulkApplying] = useState(false);
  const didHydrateFromUrlRef = useRef(false);
  const didAutoSearchFromHistoryRef = useRef(false);

  const nigeriaCountry = useMemo(() => {
    const c = countries.all.find((x) => x.alpha3 === "NGA");
    return c as Country | undefined;
  }, []);

  useEffect(() => {
    if (nigeriaCountry) {
      setSelectedCountry((prev) => prev ?? nigeriaCountry);
    }
  }, [nigeriaCountry]);

  const { data: historyEntries = [] } = useQuery({
    queryKey: queryKeys.jobSearch.history(),
    queryFn: fetchJobSearchHistory,
  });

  const { data: resumes = [] } = useQuery<Resume[]>({
    queryKey: queryKeys.resume.all,
    queryFn: fetchResumes,
  });

  useEffect(() => {
    if (
      selectedResumeId &&
      resumes.some((resume) => resume.id === selectedResumeId)
    ) {
      return;
    }
    const defaultResume =
      resumes.find((resume) => resume.isActive) ?? resumes[0];
    setSelectedResumeId(defaultResume?.id ?? "");
  }, [resumes, selectedResumeId]);

  const runSearch = useCallback(
    async (args: {
      searchQuery: string;
      location: string;
      dateCutoff: string | null;
    }) => {
      setIsSearching(true);
      try {
        const data = await searchJobs(args);
        setJobs(data.jobs);
        setSelectedJobUrls(new Set());
        setApplyPopoverOpen(false);
        void queryClient.invalidateQueries({
          queryKey: queryKeys.jobSearch.history(),
        });
        toast.success(
          data.jobs.length === 0
            ? "No jobs matched"
            : `Found ${data.jobs.length} job(s)`,
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Job search failed");
      } finally {
        setIsSearching(false);
      }
    },
    [queryClient],
  );

  const locationAlpha2 = selectedCountry?.alpha2 ?? "NG";

  const setSearchUrlParams = useCallback(
    (args: {
      searchQuery: string;
      locationAlpha2: string;
      dateCutoff: string;
    }) => {
      const next = new URLSearchParams(searchParams);
      next.set("q", args.searchQuery);
      next.set("loc", args.locationAlpha2.toUpperCase());
      next.set("date", normalizeDateCutoff(args.dateCutoff));
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const applyHistoryEntry = useCallback(
    (entry: JobSearchHistoryEntry, opts?: { closePopover?: boolean }) => {
      setSearchQuery(entry.searchQuery);
      setDateCutoff(normalizeDateCutoff(entry.dateCutoff));
      const match = countries.all.find(
        (c) => c.alpha2?.toUpperCase() === entry.location.toUpperCase(),
      ) as Country | undefined;
      if (match) {
        setSelectedCountry(match);
      } else {
        setSelectedCountry(null);
        toast.info(
          "Location was not recognized; pick a country from the list.",
        );
      }
      if (opts?.closePopover) setHistoryOpen(false);

      const normalizedDate = normalizeDateCutoff(entry.dateCutoff);
      const locAlpha2 = match?.alpha2 ?? entry.location ?? "NG";
      setSearchUrlParams({
        searchQuery: entry.searchQuery,
        locationAlpha2: locAlpha2,
        dateCutoff: normalizedDate,
      });
      void runSearch({
        searchQuery: entry.searchQuery,
        location: locAlpha2,
        dateCutoff: normalizedDate === "any" ? null : normalizedDate,
      });
    },
    [runSearch, setSearchUrlParams],
  );

  useEffect(() => {
    if (didHydrateFromUrlRef.current) return;
    didHydrateFromUrlRef.current = true;

    const qParam = searchParams.get("q")?.trim() ?? "";
    const locParam = searchParams.get("loc")?.trim() ?? "";
    const dateParam = normalizeDateCutoff(searchParams.get("date"));

    const nextQuery = qParam;
    const nextDateCutoff = dateParam;

    let nextSelectedCountry: Country | null = null;
    if (locParam) {
      const match = countries.all.find(
        (c) => c.alpha2?.toUpperCase() === locParam.toUpperCase(),
      ) as Country | undefined;
      nextSelectedCountry = match ?? null;
    }

    if (nextQuery) setSearchQuery(nextQuery);
    setDateCutoff(nextDateCutoff);
    if (nextSelectedCountry) setSelectedCountry(nextSelectedCountry);

    if (nextQuery) {
      const loc = nextSelectedCountry?.alpha2 ?? "NG";
      const next = new URLSearchParams(searchParams);
      next.set("q", nextQuery);
      next.set("loc", loc.toUpperCase());
      next.set("date", nextDateCutoff);
      setSearchParams(next, { replace: true });

      void runSearch({
        searchQuery: nextQuery,
        location: loc,
        dateCutoff: nextDateCutoff === "any" ? null : nextDateCutoff,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (didAutoSearchFromHistoryRef.current) return;
    // If URL hydration already ran a query this mount, history must not override.
    if (!didHydrateFromUrlRef.current) return;
    const qParam = searchParams.get("q")?.trim() ?? "";
    if (qParam) return;
    if (historyEntries.length === 0) return;

    didAutoSearchFromHistoryRef.current = true;
    applyHistoryEntry(historyEntries[0]);
  }, [applyHistoryEntry, historyEntries, searchParams]);

  const handleSearch = () => {
    const q = searchQuery.trim();
    if (!q) {
      toast.error("Enter a search query");
      return;
    }
    setSearchUrlParams({
      searchQuery: q,
      locationAlpha2,
      dateCutoff,
    });
    void runSearch({
      searchQuery: q,
      location: locationAlpha2,
      dateCutoff: dateCutoff === "any" ? null : dateCutoff,
    });
  };

  const handleApply = async (url: string) => {
    setApplyingUrl(url);
    try {
      await applyToJob({ jobUrl: url });
      toast.success("Application started");
      setJobs((prev) =>
        prev.map((j) => (j.url === url ? { ...j, applied: true } : j)),
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to apply");
    } finally {
      setApplyingUrl(null);
    }
  };

  const selectedJobs = jobs.filter((job) => selectedJobUrls.has(job.url));
  const allJobsSelected =
    jobs.length > 0 && selectedJobUrls.size === jobs.length;

  const toggleJobSelection = (url: string) => {
    setSelectedJobUrls((current) => {
      const next = new Set(current);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  };

  const toggleAllJobs = () => {
    const shouldClear = selectedJobUrls.size > 0;
    setSelectedJobUrls(
      shouldClear ? new Set() : new Set(jobs.map((job) => job.url)),
    );
    if (shouldClear) setApplyPopoverOpen(false);
  };

  const confirmBulkApply = async () => {
    if (!selectedResumeId || selectedJobs.length === 0 || isBulkApplying)
      return;

    setIsBulkApplying(true);
    try {
      const results = await Promise.all(
        selectedJobs.map(async (job) => {
          try {
            await applyToJob({ jobUrl: job.url, resumeId: selectedResumeId });
            return { url: job.url, success: true };
          } catch {
            return { url: job.url, success: false };
          }
        }),
      );
      const successfulUrls = new Set(
        results.filter((result) => result.success).map((result) => result.url),
      );
      const failedCount = results.length - successfulUrls.size;

      setJobs((current) =>
        current.map((job) =>
          successfulUrls.has(job.url) ? { ...job, applied: true } : job,
        ),
      );
      setSelectedJobUrls(new Set());
      setApplyPopoverOpen(false);

      if (failedCount > 0) {
        toast.error(
          `${successfulUrls.size} application(s) started; ${failedCount} failed`,
        );
      } else {
        toast.success(`${successfulUrls.size} application(s) started`);
      }
    } finally {
      setIsBulkApplying(false);
    }
  };

  const handleUseSearch = (entry: JobSearchHistoryEntry) => {
    applyHistoryEntry(entry, { closePopover: true });
  };

  return (
    <div className="flex w-full flex-col gap-6 ">
      <div className="min-h-[6.5rem] md:min-h-[4.5rem]">
        {selectedJobUrls.size > 0 ? (
          <div className="flex min-h-[6.5rem] items-center md:min-h-[4.5rem]">
            <BulkApplyPopover
              selectedCount={selectedJobUrls.size}
              resumes={resumes}
              selectedResumeId={selectedResumeId}
              onResumeChange={setSelectedResumeId}
              isApplying={isBulkApplying}
              open={applyPopoverOpen}
              onOpenChange={setApplyPopoverOpen}
              onConfirm={() => void confirmBulkApply()}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 md:flex-row md:flex-nowrap sm:flex-wrap sm:items-end justify-between items-center">
              <div className="flex flex-row gap-3 justify-between w-full flex-3/4">
                <div className="min-w-0 flex-1 w-[70%]">
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Search
                  </label>
                  <Input
                    placeholder="Job title, keywords, stack…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSearch();
                    }}
                  />
                </div>
                <div className="w">
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Date range
                  </label>
                  <Select value={dateCutoff} onValueChange={setDateCutoff}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Date range" />
                    </SelectTrigger>
                    <SelectContent>
                      {DATE_RANGE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="min-w-0 ">
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Location
                  </label>
                  <CountryDropdown
                    defaultValue={selectedCountry?.alpha3 ?? "NGA"}
                    onChange={setSelectedCountry}
                    placeholder="Select location"
                    slim
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 flex-1/4 justify-end">
                <Button
                  type="button"
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="h-8"
                >
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Search className="h-4 w-4" aria-hidden />
                  )}
                  <span className="ml-0.5">Search</span>
                </Button>
                <Popover open={historyOpen} onOpenChange={setHistoryOpen}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" className="h-8">
                      <History className="h-4 w-4" aria-hidden />
                      <span className="">History</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[min(100vw-2rem,28rem)] p-0"
                    align="center"
                  >
                    <div className="border-b border-border px-3 py-2 text-sm font-medium">
                      Recent searches
                    </div>
                    <div className="max-h-80 overflow-y-auto px-2 pb-2">
                      {historyEntries.length === 0 ? (
                        <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                          No history yet. Run a search to see it here.
                        </p>
                      ) : (
                        historyEntries.map((entry, i) => (
                          <HistoryEntryRow
                            key={`${entry.requestedAt}-${i}`}
                            entry={entry}
                            onUseSearch={handleUseSearch}
                          />
                        ))
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 text-sm font-medium">
          <div className="flex min-w-0 items-center gap-2">
            <Checkbox
              aria-label={
                allJobsSelected ? "Cancel selection" : "Select all jobs"
              }
              checked={
                allJobsSelected
                  ? true
                  : selectedJobUrls.size > 0
                    ? "indeterminate"
                    : false
              }
              onCheckedChange={toggleAllJobs}
            />
            <span className="truncate">
              {searchQuery.trim() ? `${searchQuery.trim()} jobs` : "Jobs"}
            </span>
            {selectedJobUrls.size > 0 ? (
              <span className="shrink-0 text-xs font-normal text-muted-foreground">
                {selectedJobUrls.size} selected
              </span>
            ) : null}
          </div>
        </div>
        <div className="px-4 pb-2">
          {jobs.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {isSearching ? "Searching…" : "Run a search to see jobs here."}
            </p>
          ) : (
            jobs.map((job) => (
              <JobResultRow
                key={job.url}
                job={job}
                applyingUrl={applyingUrl}
                selected={selectedJobUrls.has(job.url)}
                onToggleSelected={toggleJobSelection}
                onApply={handleApply}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
