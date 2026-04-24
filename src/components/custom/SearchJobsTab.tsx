"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { countries } from "country-data-list";
import dayjs from "dayjs";
import { History, Loader2, Search } from "lucide-react";
import { useSearchParams } from "react-router";

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
  onApply,
}: {
  job: DiscoveredJob;
  applyingUrl: string | null;
  onApply: (url: string) => void;
}) {
  const pending = applyingUrl === job.url;
  const disabled = job.applied || pending;
  const openJobInNewTab = () => {
    window.open(job.url, "_blank", "noopener,noreferrer");
  };
  return (
    <div
      onClick={openJobInNewTab}
      className={cn(
        "group flex cursor-pointer flex-row items-start gap-3 border-b border-border py-4 last:border-b-0 hover:bg-muted/50",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="truncate font-semibold text-foreground transition-colors group-hover:text-purple-600">
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
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            onApply(job.url);
          }}
        >
          {job.applied ? "Applied" : pending ? (
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  // UI select value is always a string; "any" is our sentinel for "no cutoff".
  const [dateCutoff, setDateCutoff] = useState<string>("any");
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [jobs, setJobs] = useState<DiscoveredJob[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [applyingUrl, setApplyingUrl] = useState<string | null>(null);
  const didHydrateFromUrlRef = useRef(false);

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
        void queryClient.invalidateQueries({
          queryKey: queryKeys.jobSearch.history(),
        });
        toast.success(
          data.jobs.length === 0
            ? "No jobs matched"
            : `Found ${data.jobs.length} job(s)`,
        );
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Job search failed",
        );
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

      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3 text-sm font-medium">
          Results
        </div>
        <div className="px-4 pb-2">
          {jobs.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {isSearching
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
