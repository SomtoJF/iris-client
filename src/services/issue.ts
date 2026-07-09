import { apiFetch } from "./api";

export type IssueType = "bug" | "feature_request";

export interface IssueJobApplication {
  id: string;
  title: string;
  companyName: string;
  url: string;
  status?: string;
}

export interface IssueListItem {
  id: string;
  title: string;
  type: IssueType;
  summary: string;
  contentText: string;
  isResolved: boolean;
  upvoteCount: number;
  userUpvoted: boolean;
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
  jobApplication?: IssueJobApplication;
  contentJson: unknown;
  contentText: string;
  summary: string;
  isResolved: boolean;
  ownerId: string;
  isUserOwner: boolean;
  isOwnerAdmin: boolean;
  ownerEmail: string;
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
  isOwnerAdmin: boolean;
  ownerEmail: string;
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

export type IssueSort = "upvotes_desc" | "upvotes_asc";
export type IssueFilter = "" | "hot" | "mine";

export async function fetchIssues(params: {
  page: number;
  limit: number;
  search?: string;
  type?: IssueType;
  /** Omit or pass `null` to include both open and resolved issues. */
  resolved?: boolean | null;
  sort?: IssueSort;
  filter?: IssueFilter;
}): Promise<FetchIssuesResponse> {
  const sp = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });
  if (params.search) sp.set("search", params.search);
  if (params.type) sp.set("type", params.type);
  if (params.resolved === true || params.resolved === false)
    sp.set("resolved", String(params.resolved));
  if (params.sort) sp.set("sort", params.sort);
  if (params.filter) sp.set("filter", params.filter);

  const res = await apiFetch(`/issues?${sp}`, {
    method: "GET",
    fallbackError: "Failed to fetch issues",
  });
  return res.data;
}

export async function fetchIssue(id: string): Promise<IssueDetail> {
  return apiFetch(`/issue/${id}`, {
    method: "GET",
    fallbackError: "Failed to fetch issue",
  });
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
  const res = await apiFetch(`/issue/${params.id}/comments?${sp}`, {
    method: "GET",
    fallbackError: "Failed to fetch comments",
  });
  return res.data;
}

export async function createIssueComment(payload: {
  id: string;
  commentJson: string;
  commentText: string;
}): Promise<void> {
  await apiFetch(`/issue/${payload.id}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      commentJson: payload.commentJson,
      commentText: payload.commentText,
    }),
    fallbackError: "Failed to create comment",
  });
}

export async function upvoteIssue(id: string): Promise<void> {
  await apiFetch(`/issue/${id}/upvote`, {
    method: "POST",
    fallbackError: "Failed to upvote issue",
  });
}

export async function undoUpvoteIssue(id: string): Promise<void> {
  await apiFetch(`/issue/${id}/upvote`, {
    method: "DELETE",
    fallbackError: "Failed to remove issue upvote",
  });
}

export async function upvoteIssueComment(payload: {
  id: string;
  commentId: string;
}): Promise<void> {
  await apiFetch(`/issue/${payload.id}/comments/${payload.commentId}/upvote`, {
    method: "POST",
    fallbackError: "Failed to upvote comment",
  });
}

export async function undoUpvoteIssueComment(payload: {
  id: string;
  commentId: string;
}): Promise<void> {
  await apiFetch(`/issue/${payload.id}/comments/${payload.commentId}/upvote`, {
    method: "DELETE",
    fallbackError: "Failed to remove comment upvote",
  });
}

export async function markIssueResolved(id: string): Promise<void> {
  await apiFetch(`/issue/${id}/resolve`, {
    method: "POST",
    fallbackError: "Failed to mark issue as resolved",
  });
}

export async function createIssue(payload: {
  title: string;
  type: IssueType;
  jobApplicationId?: string;
  contentJson: string;
  contentText: string;
}): Promise<void> {
  await apiFetch("/issue", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    fallbackError: "Failed to create issue",
  });
}
