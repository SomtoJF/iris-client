import { BaseRoute } from "./routes";

export async function applyToJob(url: string) {
  const response = await fetch(`${BaseRoute}/jobs/apply`, {
    method: "POST",
    body: JSON.stringify({ url }),
  });
  return response.json();
}