"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { countries } from "country-data-list";
import dayjs from "dayjs";
import { History, Loader2, Search } from "lucide-react";

import { CountryDropdown } from "@/components/ui/country-dropdown";
import type { Country } from "@/components/ui/country-dropdown";
import { Button } from "@/components/ui/button";
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
import { toast } from "@/hooks/toast";
import { queryKeys } from "@/querykeyfactory";
import { applyToJob } from "@/services/job";
import {
  fetchJobSearchHistory,
  searchJobs,
  type DiscoveredJob,
  type JobSearchHistoryEntry,
} from "@/services/jobSearch";
import { cn } from "@/lib/utils";

const DATE_RANGE_OPTIONS = [
  { value: "1d", label: "Past 24 hours" },
  { value: "w", label: "Past week" },
  { value: "m", label: "Past month" },
  { value: "y", label: "Past year" },
] as const;

function normalizeDateCutoff(code: string): string {
  const n = code.trim().toLowerCase();
  if (["1d", "d", "day"].includes(n)) return "1d";
  if (["w", "week", "7d"].includes(n)) return "w";
  if (["m", "month", "30d"].includes(n)) return "m";
  if (["y", "year"].includes(n)) return "y";
  return DATE_RANGE_OPTIONS.some((o) => o.value === n) ? n : "1d";
}

function dateCutoffLabel(code: string): string {
  const map: Record<string, string> = {
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
  onApply,
}: {
  job: DiscoveredJob;
  applyingUrl: string | null;
  onApply: (url: string) => void;
}) {
  const pending = applyingUrl === job.url;
  return (
    <div
      className={cn(
        "flex flex-row items-start gap-3 border-b border-border py-4 last:border-b-0",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="truncate font-semibold text-foreground">
            {job.title}
          </span>
          {job.datePosted ? (
            <span className="shrink-0 text-xs text-muted-foreground">
              {job.datePosted}
            </span>
          ) : null}
        </div>
        <p className="mt-1 truncate text-sm text-foreground">
          {job.companyName}
        </p>
      </div>
      <div className="shrink-0 pt-0.5">
        <Button
          type="button"
          size="sm"
          disabled={pending}
          onClick={() => onApply(job.url)}
        >
          {pending ? (
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

export default function SearchJobsTab() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [dateCutoff, setDateCutoff] = useState<string>("1d");
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [jobs, setJobs] = useState<DiscoveredJob[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [applyingUrl, setApplyingUrl] = useState<string | null>(null);

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

  const searchMutation = useMutation({
    mutationFn: searchJobs,
    onSuccess: (data) => {
      setJobs(data.jobs);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.jobSearch.history(),
      });
      toast.success(
        data.jobs.length === 0
          ? "No jobs matched"
          : `Found ${data.jobs.length} job(s)`,
      );
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Job search failed");
    },
  });

  const locationAlpha2 = selectedCountry?.alpha2 ?? "NG";

  const handleSearch = () => {
    const q = searchQuery.trim();
    if (!q) {
      toast.error("Enter a search query");
      return;
    }
    searchMutation.mutate({
      searchQuery: q,
      location: locationAlpha2,
      dateCutoff,
    });
  };

  const handleApply = async (url: string) => {
    setApplyingUrl(url);
    try {
      await applyToJob({ jobUrl: url });
      toast.success("Application started");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to apply");
    } finally {
      setApplyingUrl(null);
    }
  };

  const handleUseSearch = (entry: JobSearchHistoryEntry) => {
    setSearchQuery(entry.searchQuery);
    setDateCutoff(normalizeDateCutoff(entry.dateCutoff));
    const match = countries.all.find(
      (c) => c.alpha2?.toUpperCase() === entry.location.toUpperCase(),
    ) as Country | undefined;
    if (match) {
      setSelectedCountry(match);
    } else {
      setSelectedCountry(null);
      toast.info("Location was not recognized; pick a country from the list.");
    }
    setHistoryOpen(false);
  };

  return (
    <div className="flex w-full flex-col gap-6 ">
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
                defaultValue="NGA"
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
              disabled={searchMutation.isPending}
              className="h-8"
            >
              {searchMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Search className="h-4 w-4" aria-hidden />
              )}
              <span className="ml-2">Search</span>
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

      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3 text-sm font-medium">
          Results
        </div>
        <div className="px-4 pb-2">
          {jobs.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {searchMutation.isPending
                ? "Searching…"
                : "Run a search to see jobs here."}
            </p>
          ) : (
            jobs.map((job) => (
              <JobResultRow
                key={job.url}
                job={job}
                applyingUrl={applyingUrl}
                onApply={handleApply}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
