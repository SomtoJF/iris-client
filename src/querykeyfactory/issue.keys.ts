import type { IssueType } from "@/services/issue";

const issueKeys = {
  all: () => ["issues"] as const,
  lists: () => [...issueKeys.all(), "list"] as const,
  list: (params: {
    page: number;
    limit: number;
    search?: string;
    type?: IssueType;
    resolved?: boolean;
  }) => [...issueKeys.lists(), params] as const,
  details: () => [...issueKeys.all(), "detail"] as const,
  detail: (id: string) => [...issueKeys.details(), id] as const,
  comments: (id: string) => [...issueKeys.detail(id), "comments"] as const,
  commentsPage: (params: { id: string; page: number; limit: number }) =>
    [...issueKeys.comments(params.id), params] as const,
};

export default issueKeys;

