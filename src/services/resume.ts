import { BaseRoute } from "./routes";

export interface Resume {
  id: string;
  fileName: string;
  fileSize: number;
  url: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function fetchResumes(): Promise<Resume[]> {
  const response = await fetch(`${BaseRoute}/resumes`, {
    method: "GET",
  });
  const res = await response.json();
  if (response.status !== 200) {
    throw new Error(res.error ?? "Failed to fetch resumes");
  }
  return res.data;
}

export async function setResumeAsActive(id: string): Promise<void> {
  const response = await fetch(`${BaseRoute}/resumes/${id}/activate`, {
    method: "PUT",
  });
  const res = await response.json();
  if (response.status !== 200) {
    throw new Error(res.error ?? "Failed to set resume as active");
  }
}
