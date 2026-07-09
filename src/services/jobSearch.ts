import { apiFetch } from "./api";

export interface DiscoveredJob {
  title: string;
  url: string;
  companyName: string;
  datePosted: string;
  applied: boolean;
}

export interface JobSearchResponse {
  jobs: DiscoveredJob[];
}

export interface JobSearchHistoryEntry {
  searchQuery: string;
  location: string;
  dateCutoff: string | null;
  requestedAt: string;
}

export async function searchJobs(body: {
  searchQuery: string;
  location: string;
  dateCutoff: string | null;
}): Promise<JobSearchResponse> {
  const res = (await apiFetch("/jobs/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    fallbackError: "Job search failed",
  })) as JobSearchResponse;
  return { jobs: res.jobs ?? [] };
}

export async function fetchJobSearchHistory(): Promise<JobSearchHistoryEntry[]> {
  const res = (await apiFetch("/jobs/search/history", {
    method: "GET",
    fallbackError: "Failed to load search history",
  })) as { data?: JobSearchHistoryEntry[] };
  return res.data ?? [];
}
