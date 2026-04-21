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
};

export default issueKeys;

