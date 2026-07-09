import { apiFetch } from "./api";
import type { JobApplication } from "./job";

export interface CoverLetterListItem {
  jobApplicationId: string;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  url: string;
  resumeId: string;
  status: JobApplication["status"];
  createdAt: string;
}

export interface FetchCoverLettersResponse {
  data: CoverLetterListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface CoverLetterDetail extends CoverLetterListItem {
  coverLetter: string;
}

export interface CreateCoverLetterInput {
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  url: string;
  resumeId?: string;
}

// Generation runs in the background; the response only confirms it started.
// The finished letter arrives later via a COVER_LETTER_READY realtime event.
export interface CreateCoverLetterResponse {
  jobApplicationId: string;
  status: JobApplication["status"];
}

export interface RegenerateCoverLetterInput {
  jobApplicationId: string;
  editInstructions?: string;
  ultraWrite?: boolean;
}

export async function fetchCoverLetters(
  page: number,
  limit: number,
  search?: string,
): Promise<FetchCoverLettersResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (search) params.set("search", search);
  const res = await apiFetch(`/coverletter?${params}`, {
    method: "GET",
    fallbackError: "Failed to fetch cover letters",
  });
  return res.data;
}

export async function fetchCoverLetter(
  jobApplicationId: string,
): Promise<CoverLetterDetail> {
  return apiFetch(`/coverletter/job-application/${jobApplicationId}`, {
    method: "GET",
    fallbackError: "Failed to fetch cover letter",
  });
}

export async function createCoverLetter(
  data: CreateCoverLetterInput,
): Promise<CreateCoverLetterResponse> {
  return apiFetch("/coverletter", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
    fallbackError: "Failed to create cover letter",
  });
}

export async function regenerateCoverLetter(
  data: RegenerateCoverLetterInput,
): Promise<CreateCoverLetterResponse> {
  return apiFetch("/coverletter/regenerate", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
    fallbackError: "Failed to regenerate cover letter",
  });
}
