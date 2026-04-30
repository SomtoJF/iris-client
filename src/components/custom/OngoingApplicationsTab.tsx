import {
  fetchAllJobApplications,
  retryJobApplication,
  cancelJobApplication,
  deleteJobApplication,
  type JobApplication,
  type FetchAllJobApplicationsResponse,
} from "@/services/job";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  ExternalLink,
  Eye,
  Loader2,
  RotateCcw,
  Search,
  ShieldAlert,
  Trash2,
  XCircle,
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
import ApplicationDataDialog from "./ApplicationDataDialog";
import CancelApplicationDialog from "./CancelApplicationDialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

dayjs.extend(relativeTime);

const LIMIT = 10;

type JobStatus = JobApplication["status"];

function isSelectableStatus(status: JobStatus): boolean {
  return status === "failed" || status === "cancelled";
}

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
    case "cancelled":
      return {
        textStyles: "text-slate-400",
        iconStyles: "bg-slate-400 opacity-50",
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
  onViewApplicationData: (id: string) => void,
  onCancelApplication: (id: string) => void,
): (ColumnDef<JobApplication, unknown> & {
  shimmer?: () => React.ReactNode;
  width?: string;
})[] {
  return [
    {
      id: "select",
      header: () => null,
      cell: ({ row }) => {
        const isSelectable = isSelectableStatus(row.original.status);
        return (
          <Checkbox
            checked={selectedIds.has(row.original.id)}
            disabled={!isSelectable}
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
        const cancellationReason =
          row.original.status === "cancelled"
            ? row.original.cancellationReason
            : null;

        const hasFailureTooltip =
          row.original.status === "failed" && !!failureReason;
        const hasCancellationTooltip =
          row.original.status === "cancelled" && !!cancellationReason;
        const displayTooltip = hasFailureTooltip || hasCancellationTooltip;
        return (
          <div className="flex items-center">
            {displayTooltip ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center cursor-pointer">
                    {hasFailureTooltip ? (
                      <AlertCircle
                        className={cn("w-3.5 h-3.5 mr-2 text-red-500")}
                      />
                    ) : (
                      <span
                        className={cn("w-3 h-3 rounded-full mr-2", iconStyles)}
                      />
                    )}
                    <p className={cn(textStyles)}>
                      {toTitleCase(row.original.status)}
                    </p>
                  </div>
                </TooltipTrigger>
                <TooltipContent sideOffset={6}>
                  {failureReason || cancellationReason}
                </TooltipContent>
              </Tooltip>
            ) : (
              <div className="flex items-center">
                <span className={cn("w-3 h-3 rounded-full mr-2", iconStyles)} />
                <p className={cn(textStyles)}>
                  {toTitleCase(row.original.status)}
                </p>
              </div>
            )}
            {row.original.status === "applied" &&
              row.original.hasApplicationData && (
                <button
                  className="ml-2 text-xs items-center flex no-wrap text-blue-500 hover:text-blue-600 cursor-pointer disabled:opacity-50"
                  disabled={isRetrying}
                  onClick={() => onViewApplicationData(row.original.id)}
                >
                  <Eye className="w-3 h-3 mr-1" />
                  <span>View Data</span>
                </button>
              )}

            {row.original.status === "processing" && (
              <button
                className="ml-2 text-xs items-center flex no-wrap text-red-500 hover:text-red-600 cursor-pointer disabled:opacity-50"
                disabled={isRetrying}
                onClick={() => onCancelApplication(row.original.id)}
              >
                <XCircle className="w-3 h-3 mr-1" />
                <span>Cancel</span>
              </button>
            )}

            {isSelectableStatus(row.original.status) && (
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
  const [viewDataJobId, setViewDataJobId] = useState<string | null>(null);
  const [cancelDialogJobId, setCancelDialogJobId] = useState<string | null>(
    null,
  );
  const [isCancelling, setIsCancelling] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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

    const applicationCancelledHandler = addEventListener(
      "APPLICATION_CANCELLED",
      (data) => {
        toast.info(
          `Application for ${data.jobTitle} at ${data.companyName} was cancelled`,
        );
        queryClient.setQueriesData(
          { queryKey: queryKeys.jobApplication.lists() },
          (oldData: FetchAllJobApplicationsResponse | undefined) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              data: oldData.data.map((j) =>
                j.id === data.id ? { ...j, status: "cancelled" as const } : j,
              ),
            };
          },
        );
      },
    );

    return () => {
      applicationSuccessHandler();
      applicationFailedHandler();
      userActionRequiredHandler();
      applicationCancelledHandler();
    };
  }, [addEventListener, queryClient]);

  function removeSelectedIds(ids: string[]) {
    const idSet = new Set(ids);
    setSelectedIds((prev) => {
      const s = new Set(prev);
      idSet.forEach((id) => s.delete(id));
      return s;
    });
  }

  function markApplicationsAsProcessing(ids: string[]) {
    const idSet = new Set(ids);
    queryClient.setQueriesData(
      { queryKey: queryKeys.jobApplication.lists() },
      (oldData: FetchAllJobApplicationsResponse | undefined) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          data: oldData.data.map((job) =>
            idSet.has(job.id)
              ? {
                  ...job,
                  status: "processing" as const,
                  failureReason: undefined,
                  cancellationReason: undefined,
                }
              : job,
          ),
        };
      },
    );
  }

  function removeApplicationsFromCache(ids: string[]) {
    const idSet = new Set(ids);
    queryClient.setQueriesData(
      { queryKey: queryKeys.jobApplication.lists() },
      (oldData: FetchAllJobApplicationsResponse | undefined) => {
        if (!oldData) return oldData;

        const data = oldData.data.filter((job) => !idSet.has(job.id));
        const removedCount = oldData.data.length - data.length;
        return {
          ...oldData,
          data,
          total: Math.max(0, oldData.total - removedCount),
        };
      },
    );
  }

  async function retryApplications(ids: string[]) {
    const uniqueIds = [...new Set(ids)];
    if (uniqueIds.length === 0) return;

    setRetryingIds((prev) => {
      const s = new Set(prev);
      uniqueIds.forEach((id) => s.add(id));
      return s;
    });

    const results = await Promise.allSettled(
      uniqueIds.map((id) => retryJobApplication(id)),
    );
    const succeededIds = uniqueIds.filter(
      (_, index) => results[index].status === "fulfilled",
    );
    const failedCount = uniqueIds.length - succeededIds.length;

    if (succeededIds.length > 0) {
      markApplicationsAsProcessing(succeededIds);
      removeSelectedIds(succeededIds);
    }

    if (failedCount > 0) {
      toast.error(
        failedCount === 1
          ? "Failed to retry 1 application"
          : `Failed to retry ${failedCount} applications`,
      );
      queryClient.invalidateQueries({
        queryKey: queryKeys.jobApplication.lists(),
      });
    }

    setRetryingIds((prev) => {
      const s = new Set(prev);
      uniqueIds.forEach((id) => s.delete(id));
      return s;
    });
  }

  async function handleRetry(id: string) {
    await retryApplications([id]);
  }

  function handleTakeAction(id: string) {
    setActionDialogJobId(id);
  }

  function handleViewApplicationData(id: string) {
    setViewDataJobId(id);
  }

  function handleCancelApplication(id: string) {
    setCancelDialogJobId(id);
  }

  async function handleConfirmCancel(reason: string) {
    if (!cancelDialogJobId) return;
    setIsCancelling(true);
    try {
      await cancelJobApplication(cancelDialogJobId, reason || undefined);
      toast.success("Application cancellation initiated");
      queryClient.invalidateQueries({
        queryKey: queryKeys.jobApplication.lists(),
      });
    } catch {
      toast.error("Failed to cancel application");
    } finally {
      setIsCancelling(false);
      setCancelDialogJobId(null);
    }
  }

  function handleSearch() {
    setActiveSearch(searchInput);
    setPageIndex(0);
  }

  async function handleRetryAll() {
    await retryApplications([...selectedIds]);
  }

  async function handleConfirmDeleteSelected() {
    const ids = [...selectedIds];
    if (ids.length === 0) return;

    setIsDeleting(true);
    const results = await Promise.allSettled(
      ids.map((id) => deleteJobApplication(id)),
    );
    const succeededIds = ids.filter(
      (_, index) => results[index].status === "fulfilled",
    );
    const failedCount = ids.length - succeededIds.length;

    if (succeededIds.length > 0) {
      removeApplicationsFromCache(succeededIds);
      removeSelectedIds(succeededIds);
      toast.success(
        succeededIds.length === 1
          ? "Application deleted"
          : `${succeededIds.length} applications deleted`,
      );
    }

    if (failedCount > 0) {
      toast.error(
        failedCount === 1
          ? "Failed to delete 1 application"
          : `Failed to delete ${failedCount} applications`,
      );
      queryClient.invalidateQueries({
        queryKey: queryKeys.jobApplication.lists(),
      });
    }

    setIsDeleting(false);
    setIsDeleteDialogOpen(false);
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
    handleViewApplicationData,
    handleCancelApplication,
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
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {selectedIds.size} selected
            </p>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleRetryAll}
                size="sm"
                disabled={retryingIds.size > 0 || isDeleting}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Retry All ({selectedIds.size})
              </Button>
              <Button
                onClick={() => setIsDeleteDialogOpen(true)}
                size="sm"
                variant="destructive"
                disabled={isDeleting || retryingIds.size > 0}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
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
      <ApplicationDataDialog
        open={!!viewDataJobId}
        onOpenChange={(o) => {
          if (!o) setViewDataJobId(null);
        }}
        jobApplicationId={viewDataJobId}
      />
      <CancelApplicationDialog
        open={!!cancelDialogJobId}
        onOpenChange={(o) => {
          if (!o) setCancelDialogJobId(null);
        }}
        onConfirm={handleConfirmCancel}
        isLoading={isCancelling}
      />
      <DeleteApplicationsDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        selectedCount={selectedIds.size}
        onConfirm={handleConfirmDeleteSelected}
        isLoading={isDeleting}
      />
    </div>
  );
}

interface DeleteApplicationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onConfirm: () => void;
  isLoading: boolean;
}

function DeleteApplicationsDialog({
  open,
  onOpenChange,
  selectedCount,
  onConfirm,
  isLoading,
}: DeleteApplicationsDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Applications</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove {selectedCount} selected{" "}
            {selectedCount === 1 ? "application" : "applications"} from your
            list.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Go Back</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
            disabled={isLoading || selectedCount === 0}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function toTitleCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
