import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router";
import { usePageTitle } from "@/hooks/page-title";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { X } from "lucide-react";
import { queryKeys } from "@/querykeyfactory";
import {
  fetchCostTracking,
  searchCostEntities,
  type CostTrackingRecord,
} from "@/services/cost";
import {
  GenerativeGrid,
  type TableConfig,
  type TableColumnDef,
} from "@/components/custom/GenerativeGrid";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";

dayjs.extend(relativeTime);

const LIMIT = 10;

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function formatCost(cost: number): string {
  return `$${cost.toFixed(6)}`;
}

function buildColumns(
  onFilterUser: (id: string) => void,
  onFilterJob: (id: string) => void,
): TableColumnDef<CostTrackingRecord, any>[] {
  return [
    {
      id: "user",
      header: "User",
      cell: ({ row }) => (
        <div className="flex flex-col min-w-0">
          <button
            className="truncate text-black font-medium text-left hover:underline cursor-pointer"
            onClick={() => onFilterUser(row.original.user.id)}
          >
            {row.original.user.name}
          </button>
          <span className="truncate text-xs text-muted-foreground">
            {row.original.user.email}
          </span>
        </div>
      ),
      shimmer: () => (
        <div className="space-y-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-40" />
        </div>
      ),
      width: "200px",
    },
    {
      id: "job",
      header: "Job",
      cell: ({ row }) => {
        const job = row.original.job_application;
        if (!job) return <span className="text-muted-foreground">—</span>;
        return (
          <div className="flex flex-col min-w-0">
            <button
              className="truncate text-black font-medium text-left hover:underline cursor-pointer"
              onClick={() => onFilterJob(job.id)}
            >
              {job.title}
            </button>
            <span className="truncate text-xs text-muted-foreground">
              {job.company_name}
            </span>
          </div>
        );
      },
      shimmer: () => (
        <div className="space-y-1">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-28" />
        </div>
      ),
      width: "220px",
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => <Badge variant="secondary">{row.original.type}</Badge>,
      shimmer: () => <Skeleton className="h-5 w-20" />,
      width: "120px",
    },
    {
      accessorKey: "model",
      header: "Model",
      cell: ({ row }) => (
        <span
          className="truncate text-black text-sm"
          title={row.original.model}
        >
          {row.original.model || "—"}
        </span>
      ),
      shimmer: () => <Skeleton className="h-4 w-28" />,
      width: "150px",
    },
    {
      accessorKey: "total_cost",
      header: "Cost",
      cell: ({ row }) => (
        <span className="text-black text-sm font-mono">
          {formatCost(row.original.total_cost)}
        </span>
      ),
      shimmer: () => <Skeleton className="h-4 w-20" />,
      width: "110px",
    },
    {
      accessorKey: "created_at",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {dayjs(row.original.created_at).fromNow()}
        </span>
      ),
      shimmer: () => <Skeleton className="h-4 w-20" />,
      width: "120px",
    },
  ];
}

export default function AdminPage() {
  usePageTitle("Admin");
  const [searchParams, setSearchParams] = useSearchParams();
  const [pageIndex, setPageIndex] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const userId = searchParams.get("user_id") || undefined;
  const jobApplicationId = searchParams.get("job_application_id") || undefined;
  const hasFilter = !!userId || !!jobApplicationId;

  const debouncedQuery = useDebounce(searchInput, 300);

  // Reset page when filters change
  useEffect(() => {
    setPageIndex(0);
  }, [userId, jobApplicationId]);

  const { data, isFetching } = useQuery({
    queryKey: queryKeys.cost.list({
      page: pageIndex + 1,
      limit: LIMIT,
      userId,
      jobApplicationId,
    }),
    queryFn: () =>
      fetchCostTracking(pageIndex + 1, LIMIT, userId, jobApplicationId),
  });

  const { data: searchResults } = useQuery({
    queryKey: queryKeys.cost.search(debouncedQuery),
    queryFn: () => searchCostEntities(debouncedQuery),
    enabled: debouncedQuery.length > 0,
  });

  const hasSearchResults =
    searchResults &&
    (searchResults.users.length > 0 ||
      searchResults.job_applications.length > 0);

  const handleFilterUser = useCallback(
    (id: string) => {
      setSearchParams({ user_id: id });
      setSearchInput("");
      setPopoverOpen(false);
    },
    [setSearchParams],
  );

  const handleFilterJob = useCallback(
    (id: string) => {
      setSearchParams({ job_application_id: id });
      setSearchInput("");
      setPopoverOpen(false);
    },
    [setSearchParams],
  );

  function clearFilter() {
    setSearchParams({});
  }

  const records = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalAccumulatedCost = data?.total_accumulated_cost ?? 0;

  const columns = buildColumns(handleFilterUser, handleFilterJob);

  const tableConfig: TableConfig<CostTrackingRecord> = {
    columns,
    data: records,
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
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-black">Cost Tracking</h2>
        <span className="text-sm text-muted-foreground">
          Total:{" "}
          <span className="font-mono font-medium text-black">
            {formatCost(totalAccumulatedCost)}
          </span>
        </span>
      </div>

      <Popover open={popoverOpen && !!hasSearchResults}>
        <PopoverAnchor asChild>
          <Input
            ref={inputRef}
            placeholder="Search users, jobs, companies..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onFocus={() => setPopoverOpen(true)}
            onBlur={() => {
              // Delay to allow click on popover items
              setTimeout(() => setPopoverOpen(false), 200);
            }}
            className="w-full"
          />
        </PopoverAnchor>
        <PopoverContent
          align="start"
          className="w-(--radix-popover-trigger-width) p-0"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="max-h-64 overflow-y-auto">
            {searchResults && searchResults.users.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground bg-gray-100">
                  Users
                </div>
                {searchResults.users.map((u) => (
                  <button
                    key={u.id}
                    className="w-full px-3 py-2 text-left hover:bg-muted cursor-pointer flex flex-col"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleFilterUser(u.id)}
                  >
                    <span className="text-sm text-black truncate">
                      {u.name}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {u.email}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {searchResults && searchResults.job_applications.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground bg-gray-100">
                  Job Applications
                </div>
                {searchResults.job_applications.map((j) => (
                  <button
                    key={j.id}
                    className="w-full px-3 py-2 text-left hover:bg-muted cursor-pointer flex flex-col"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleFilterJob(j.id)}
                  >
                    <span className="text-sm text-black truncate">
                      {j.title}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {j.company_name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {hasFilter && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Filtered by:</span>
          {userId && (
            <Badge
              variant="secondary"
              className="gap-1 bg-purple-100 text-purple-600"
            >
              User
              <button onClick={clearFilter} className="cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {jobApplicationId && (
            <Badge
              variant="secondary"
              className="gap-1 bg-purple-100 text-purple-600"
            >
              Job Application
              <button onClick={clearFilter} className="cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      <GenerativeGrid config={tableConfig} />
    </div>
  );
}
