import { BaseRoute } from "./routes";

export type IssueType = "bug" | "feature_request";

export interface IssueListItem {
  id: string;
  title: string;
  type: IssueType;
  summary: string;
  isResolved: boolean;
  upvoteCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FetchIssuesResponse {
  total: number;
  page: number;
  limit: number;
  data: IssueListItem[];
}

export async function fetchIssues(params: {
  page: number;
  limit: number;
  search?: string;
  type?: IssueType;
  resolved?: boolean;
}): Promise<FetchIssuesResponse> {
  const sp = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });
  if (params.search) sp.set("search", params.search);
  if (params.type) sp.set("type", params.type);
  if (typeof params.resolved === "boolean")
    sp.set("resolved", String(params.resolved));

  const response = await fetch(`${BaseRoute}/issues?${sp}`, {
    method: "GET",
    credentials: "include",
  });
  const res = await response.json();
  if (response.status !== 200) {
    throw new Error(res.error ?? "Failed to fetch issues");
  }
  return res.data;
}

export async function createIssue(payload: {
  title: string;
  type: IssueType;
  jobApplicationId?: string;
  description: string;
  summary?: string;
}): Promise<void> {
  const response = await fetch(`${BaseRoute}/issue`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const res = await response.json();
  if (response.status > 299) {
    throw new Error(res.error ?? "Failed to create issue");
  }
}

