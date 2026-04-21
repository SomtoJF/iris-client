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

export interface IssueDetail {
  id: string;
  title: string;
  type: IssueType;
  jobApplicationId: string;
  contentJson: unknown;
  contentText: string;
  summary: string;
  isResolved: boolean;
  ownerId: string;
  isUserOwner: boolean;
  upvoteCount: number;
  userUpvoted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IssueComment {
  id: string;
  commentJson: unknown;
  commentText: string;
  ownerId: string;
  isUserOwner: boolean;
  upvoteCount: number;
  userUpvoted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedIssueCommentsResponse {
  total: number;
  page: number;
  limit: number;
  data: IssueComment[];
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

export async function fetchIssue(id: string): Promise<IssueDetail> {
  const response = await fetch(`${BaseRoute}/issue/${id}`, {
    method: "GET",
    credentials: "include",
  });
  const res = await response.json();
  if (response.status !== 200) {
    throw new Error(res.error ?? "Failed to fetch issue");
  }
  return res;
}

export async function fetchIssueComments(params: {
  id: string;
  page: number;
  limit: number;
}): Promise<PaginatedIssueCommentsResponse> {
  const sp = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });
  const response = await fetch(`${BaseRoute}/issue/${params.id}/comments?${sp}`, {
    method: "GET",
    credentials: "include",
  });
  const res = await response.json();
  if (response.status !== 200) {
    throw new Error(res.error ?? "Failed to fetch comments");
  }
  return res.data;
}

export async function createIssueComment(payload: {
  id: string;
  commentJson: string;
  commentText: string;
}): Promise<void> {
  const response = await fetch(`${BaseRoute}/issue/${payload.id}/comments`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      commentJson: payload.commentJson,
      commentText: payload.commentText,
    }),
  });
  const res = await response.json();
  if (response.status > 299) {
    throw new Error(res.error ?? "Failed to create comment");
  }
}

export async function upvoteIssue(id: string): Promise<void> {
  const response = await fetch(`${BaseRoute}/issue/${id}/upvote`, {
    method: "POST",
    credentials: "include",
  });
  const res = await response.json();
  if (response.status > 299) {
    throw new Error(res.error ?? "Failed to upvote issue");
  }
}

export async function undoUpvoteIssue(id: string): Promise<void> {
  const response = await fetch(`${BaseRoute}/issue/${id}/upvote`, {
    method: "DELETE",
    credentials: "include",
  });
  const res = await response.json();
  if (response.status > 299) {
    throw new Error(res.error ?? "Failed to remove issue upvote");
  }
}

export async function upvoteIssueComment(payload: {
  id: string;
  commentId: string;
}): Promise<void> {
  const response = await fetch(
    `${BaseRoute}/issue/${payload.id}/comments/${payload.commentId}/upvote`,
    { method: "POST", credentials: "include" },
  );
  const res = await response.json();
  if (response.status > 299) {
    throw new Error(res.error ?? "Failed to upvote comment");
  }
}

export async function undoUpvoteIssueComment(payload: {
  id: string;
  commentId: string;
}): Promise<void> {
  const response = await fetch(
    `${BaseRoute}/issue/${payload.id}/comments/${payload.commentId}/upvote`,
    { method: "DELETE", credentials: "include" },
  );
  const res = await response.json();
  if (response.status > 299) {
    throw new Error(res.error ?? "Failed to remove comment upvote");
  }
}

export async function markIssueResolved(id: string): Promise<void> {
  const response = await fetch(`${BaseRoute}/issue/${id}/resolve`, {
    method: "POST",
    credentials: "include",
  });
  const res = await response.json();
  if (response.status > 299) {
    throw new Error(res.error ?? "Failed to mark issue as resolved");
  }
}

export async function createIssue(payload: {
  title: string;
  type: IssueType;
  jobApplicationId?: string;
  contentJson: string;
  contentText: string;
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

