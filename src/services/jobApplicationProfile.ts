import { BaseRoute } from "./routes";
import z from "zod";

export const jobApplicationProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone is required").max(50),
  address: z.string().min(1, "Address is required").max(200),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().min(1, "State is required").max(100),
  zip: z.string().min(1, "ZIP is required").max(20),
  countryOfResidence: z.string().min(1, "Country of residence is required"),
  isVeteran: z.boolean(),
  countriesOfCitizenship: z.array(z.string()).min(1, "Select at least one country of citizenship"),
  gender: z.string().min(1, "Gender is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
});

export type JobApplicationProfileFormValues = z.infer<typeof jobApplicationProfileSchema>;

export interface JobApplicationProfileResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  countryOfResidence: string;
  isVeteran: boolean;
  countriesOfCitizenship: string[];
  gender: string;
  dateOfBirth: string;
}

export type UpdateJobApplicationProfileRequest = Omit<
  JobApplicationProfileResponse,
  "id"
>;

export async function getJobApplicationProfile(): Promise<JobApplicationProfileResponse> {
  const response = await fetch(`${BaseRoute}/jobapplicationprofile`, {
    method: "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  const res = await response.json();
  if (response.status !== 200) {
    throw new Error(res.error ?? "Failed to fetch job application profile");
  }
  return res.data;
}

export async function upsertJobApplicationProfile(
  data: UpdateJobApplicationProfileRequest
): Promise<void> {
  const response = await fetch(`${BaseRoute}/jobapplicationprofile`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const res = await response.json();
  if (response.status !== 200) {
    throw new Error(res.error ?? "Failed to save job application profile");
  }
}
