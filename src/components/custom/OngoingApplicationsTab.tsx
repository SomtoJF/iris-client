import { fetchAllJobApplications, type JobApplication } from "@/services/job";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import jobApplicationKeys from "@/querykeyfactory/jobapplication.keys";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Loader2, CheckCircle2, X } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import type { LucideIcon } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { GenerativeGrid, type TableConfig } from "./GenerativeGrid";

dayjs.extend(relativeTime);

const LIMIT = 10;

type JobStatus = JobApplication["status"];

function getStatusTagConfig(status: JobStatus): {
  className: string;
  icon: LucideIcon;
} {
  switch (status) {
    case "applied":
      return {
        className:
          "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
        icon: CheckCircle2,
      };
    case "processing":
      return {
        className:
          "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
        icon: Loader2,
      };
    case "failed":
      return {
        className:
          "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
        icon: X,
      };
    default:
      return {
        className: "bg-muted text-muted-foreground border-border",
        icon: Loader2,
      };
  }
}

const jobApplicationColumns: (ColumnDef<JobApplication, any> & {
  shimmer?: () => React.ReactNode;
  width?: string;
})[] = [
  {
    accessorKey: "url",
    header: "Job URL",
    cell: ({ row }) => (
      <a
        href={row.original.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-medium text-blue-500 hover:text-blue-600 cursor-pointer flex items-center gap-2 max-w-full"
      >
        <span className="truncate">{row.original.url}</span>
        <ExternalLink className="w-4 h-4 flex-shrink-0" />
      </a>
    ),
    shimmer: () => <Skeleton className="h-4 w-64" />,
    width: "400px",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const { className, icon: Icon } = getStatusTagConfig(row.original.status);
      return (
        <Badge variant="outline" className={className}>
          <Icon
            className={`w-3 h-3 ${row.original.status === "processing" ? "animate-spin" : ""}`}
          />
          <span className="capitalize">{row.original.status}</span>
        </Badge>
      );
    },
    shimmer: () => <Skeleton className="h-6 w-24" />,
    width: "150px",
  },
  {
    accessorKey: "createdAt",
    header: "Applied",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {dayjs(row.original.createdAt).fromNow()}
      </span>
    ),
    shimmer: () => <Skeleton className="h-4 w-20" />,
    width: "120px",
  },
];

export default function OngoingApplicationsTab() {
  const [pageIndex, setPageIndex] = useState(0);

  const page = pageIndex + 1;
  const { data, isFetching } = useQuery({
    queryKey: jobApplicationKeys.list({ page, limit: LIMIT }),
    queryFn: () => fetchAllJobApplications(page, LIMIT),
  });

  const jobApplications = data?.data ?? [];
  const total = data?.total ?? 0;

  const handlePageChange = (newPageIndex: number) => {
    setPageIndex(newPageIndex);
  };

  const tableConfig: TableConfig<JobApplication> = {
    columns: jobApplicationColumns,
    data: jobApplications,
    pagination: {
      pageIndex,
      pageSize: LIMIT,
      total,
      onPageChange: handlePageChange,
    },
    loading: isFetching,
  };

  return (
    <div className="w-full pb-8">
      <GenerativeGrid config={tableConfig} />
    </div>
  );
}
