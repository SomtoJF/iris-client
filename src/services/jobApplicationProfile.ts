import { BaseRoute } from "./routes";
import z from "zod";
import { countries } from "country-data-list";

export const LANGUAGE_PROFICIENCY_OPTIONS = [
  {
    value: "native_bilingual",
    label: "Native / Bilingual",
    description: "Mother tongue or perfect native ability.",
  },
  {
    value: "full_professional",
    label: "Full Professional Proficiency",
    description:
      "Can communicate fluently and accurately in nearly all work situations.",
  },
  {
    value: "professional_working",
    label: "Professional Working Proficiency",
    description:
      "Can participate effectively in most conversations at work and handle tasks independently.",
  },
  {
    value: "limited_working",
    label: "Limited Working Proficiency",
    description:
      "Can handle routine or simple work tasks with basic conversations and instructions.",
  },
  {
    value: "elementary",
    label: "Elementary Proficiency",
    description:
      "Can communicate at a very basic level, such as greetings or simple travel needs.",
  },
] as const;

export const WORKING_ARRANGEMENT_OPTIONS = [
  { value: "remote", label: "Remote work" },
  { value: "hybrid", label: "Hybrid work (some days remote, some days in-office)" },
  { value: "in_office", label: "Fully in-office" },
] as const;

export const CURRENCY_CODES = Array.from(
  new Set(
    countries.all
      .filter((c) => c.status !== "deleted" && c.ioc !== "PRK")
      .flatMap((c) => c.currencies ?? [])
      .filter(Boolean),
  ),
).sort((a, b) => a.localeCompare(b));

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
  salaryMin: z.number().nullable().optional(),
  salaryMax: z.number().nullable().optional(),
  salaryCurrency: z.string().optional(),
  ethnicity: z.string().optional(),
  isOpenToRelocating: z.boolean().nullable(),
  noticePeriodDays: z.number().int().min(0, "Notice period must be 0 or more").nullable(),
  preferredWorkingArrangement: z
    .array(z.enum(["remote", "hybrid", "in_office"]))
    .default([]),
  languageProficiencies: z
    .array(
      z.object({
        language: z.string().min(1, "Language is required"),
        proficiency: z.string().min(1, "Proficiency is required"),
      }),
    )
    .default([]),
  linkedinUrl: z
    .string()
    .min(1, "LinkedIn URL is required")
    .refine(
      (v) => v.startsWith("https://") && v.includes("linkedin.com/in"),
      "Must be a valid LinkedIn profile URL (https://linkedin.com/in/...)",
    ),
  portfolioLink: z.string().url("Invalid URL").nullable().optional(),
});

export type JobApplicationProfileFormValues = z.infer<typeof jobApplicationProfileSchema>;

export interface LanguageProficiency {
  language: string;
  proficiency: string;
}

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
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string;
  ethnicity?: string;
  isOpenToRelocating: boolean | null;
  noticePeriodDays: number | null;
  preferredWorkingArrangement: Array<"remote" | "hybrid" | "in_office">;
  languageProficiencies: LanguageProficiency[];
  linkedinUrl: string;
  portfolioLink?: string | null;
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

export async function patchJobApplicationProfile(
  data: Partial<UpdateJobApplicationProfileRequest>
): Promise<void> {
  const response = await fetch(`${BaseRoute}/jobapplicationprofile`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const res = await response.json();
  if (response.status !== 200) {
    throw new Error(res.error ?? "Failed to update job application profile");
  }
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
