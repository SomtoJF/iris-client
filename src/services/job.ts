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
  jobTitle: string;
  companyName: string;
  status: "processing" | "applied" | "failed" | "blocked" | "cancelled";
  hasApplicationData: boolean;
  failureReason?: string;
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


export async function fetchAllJobApplications(page: number, limit: number, search?: string): Promise<FetchAllJobApplicationsResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set("search", search);
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

export async function retryJobApplication(id: string): Promise<void> {
  const response = await fetch(`${BaseRoute}/jobs/${id}/retry-application`, {
    method: "POST",
    credentials: "include",
  });
  const res = await response.json();
  if (response.status > 299) {
    throw new Error(res.error ?? "Failed to retry job application");
  }
}

export interface UserActionLayoutItem {
  field_name: string;
  description: string | null;
  type: string | null;
  component: string | null;
  options: string[] | null;
}

export interface UserActionResponse {
  id: number;
  user_action_type: string;
  action_details: string;
  layout: UserActionLayoutItem[];
  workflow_id: string;
  signal_name: string;
}

export interface UserActionResultItem {
  field_name: string;
  value: string;
}

export async function fetchUserAction(jobApplicationId: string): Promise<UserActionResponse> {
  const response = await fetch(`${BaseRoute}/jobs/${jobApplicationId}/user-action`, {
    method: "GET",
    credentials: "include",
  });
  const res = await response.json();
  if (response.status !== 200) {
    throw new Error(res.error ?? "Failed to fetch user action");
  }
  return res;
}

export interface JobApplicationQuestion {
  question: string;
  answer: string;
  is_optional: boolean;
}

export interface JobApplicationDataResume {
  id: string;
  fileName: string;
  fileSize: number;
}

export interface JobApplicationDataResponse {
  questions: JobApplicationQuestion[];
  cover_letter: string | null;
  resume: JobApplicationDataResume;
}

export async function fetchJobApplicationData(id: string): Promise<JobApplicationDataResponse> {
  const response = await fetch(`${BaseRoute}/jobs/${id}/application-data`, {
    method: "GET",
    credentials: "include",
  });
  const res = await response.json();
  if (response.status !== 200) {
    throw new Error(res.error ?? "Failed to fetch application data");
  }
  return res.data;
}

export async function cancelJobApplication(id: string, reason?: string): Promise<void> {
  const response = await fetch(`${BaseRoute}/jobs/${id}/cancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ reason: reason || null }),
  });
  const res = await response.json();
  if (response.status > 299) {
    throw new Error(res.error ?? "Failed to cancel job application");
  }
}

export async function sendWorkflowSignal(workflowId: string, signalName: string, payload: unknown): Promise<void> {
  const response = await fetch(`${BaseRoute}/workflows/signal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      workflow_id: workflowId,
      signal_name: signalName,
      payload,
    }),
  });
  const res = await response.json();
  if (response.status > 299) {
    throw new Error(res.error ?? "Failed to send workflow signal");
  }
}