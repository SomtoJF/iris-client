import { apiFetch } from "./api";

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
  return apiFetch(`/cost?${params}`, {
    method: "GET",
    fallbackError: "Failed to fetch cost tracking",
  });
}

export async function searchCostEntities(query: string): Promise<SearchCostEntitiesResponse> {
  const params = new URLSearchParams({ q: query });
  return apiFetch(`/cost/search?${params}`, {
    method: "GET",
    fallbackError: "Failed to search cost entities",
  });
}
