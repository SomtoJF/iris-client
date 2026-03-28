import { BaseRoute } from "./routes";

export interface CostTrackingUser {
  id: string;
  name: string;
  email: string;
}

export interface CostTrackingJobApplication {
  id: string;
  title: string;
  company_name: string;
}

export interface CostTrackingRecord {
  id: string;
  type: string;
  user: CostTrackingUser;
  job_application?: CostTrackingJobApplication;
  model: string;
  input_tokens: number;
  output_tokens: number;
  input_cost: number;
  output_cost: number;
  total_cost: number;
  created_at: string;
  updated_at: string;
}

export interface GetCostTrackingResponse {
  data: CostTrackingRecord[];
  total_accumulated_cost: number;
  total: number;
  page: number;
  limit: number;
}

export interface SearchCostEntitiesResponse {
  users: CostTrackingUser[];
  job_applications: CostTrackingJobApplication[];
}

export async function fetchCostTracking(
  page: number,
  limit: number,
  userId?: string,
  jobApplicationId?: string,
): Promise<GetCostTrackingResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (userId) params.set("user_id", userId);
  if (jobApplicationId) params.set("job_application_id", jobApplicationId);
  const response = await fetch(`${BaseRoute}/cost?${params}`, {
    method: "GET",
    credentials: "include",
  });
  const res = await response.json();
  if (response.status !== 200) {
    throw new Error(res.error ?? "Failed to fetch cost tracking");
  }
  return res;
}

export async function searchCostEntities(query: string): Promise<SearchCostEntitiesResponse> {
  const params = new URLSearchParams({ q: query });
  const response = await fetch(`${BaseRoute}/cost/search?${params}`, {
    method: "GET",
    credentials: "include",
  });
  const res = await response.json();
  if (response.status !== 200) {
    throw new Error(res.error ?? "Failed to search cost entities");
  }
  return res;
}
