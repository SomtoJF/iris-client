import { BaseRoute } from "./routes";
import z from "zod";

export const jobApplicationSchema = z.object({
  jobUrl: z.url(),
});

export interface FetchAllJobApplicationsResponse {
  total: number;
  page: number;
  limit: number;
  data: JobApplication[];
}

export interface JobApplication {
  id: string;
  url: string;
  status: "processing" | "applied" | "failed";
  createdAt: string;
  updatedAt: string;
}

export async function applyToJob(data: z.infer<typeof jobApplicationSchema>) {
  const response = await fetch(`${BaseRoute}/jobs/apply`, {
    method: "POST",
    body: JSON.stringify({url: data.jobUrl}),
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });
  const res = await response.json();
  if (response.status > 299) {
    throw new Error(res.error ?? "Failed to apply to job");
  }
  return res;
}


export async function fetchAllJobApplications(page: number, limit: number): Promise<FetchAllJobApplicationsResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  const response = await fetch(`${BaseRoute}/jobs?${params}`, {
    method: "GET",
    credentials: "include",
  });
  const res = await response.json();
  if (response.status !== 200) {
    throw new Error(res.error ?? "Failed to fetch job applications");
  }
  return res.data;
}