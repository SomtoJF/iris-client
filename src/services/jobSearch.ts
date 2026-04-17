import { BaseRoute } from "./routes";

export interface DiscoveredJob {
  title: string;
  url: string;
  companyName: string;
  datePosted: string;
}

export interface JobSearchResponse {
  jobs: DiscoveredJob[];
}

export interface JobSearchHistoryEntry {
  searchQuery: string;
  location: string;
  dateCutoff: string;
  requestedAt: string;
}

export async function searchJobs(body: {
  searchQuery: string;
  location: string;
  dateCutoff: string;
}): Promise<JobSearchResponse> {
  const response = await fetch(`${BaseRoute}/jobs/search`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const res = (await response.json()) as { error?: string } & JobSearchResponse;
  if (!response.ok) {
    throw new Error(res.error ?? "Job search failed");
  }
  return { jobs: res.jobs ?? [] };
}

export async function fetchJobSearchHistory(): Promise<JobSearchHistoryEntry[]> {
  const response = await fetch(`${BaseRoute}/jobs/search/history`, {
    method: "GET",
    credentials: "include",
  });
  const res = (await response.json()) as {
    error?: string;
    data?: JobSearchHistoryEntry[];
  };
  if (!response.ok) {
    throw new Error(res.error ?? "Failed to load search history");
  }
  return res.data ?? [];
}
