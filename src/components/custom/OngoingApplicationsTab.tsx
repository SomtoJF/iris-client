import {
  fetchAllJobApplications,
  retryJobApplication,
  type JobApplication,
  type FetchAllJobApplicationsResponse,
} from "@/services/job";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  ExternalLink,
  Loader2,
  RotateCcw,
  Search,
  ShieldAlert,
} from "lucide-react";
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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/querykeyfactory";
import UserActionDialog from "./UserActionDialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

function buildColumns(
  selectedIds: Set<string>,
  retryingIds: Set<string>,
  onToggle: (id: string) => void,
  onRetry: (id: string) => void,
  onTakeAction: (id: string) => void,
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
        <div
          className={cn(
            "truncate text-black",
            row.original.jobTitle.toLowerCase().startsWith("pending") &&
              "bg-yellow-200",
          )}
          title={row.original.jobTitle}
        >
          {row.original.jobTitle}
        </div>
      ),
      shimmer: () => <Skeleton className="h-4 w-64" />,
      width: "300px",
    },
    {
      accessorKey: "companyName",
      header: "Company Name",
      cell: ({ row }) => (
        <div className="truncate text-black" title={row.original.companyName}>
          {row.original.companyName}
        </div>
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
        const failureReason =
          row.original.status === "failed" ? row.original.failureReason : null;
        return (
          <div className="flex items-center">
            {failureReason ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center cursor-pointer">
                    <AlertCircle className="w-3.5 h-3.5 mr-2 text-red-500" />
                    <p className={cn(textStyles)}>
                      {toTitleCase(row.original.status)}
                    </p>
                  </div>
                </TooltipTrigger>
                <TooltipContent sideOffset={6}>{failureReason}</TooltipContent>
              </Tooltip>
            ) : (
              <div className="flex items-center">
                <span className={cn("w-3 h-3 rounded-full mr-2", iconStyles)} />
                <p className={cn(textStyles)}>
                  {toTitleCase(row.original.status)}
                </p>
              </div>
            )}
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

            {row.original.status === "blocked" && (
              <button
                className="ml-2 text-xs items-center flex no-wrap text-blue-500 hover:text-blue-600 cursor-pointer disabled:opacity-50"
                disabled={isRetrying}
                onClick={() => onTakeAction(row.original.id)}
              >
                <ShieldAlert className="w-3 h-3 mr-1" />
                <span>Take Action</span>
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
          {dayjs(row.original.createdAt).fromNow()}
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set());
  const [actionDialogJobId, setActionDialogJobId] = useState<string | null>(
    null,
  );
  const { addEventListener } = useRealtimeEvents();
  const queryClient = useQueryClient();

  const queryKey = queryKeys.jobApplication.list({
    page: pageIndex + 1,
    limit: LIMIT,
    search: activeSearch || undefined,
  });

  const { data, isFetching } = useQuery({
    queryKey,
    queryFn: () =>
      fetchAllJobApplications(pageIndex + 1, LIMIT, activeSearch || undefined),
  });

  const jobApplications = data?.data ?? [];
  const total = data?.total ?? 0;

  useEffect(() => {
    const applicationSuccessHandler = addEventListener(
      "APPLICATION_SUCCESSFUL",
      (data) => {
        toast.success(
          `Successfully applied to ${data.jobTitle} at ${data.companyName}`,
        );
        queryClient.setQueriesData(
          { queryKey: queryKeys.jobApplication.lists() },
          (oldData: FetchAllJobApplicationsResponse | undefined) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              data: oldData.data.map((j) =>
                j.id === data.id ? { ...j, status: "applied" as const } : j,
              ),
            };
          },
        );
      },
    );

    const applicationFailedHandler = addEventListener(
      "APPLICATION_FAILED",
      (data) => {
        toast.error(
          `An application just failed for ${data.jobTitle} at ${data.companyName}`,
        );
        queryClient.setQueriesData(
          { queryKey: queryKeys.jobApplication.lists() },
          (oldData: FetchAllJobApplicationsResponse | undefined) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              data: oldData.data.map((j) =>
                j.id === data.id ? { ...j, status: "failed" as const } : j,
              ),
            };
          },
        );
      },
    );

    const userActionRequiredHandler = addEventListener(
      "USER_ACTION_REQUIRED",
      (data) => {
        toast.info(
          `Action required for ${data.job_title} at ${data.company_name}`,
        );
        queryClient.setQueriesData(
          { queryKey: queryKeys.jobApplication.lists() },
          (oldData: FetchAllJobApplicationsResponse | undefined) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              data: oldData.data.map((j) =>
                j.id === data.application_id
                  ? { ...j, status: "blocked" as const }
                  : j,
              ),
            };
          },
        );
        setActionDialogJobId(data.application_id);
      },
    );

    return () => {
      applicationSuccessHandler();
      applicationFailedHandler();
      userActionRequiredHandler();
    };
  }, [addEventListener, queryClient]);

  async function handleRetry(id: string) {
    setRetryingIds((prev) => new Set(prev).add(id));
    setSelectedIds((prev) => {
      const s = new Set(prev);
      s.delete(id);
      return s;
    });
    try {
      await retryJobApplication(id);
      queryClient.invalidateQueries({
        queryKey: queryKeys.jobApplication.lists(),
      });
    } catch {
      queryClient.invalidateQueries({
        queryKey: queryKeys.jobApplication.lists(),
      });
    } finally {
      setRetryingIds((prev) => {
        const s = new Set(prev);
        s.delete(id);
        return s;
      });
    }
  }

  function handleTakeAction(id: string) {
    setActionDialogJobId(id);
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
    handleTakeAction,
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
                  handleSearch();
                }
              }}
              className="w-full"
            />
            <Button
              size="sm"
              className="px-4 h-8"
              disabled={isFetching}
              onClick={handleSearch}
            >
              {isFetching ? (
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
      <UserActionDialog
        open={!!actionDialogJobId}
        onOpenChange={(o) => {
          if (!o) setActionDialogJobId(null);
        }}
        jobApplicationId={actionDialogJobId}
      />
    </div>
  );
}

function toTitleCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
