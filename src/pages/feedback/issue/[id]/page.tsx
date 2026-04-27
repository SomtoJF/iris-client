import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/toast";
import { cn } from "@/lib/utils";
import { queryKeys } from "@/querykeyfactory";
import {
  createIssueComment,
  fetchIssue,
  fetchIssueComments,
  markIssueResolved,
  undoUpvoteIssue,
  undoUpvoteIssueComment,
  upvoteIssue,
  upvoteIssueComment,
  type IssueComment,
} from "@/services/issue";
import { useUserStore } from "@/zustand/userstore";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  ArrowBigUp,
  CheckCircle2,
  Copy,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useParams } from "react-router";

import "@blocknote/core/fonts/inter.css";
import { en } from "@blocknote/core/locales";
import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import "@blocknote/shadcn/style.css";

dayjs.extend(relativeTime);

const COMMENTS_LIMIT = 20;

function toTitleCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getJobStatusTextStyles(status?: string): string {
  switch (status) {
    case "applied":
      return "text-green-600";
    case "processing":
      return "text-amber-500 animate-pulse";
    case "failed":
      return "text-red-500";
    case "blocked":
      return "text-pink-500";
    default:
      return "text-muted-foreground";
  }
}

function getJobStatusIconStyles(status?: string): string {
  switch (status) {
    case "applied":
      return "bg-green-600 opacity-50";
    case "processing":
      return "bg-amber-500 animate-pulse opacity-50";
    case "failed":
      return "bg-red-500 opacity-50";
    case "blocked":
      return "bg-pink-500 opacity-50";
    default:
      return "bg-muted-foreground animate-pulse";
  }
}

