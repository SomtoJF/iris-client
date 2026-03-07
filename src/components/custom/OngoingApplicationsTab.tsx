import {
  fetchAllJobApplications,
  retryJobApplication,
  type JobApplication,
} from "@/services/job";
import { useState, useEffect, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Loader2, RotateCcw, Search } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import type { ColumnDef } from "@tanstack/react-table";
import { GenerativeGrid, type TableConfig } from "./GenerativeGrid";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useRealtimeEvents } from "@/context/RealTimeEventContext";
import { toast } from "@/hooks/toast";

dayjs.extend(relativeTime);

const LIMIT = 10;

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
    default:
      return {
        textStyles: "text-muted-foreground",
        iconStyles: "bg-muted-foreground animate-pulse",
      };
  }
}

function buildColumns(
  selectedIds: Set<string>,
  retryingIds: Set<string>,
  onToggle: (id: string) => void,
  onRetry: (id: string) => void,
): (ColumnDef<JobApplication, any> & {
  shimmer?: () => React.ReactNode;
  width?: string;
})[] {
  return [
    {
      id: "select",
      header: () => null,
      cell: ({ row }) => {
        const isFailed = row.original.status === "failed";
        return (
          <Checkbox
            checked={selectedIds.has(row.original.id)}
            disabled={!isFailed}
            onCheckedChange={() => onToggle(row.original.id)}
            aria-label="Select row"
          />
        );
      },
      shimmer: () => <Skeleton className="h-4 w-4" />,
      width: "40px",
    },
    {
      accessorKey: "jobTitle",
      header: "Job Title",
      cell: ({ row }) => (
        <span
          className={cn(
            "truncate text-black",
            row.original.jobTitle.toLowerCase().startsWith("pending") &&
              "bg-yellow-200",
          )}
        >
          {row.original.jobTitle}
        </span>
      ),
      shimmer: () => <Skeleton className="h-4 w-64" />,
      width: "300px",
    },
    {
      accessorKey: "companyName",
      header: "Company Name",
      cell: ({ row }) => (
        <span className="truncate text-black">{row.original.companyName}</span>
      ),
      shimmer: () => <Skeleton className="h-4 w-64" />,
      width: "200px",
    },
    {
      accessorKey: "url",
      header: "Link",
      cell: ({ row }) => (
        <a
          href={row.original.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-blue-500 hover:text-blue-600 cursor-pointer flex items-center gap-2 max-w-full"
        >
          <span className="truncate">External Link</span>
          <ExternalLink className="w-4 h-4 flex-shrink-0" />
        </a>
      ),
      shimmer: () => <Skeleton className="h-4 w-64" />,
      width: "200px",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const { iconStyles, textStyles } = getStatusTagConfig(
          row.original.status,
        );
        const isRetrying = retryingIds.has(row.original.id);
        return (
          <div className="flex items-center">
            <div className="flex items-center">
              <span className={cn("w-3 h-3 rounded-full mr-2", iconStyles)} />
              <p className={cn(textStyles)}>
                {toTitleCase(row.original.status)}
              </p>
            </div>
            {row.original.status === "failed" && (
              <button
                className="ml-2 text-xs items-center flex no-wrap text-blue-500 hover:text-blue-600 cursor-pointer disabled:opacity-50"
                disabled={isRetrying}
                onClick={() => onRetry(row.original.id)}
              >
                <RotateCcw
                  className={cn("w-3 h-3 mr-1", isRetrying && "animate-spin")}
                />
                <span>{isRetrying ? "Retrying..." : "Retry"}</span>
              </button>
            )}
          </div>
        );
      },
      shimmer: () => <Skeleton className="h-6 w-24" />,
      width: "200px",
    },
    {
      accessorKey: "createdAt",
      header: "Date Applied",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {dayjs(row.original.updatedAt).fromNow()}
        </span>
      ),
      shimmer: () => <Skeleton className="h-4 w-20" />,
      width: "120px",
    },
  ];
}

export default function OngoingApplicationsTab() {
  const [pageIndex, setPageIndex] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set());
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([]);
  const [total, setTotal] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
  const { addEventListener } = useRealtimeEvents();

  useEffect(() => {
    const applicationSuccessHandler = addEventListener(
      "APPLICATION_SUCCESSFUL",
      (data) => {
        toast.success(
          `Successfully applied to ${data.jobTitle} at ${data.companyName}`,
        );
        setJobApplications((prev) =>
          prev.map((j) =>
            j.id === data.id ? { ...j, status: "applied" as const } : j,
          ),
        );
      },
    );

    const applicationFailedHandler = addEventListener(
      "APPLICATION_FAILED",
      (data) => {
        toast.error(
          `An application just failed for ${data.jobTitle} at ${data.companyName}`,
        );
        setJobApplications((prev) =>
          prev.map((j) =>
            j.id === data.id ? { ...j, status: "failed" as const } : j,
          ),
        );
      },
    );

    return () => {
      applicationSuccessHandler();
      applicationFailedHandler();
    };
  }, [addEventListener]);

  const loadApplications = useCallback(async () => {
    setIsFetching(true);
    try {
      const res = await fetchAllJobApplications(
        pageIndex + 1,
        LIMIT,
        activeSearch || undefined,
      );
      setJobApplications(res.data);
      setTotal(res.total);
    } finally {
      setIsFetching(false);
      setIsSearching(false);
    }
  }, [pageIndex, activeSearch]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  async function handleRetry(id: string) {
    setRetryingIds((prev) => new Set(prev).add(id));
    setJobApplications((prev) =>
      prev.map((j) =>
        j.id === id ? { ...j, status: "processing" as const } : j,
      ),
    );
    setSelectedIds((prev) => {
      const s = new Set(prev);
      s.delete(id);
      return s;
    });
    try {
      await retryJobApplication(id);
    } catch {
      setJobApplications((prev) =>
        prev.map((j) =>
          j.id === id ? { ...j, status: "failed" as const } : j,
        ),
      );
    } finally {
      setRetryingIds((prev) => {
        const s = new Set(prev);
        s.delete(id);
        return s;
      });
    }
  }

  function handleSearch() {
    setActiveSearch(searchInput);
    setPageIndex(0);
  }

  async function handleRetryAll() {
    const ids = [...selectedIds];
    setSelectedIds(new Set());
    await Promise.all(ids.map((id) => handleRetry(id)));
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  }

  const columns = buildColumns(
    selectedIds,
    retryingIds,
    toggleSelect,
    handleRetry,
  );

  const tableConfig: TableConfig<JobApplication> = {
    columns,
    data: jobApplications,
    pagination: {
      pageIndex,
      pageSize: LIMIT,
      total,
      onPageChange: setPageIndex,
    },
    loading: isFetching,
  };

  return (
    <div className="w-full pb-8 space-y-3">
      <div className="w-full mt-2">
        {selectedIds.size > 0 ? (
          <Button onClick={handleRetryAll} size="sm">
            <RotateCcw className="w-4 h-4 mr-2" />
            Retry All ({selectedIds.size})
          </Button>
        ) : (
          <div className="w-full flex items-center gap-4">
            <Input
              placeholder="Search by job title or company..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setIsSearching(true);
                  handleSearch();
                }
              }}
              className="w-full"
            />
            <Button
              size="sm"
              className="px-4 h-8"
              disabled={isSearching}
              onClick={() => {
                setIsSearching(true);
                handleSearch();
              }}
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="ml-1">Searching...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" /> Search
                </>
              )}
            </Button>
          </div>
        )}
      </div>
      <GenerativeGrid config={tableConfig} />
    </div>
  );
}

function toTitleCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
