import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchIssues, type IssueListItem } from "@/services/issue";
import { queryKeys } from "@/querykeyfactory";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, LayoutGrid } from "lucide-react";

export default function FeedbackSidebar() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const queryParams = useMemo(
    () => ({
      page,
      limit,
      search: debouncedSearch || undefined,
      resolved: null as boolean | null,
    }),
    [page, limit, debouncedSearch],
  );

  const { data, isPending, isError, error } = useQuery({
    queryKey: queryKeys.issue.list(queryParams),
    queryFn: () => fetchIssues(queryParams),
  });

  const issues = data?.data ?? [];
  const total = data?.total ?? 0;
  const hasPrev = page > 1;
  const hasNext = page * limit < total;

  return (
    <aside className="flex h-full min-h-0 w-[360px] shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="flex min-h-0 flex-1 flex-col p-4">
        <div className="shrink-0">
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 pb-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to dashboard
          </Link>

          <Link to="/feedback">
            <Button
              type="button"
              variant="default"
              className="w-full justify-start rounded-md inline-flex items-center gap-2 h-fit py-4 bg-purple-100 text-gray-800 border"
            >
              <span className="bg-purple-600 text-white rounded-sm p-2 flex items-center justify-center">
                <LayoutGrid className="w-5 h-5" />
              </span>{" "}
              <div className="flex flex-col items-start">
                <span>All Issues Feed</span>
                <p className="text-xs text-gray-500">
                  Browse and manage open feedback issues
                </p>
              </div>
            </Button>
          </Link>

          <div className="mt-3">
            <Button
              type="button"
              variant="outline"
              className="w-full bg-purple-600 text-white hover:bg-purple-700 hover:text-white"
              asChild
            >
              <Link to="/feedback/new">Add new issue</Link>
            </Button>
          </div>

          <div className="mt-3">
            <Input
              placeholder="Search issues..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Separator className="my-4" />

          <div
            className={cn(
              "py-2",
              "text-xs uppercase tracking-wide font-medium",
            )}
          >
            Issues
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto text-sm">
          {isPending ? (
            <div className="py-6 text-center text-muted-foreground">
              Loading…
            </div>
          ) : isError ? (
            <div className="py-6 text-center text-sm text-red-600">
              {(error as Error)?.message ?? "Failed to load issues"}
            </div>
          ) : issues.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground">
              No issues found.
            </div>
          ) : (
            <ul className="space-y-1">
              {issues.map((issue) => (
                <IssueRow key={issue.id} issue={issue} />
              ))}
            </ul>
          )}
        </div>

        {issues.length > 0 && (
          <div className="mt-auto pt-4">
            <Separator className="mb-4" />
            <div className="flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!hasPrev}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              <div className="text-xs text-muted-foreground">Page {page}</div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!hasNext}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

function IssueRow({ issue }: { issue: IssueListItem }) {
  return (
    <li className="rounded-md border border-transparent hover:bg-gray-50">
      <Link
        to={`/feedback/${issue.id}`}
        className="block w-full text-left px-3 py-2 overflow-hidden"
      >
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{issue.title}</span>
              {issue.isResolved && (
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
              )}
              <Badge
                variant="secondary"
                className={cn(
                  "shrink-0 border",
                  issue.type === "feature_request"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-red-50 text-red-700 border-red-200",
                )}
              >
                {issue.type === "feature_request" ? "Feature" : "Bug"}
              </Badge>
            </div>
            <div className="text-xs text-gray-500 truncate mt-0.5">
              {issue.summary}
            </div>
          </div>
        </div>
      </Link>
    </li>
  );
}