export default function FeedbackIssuePage() {
  const { id } = useParams();
  const { user } = useUserStore();

  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const issueId = id ?? "";

  const schema = useMemo(() => {
    const disallowedBlockTypes = new Set([
      "heading",
      "image",
      "video",
      "audio",
      "file",
    ]);

    const blockSpecs = Object.fromEntries(
      Object.entries(defaultBlockSpecs).filter(
        ([blockType]) => !disallowedBlockTypes.has(blockType),
      ),
    );

    return BlockNoteSchema.create({
      blockSpecs,
    });
  }, []);

  const editor = useCreateBlockNote({
    schema,
    dictionary: {
      ...en,
      placeholders: {
        ...en.placeholders,
        emptyDocument: "Add a comment…",
        default: "Add a comment…",
      },
    },
  });

  const issueQuery = useQuery({
    queryKey: queryKeys.issue.detail(issueId),
    queryFn: () => fetchIssue(issueId),
    enabled: Boolean(issueId),
  });

  const issue = issueQuery.data;
  const canResolve = Boolean(issue && (user?.isAdmin || issue.isUserOwner));
  const votesDisabled = Boolean(issue?.isResolved);

  const commentsQuery = useInfiniteQuery({
    queryKey: queryKeys.issue.comments(issueId),
    enabled: Boolean(issueId),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      fetchIssueComments({
        id: issueId,
        page: pageParam,
        limit: COMMENTS_LIMIT,
      }),
    getNextPageParam: (lastPage) => {
      const loadedSoFar = lastPage.page * lastPage.limit;
      return loadedSoFar < lastPage.total ? lastPage.page + 1 : undefined;
    },
  });

  const comments = useMemo(() => {
    const pages = commentsQuery.data?.pages ?? [];
    return pages.flatMap((p) => p.data);
  }, [commentsQuery.data]);

  const totalComments = commentsQuery.data?.pages?.[0]?.total ?? 0;
  const hasMoreComments = comments.length < totalComments;

  const issueVoteMutation = useMutation({
    mutationFn: async () => {
      if (!issue) return;
      if (issue.userUpvoted) {
        await undoUpvoteIssue(issue.id);
      } else {
        await upvoteIssue(issue.id);
      }
    },
    onSuccess: async () => {
      await issueQuery.refetch();
    },
    onError: (e) => {
      toast.error((e as Error)?.message ?? "Failed to vote");
    },
  });

  const commentVoteMutation = useMutation({
    mutationFn: async (comment: IssueComment) => {
      if (comment.userUpvoted) {
        await undoUpvoteIssueComment({ id: issueId, commentId: comment.id });
      } else {
        await upvoteIssueComment({ id: issueId, commentId: comment.id });
      }
    },
    onSuccess: async () => {
      await commentsQuery.refetch();
      await issueQuery.refetch();
    },
    onError: (e) => {
      toast.error((e as Error)?.message ?? "Failed to vote");
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async () => {
      if (!issue) return;
      await markIssueResolved(issue.id);
    },
    onSuccess: async () => {
      toast.success("Issue resolved");
      await issueQuery.refetch();
    },
    onError: (e) => {
      toast.error((e as Error)?.message ?? "Failed to resolve issue");
    },
  });

  const onSubmitComment = async () => {
    if (!issue) return;
    if (issue.isResolved) {
      toast.error("Comments are disabled on resolved issues");
      return;
    }
    try {
      setIsSubmittingComment(true);
      const commentJson = JSON.stringify(editor.document);
      const commentText = await editor.blocksToMarkdownLossy(editor.document);
      if (!commentText.trim()) {
        toast.error("Comment cannot be empty");
        return;
      }
      await createIssueComment({ id: issue.id, commentJson, commentText });
      toast.success("Comment posted");
      await commentsQuery.refetch();
      await issueQuery.refetch();

      editor.replaceBlocks(editor.document, []);
    } catch (e) {
      toast.error((e as Error)?.message ?? "Failed to post comment");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (!issueId) {
    return (
      <div className="w-full px-8 py-8">
        <div className="max-w-5xl">
          <div className="text-sm text-red-600">Missing issue id.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-8 py-8">
      <div className="max-w-5xl">
        {issueQuery.isPending ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : issueQuery.isError ? (
          <div className="text-sm text-red-600">
            {(issueQuery.error as Error)?.message ?? "Failed to load issue"}
          </div>
        ) : !issue ? (
          <div className="text-sm text-muted-foreground">Issue not found.</div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-extrabold tracking-tight text-balance">
                    {issue.title}
                  </h1>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "border",
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
                      className="gap-1 text-green-700 border-green-200 bg-green-50"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                      Resolved
                    </Badge>
                  )}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  <span className="font-medium text-gray-800">
                    {issue.ownerEmail}{" "}
                    {issue.isUserOwner && (
                      <span className="text-[10px] border px-1 py-0.5 rounded-md text-green-600 bg-green-50 border-green-200">
                        You
                      </span>
                    )}
                  </span>{" "}
                  · Asked {dayjs(issue.createdAt).fromNow()} · Updated{" "}
                  {dayjs(issue.updatedAt).fromNow()}
                </div>
              </div>

              {canResolve && !issue.isResolved && (
                <Button
                  type="button"
                  onClick={() => resolveMutation.mutate()}
                  disabled={resolveMutation.isPending}
                >
                  Mark as resolved
                </Button>
              )}
            </div>

            <Card>
              <CardHeader className="border-b" />
              <CardContent>
                <div className="flex gap-6">
                  <VoteRail
                    count={issue.upvoteCount}
                    active={issue.userUpvoted}
                    disabled={
                      votesDisabled ||
                      issueVoteMutation.isPending ||
                      resolveMutation.isPending
                    }
                    onClick={() => issueVoteMutation.mutate()}
                    label="Issue votes"
                  />

                  <div className="flex-1 min-w-0">
                    {issue.summary && (
                      <div className="text-sm mb-3 rounded-md p-2 bg-gray-50 ">
                        <h3 className="text-sm font-medium mb-1 flex items-center gap-1">
                          <Sparkles className="h-4 w-4 text-purple-500" />
                          Summary
                        </h3>
                        <div className="text-sm text-muted-foreground">
                          {issue.summary}
                        </div>
                      </div>
                    )}

                    {issue.jobApplication ? (
                      <div className="rounded-md border border-border bg-muted/30 p-3 mb-3 space-y-2">
                        <p className="text-xs font-bold uppercase  text-muted-foreground">
                          Linked job application
                        </p>
                        <div>
                          <p className="text-sm font-medium leading-snug">
                            {issue.jobApplication.title}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <span>{issue.jobApplication.companyName}</span>
                            {issue.jobApplication.status ? (
                              <span
                                className={cn(
                                  "inline-flex items-center gap-2 text-sm leading-5 px-2 rounded-full",
                                  getJobStatusTextStyles(
                                    issue.jobApplication.status,
                                  ),
                                )}
                              >
                                <span
                                  className={cn(
                                    "w-3 h-3 rounded-full",
                                    getJobStatusIconStyles(
                                      issue.jobApplication.status,
                                    ),
                                  )}
                                />
                                {toTitleCase(
                                  String(issue.jobApplication.status),
                                )}
                              </span>
                            ) : null}
                          </p>
                        </div>
                        <div className="flex min-w-0 items-center gap-1">
                          <a
                            href={issue.jobApplication.url}
                            target="_blank"
                            rel="noreferrer"
                            className="min-w-0 w-fit truncate text-sm text-primary underline-offset-4 hover:underline"
                          >
                            {issue.jobApplication.url}
                          </a>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            aria-label="Copy job application URL"
                            onClick={async () => {
                              const url = issue.jobApplication?.url;
                              if (!url) return;
                              try {
                                await navigator.clipboard.writeText(url);
                                toast.success("URL copied");
                              } catch {
                                toast.error("Failed to copy URL");
                              }
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : null}

                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-sm leading-6">
                        {issue.contentText}
                      </pre>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-between">
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  {totalComments} comments
                </div>
                {votesDisabled && (
                  <div className="text-xs text-muted-foreground">
                    Voting is disabled on resolved issues.
                  </div>
                )}
              </CardFooter>
            </Card>

            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold tracking-wide">
                  Comments
                </h2>
              </div>
              <Separator className="mt-3" />

              <div className="mt-4 space-y-4">
                {commentsQuery.isPending ? (
                  <div className="text-sm text-muted-foreground">Loading…</div>
                ) : commentsQuery.isError ? (
                  <div className="text-sm text-red-600">
                    {(commentsQuery.error as Error)?.message ??
                      "Failed to load comments"}
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    No comments yet.
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {comments.map((c) => (
                      <li key={c.id}>
                        <Card size="sm">
                          <CardContent>
                            <div className="flex gap-5">
                              <VoteRail
                                count={c.upvoteCount}
                                active={c.userUpvoted}
                                disabled={
                                  votesDisabled || commentVoteMutation.isPending
                                }
                                onClick={() => commentVoteMutation.mutate(c)}
                                label="Comment votes"
                              />
                              <div className="flex-1 min-w-0">
                                <h5 className="text-xs font-bold mb-1 flex items-center gap-1">
                                  {c.ownerEmail}{" "}
                                  {c.isOwnerAdmin && (
                                    <span className="text-[10px] border px-1 py-0.5 rounded-md text-purple-600 bg-purple-50 border-purple-200">
                                      Admin
                                    </span>
                                  )}
                                  {c.isUserOwner && (
                                    <span className="text-[10px] border px-1 py-0.5 rounded-md text-green-600 bg-green-50 border-green-200">
                                      You
                                    </span>
                                  )}
                                </h5>
                                <pre className="whitespace-pre-wrap font-sans text-sm leading-6">
                                  {c.commentText}
                                </pre>
                                <div className="mt-2 text-xs text-muted-foreground">
                                  Posted {dayjs(c.createdAt).fromNow()}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </li>
                    ))}
                  </ul>
                )}

                {hasMoreComments && (
                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => commentsQuery.fetchNextPage()}
                      disabled={
                        !commentsQuery.hasNextPage ||
                        commentsQuery.isFetchingNextPage
                      }
                    >
                      {commentsQuery.isFetchingNextPage
                        ? "Fetching…"
                        : "Fetch more"}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <Card>
              <CardHeader className="border-b">
                <div className="text-sm font-semibold">Add a comment</div>
              </CardHeader>
              <CardContent>
                {issue.isResolved ? (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-muted-foreground">
                    Comments are disabled on resolved issues.
                  </div>
                ) : (
                  <div className="rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                    <BlockNoteView
                      editor={editor}
                      theme="light"
                      className={cn(
                        "min-h-[200px]",
                        "[&_.bn-editor]:min-h-[200px] [&_.bn-editor]:px-3 [&_.bn-editor]:py-2",
                      )}
                    />
                  </div>
                )}
              </CardContent>
              <CardFooter className="justify-end gap-2">
                <Button
                  type="button"
                  onClick={onSubmitComment}
                  disabled={isSubmittingComment || issue.isResolved}
                >
                  {isSubmittingComment ? "Posting…" : "Post comment"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function VoteRail({
  count,
  active,
  disabled,
  onClick,
  label,
}: {
  count: number;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 shrink-0 w-10">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className={cn(
          "rounded-full",
          active && "text-purple-600 bg-purple-50 border-purple-200",
        )}
      >
        <ArrowBigUp className="h-6 w-6" />
      </Button>
      <div className="text-sm font-semibold tabular-nums">{count}</div>
    </div>
  );
}
