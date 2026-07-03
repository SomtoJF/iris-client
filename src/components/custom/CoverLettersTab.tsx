import {
  fetchCoverLetters,
  type CoverLetterListItem,
} from "@/services/coverletter";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Loader2, Plus, Search } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import type { ColumnDef } from "@tanstack/react-table";
import { GenerativeGrid, type TableConfig } from "./GenerativeGrid";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/querykeyfactory";
import CoverLetterDialog from "./CoverLetterDialog";
import CreateCoverLetterDialog from "./CreateCoverLetterDialog";

dayjs.extend(relativeTime);

const LIMIT = 10;

type CoverLetterStatus = CoverLetterListItem["status"];

function getStatusTagConfig(status: CoverLetterStatus): {
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

function statusLabel(status: CoverLetterStatus): string {
  if (status === "applied") return "Ready";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function buildColumns(): (ColumnDef<CoverLetterListItem, unknown> & {
  shimmer?: () => React.ReactNode;
  width?: string;
})[] {
  return [
    {
      accessorKey: "jobTitle",
      header: "Job Title",
      cell: ({ row }) => (
        <div className="truncate text-black" title={row.original.jobTitle}>
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
          onClick={(e) => e.stopPropagation()}
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
        return (
          <div className="flex items-center">
            <span className={cn("w-3 h-3 rounded-full mr-2", iconStyles)} />
            <p className={cn(textStyles)}>{statusLabel(row.original.status)}</p>
          </div>
        );
      },
      shimmer: () => <Skeleton className="h-6 w-24" />,
      width: "150px",
    },
    {
      accessorKey: "createdAt",
      header: "Created",
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

export default function CoverLettersTab() {
  const [pageIndex, setPageIndex] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [viewId, setViewId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const queryKey = queryKeys.coverLetter.list({
    page: pageIndex + 1,
    limit: LIMIT,
    search: activeSearch || undefined,
  });

  const { data, isFetching } = useQuery({
    queryKey,
    queryFn: () =>
      fetchCoverLetters(pageIndex + 1, LIMIT, activeSearch || undefined),
  });

  const coverLetters = data?.data ?? [];
  const total = data?.total ?? 0;

  function handleSearch() {
    setActiveSearch(searchInput);
    setPageIndex(0);
  }

  const tableConfig: TableConfig<CoverLetterListItem> = {
    columns: buildColumns(),
    data: coverLetters,
    pagination: {
      pageIndex,
      pageSize: LIMIT,
      total,
      onPageChange: setPageIndex,
    },
    loading: isFetching,
    onRowClick: (row) => setViewId(row.jobApplicationId),
  };

  return (
    <div className="w-full pb-8 space-y-3">
      <div className="w-full mt-2 flex items-center gap-4">
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
        <Button
          size="sm"
          className="px-4 h-8 whitespace-nowrap"
          onClick={() => setIsCreateOpen(true)}
        >
          <Plus className="w-4 h-4 mr-1" /> New Cover Letter
        </Button>
      </div>
      <GenerativeGrid config={tableConfig} />
      <CoverLetterDialog
        open={!!viewId}
        onOpenChange={(o) => {
          if (!o) setViewId(null);
        }}
        jobApplicationId={viewId}
      />
      <CreateCoverLetterDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreated={(result) => setViewId(result.jobApplicationId)}
      />
    </div>
  );
}
