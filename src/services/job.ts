import { BaseRoute } from "./routes";
import z from "zod";

export const jobApplicationSchema = z.object({
  jobUrl: z.url(),
});

export async function applyToJob(data: z.infer<typeof jobApplicationSchema>) {
  const response = await fetch(`${BaseRoute}/jobs/apply`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (response.status > 299) {
    throw new Error("Failed to apply to job");
  }
  return response.json();
}