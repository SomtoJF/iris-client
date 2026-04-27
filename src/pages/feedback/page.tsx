import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/toast";
import { cn } from "@/lib/utils";
import { queryKeys } from "@/querykeyfactory";
import {
  fetchIssues,
  undoUpvoteIssue,
  upvoteIssue,
  type IssueFilter,
  type IssueListItem,
  type IssueSort,
} from "@/services/issue";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { ArrowBigUp, MessageSquare } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";

dayjs.extend(relativeTime);

const LIMIT = 20;

export default function FeedbackPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState<IssueSort>("upvotes_desc");
  const [filter, setFilter] = useState<IssueFilter>("");
  const [resolved, setResolved] = useState<boolean | null>(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page on any filter/sort/search change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, sort, filter, resolved]);

  const queryParams = useMemo(
    () => ({
      page,
      limit: LIMIT,
      search: debouncedSearch || undefined,
      sort: filter === "hot" ? undefined : sort,
      filter: filter || undefined,
      resolved,
    }),
    [page, debouncedSearch, sort, filter, resolved],
  );

  const { data, isPending, isError, error } = useQuery({
    queryKey: queryKeys.issue.list(queryParams),
    queryFn: () => fetchIssues(queryParams),
  });

  const issues = data?.data ?? [];
  const total = data?.total ?? 0;
  const hasPrev = page > 1;
  const hasNext = page * LIMIT < total;

  const voteMutation = useMutation({
    mutationFn: async (issue: IssueListItem) => {
      if (issue.userUpvoted) {
        await undoUpvoteIssue(issue.id);
      } else {
        await upvoteIssue(issue.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.issue.lists() });
    },
    onError: (e) => {
      toast.error((e as Error)?.message ?? "Failed to vote");
    },
  });

  // Combined resolved + filter handler
  const handleFilterChange = (value: string) => {
    switch (value) {
      case "all":
        setFilter("");
        setResolved(null);
        break;
      case "unresolved":
        setFilter("");
        setResolved(false);
        break;
      case "resolved":
        setFilter("");
        setResolved(true);
        break;
      case "hot":
        setFilter("hot");
        setResolved(null);
        break;
      case "mine":
        setFilter("mine");
        setResolved(null);
        break;
      default:
        setFilter("");
        setResolved(false);
    }
  };

  const filterValue = (() => {
    if (filter === "hot") return "hot";
    if (filter === "mine") return "mine";
    if (resolved === true) return "resolved";
    if (resolved === false) return "unresolved";
    return "all";
  })();

  return (
    <div className="w-full px-8 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold tracking-tight">All Issues</h1>
          <Button asChild>
            <Link to="/feedback/new">New Issue</Link>
          </Button>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 mb-6">
          <Input
            placeholder="Search issues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />

          <Select
            value={sort}
            onValueChange={(v) => setSort(v as IssueSort)}
            disabled={filter === "hot"}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="upvotes_desc">Most upvoted</SelectItem>
              <SelectItem value="upvotes_asc">Least upvoted</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterValue} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unresolved">Unresolved</SelectItem>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="hot">Hot</SelectItem>
              <SelectItem value="mine">Posted by Me</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Issues list */}
        {isPending ? (
          <div className="py-12 text-center text-muted-foreground">
            Loading…
          </div>
        ) : isError ? (
          <div className="py-12 text-center text-sm text-red-600">
            {(error as Error)?.message ?? "Failed to load issues"}
          </div>
        ) : issues.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            No issues found.
          </div>
        ) : (
          <div className="space-y-3">
            {issues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                onVote={() => voteMutation.mutate(issue)}
                voteDisabled={
                  issue.isResolved || voteMutation.isPending
                }
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > 0 && (
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="outline"
              size="sm"
              disabled={!hasPrev}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {Math.ceil(total / LIMIT)}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasNext}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function IssueCard({
  issue,
  onVote,
  voteDisabled,
}: {
  issue: IssueListItem;
  onVote: () => void;
  voteDisabled: boolean;
}) {
  return (
    <div className="flex gap-4 rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-300 transition-colors">
      {/* Vote rail */}
      <div className="flex flex-col items-center gap-1 shrink-0 w-10 pt-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.preventDefault();
            onVote();
          }}
          disabled={voteDisabled}
          aria-label="Upvote"
          className={cn(
            "rounded-full h-9 w-9",
            issue.userUpvoted &&
              "text-purple-600 bg-purple-50 border-purple-200",
          )}
        >
          <ArrowBigUp className="h-5 w-5" />
        </Button>
        <span className="text-sm font-semibold tabular-nums">
          {issue.upvoteCount}
        </span>
      </div>

      {/* Content */}
      <Link
        to={`/feedback/${issue.id}`}
        className="flex-1 min-w-0 block"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm truncate">
            {issue.title}
          </span>
          <Badge
            variant="secondary"
            className={cn(
              "shrink-0 border text-xs",
              issue.type === "feature_request"
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-red-50 text-red-700 border-red-200",
            )}
          >
            {issue.type === "feature_request" ? "Feature" : "Bug"}
          </Badge>
          {issue.isResolved && (
            <Badge
              variant="outline"
              className="gap-1 text-green-700 border-green-200 bg-green-50 text-xs"
            >
              Resolved
            </Badge>
          )}
        </div>

        {issue.summary && (
          <p className="text-xs text-muted-foreground mt-1">
            {issue.summary}
          </p>
        )}

        <p className="text-sm text-gray-700 mt-1 line-clamp-3">
          {issue.contentText}
        </p>

        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            {issue.commentCount}
          </span>
          <span>{dayjs(issue.createdAt).fromNow()}</span>
        </div>
      </Link>
    </div>
  );
}
