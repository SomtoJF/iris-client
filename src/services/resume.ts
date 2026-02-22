import { BaseRoute } from "./routes";

export interface Resume {
  id: string;
  fileName: string;
  fileSize: number;
  fileKey: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function fetchResumes(): Promise<Resume[]> {
  const response = await fetch(`${BaseRoute}/resumes`, {
    method: "GET",
    credentials: "include",
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
    credentials: "include",
  });
  const res = await response.json();
  if (response.status !== 200) {
    throw new Error(res.error ?? "Failed to set resume as active");
  }
}

export async function uploadResume(file: File): Promise<Resume> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${BaseRoute}/resumes`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  const res = await response.json();
  if (response.status !== 201) {
    throw new Error(res.error ?? "Failed to upload resume");
  }
  return res.data;
}

export async function deleteResume(id: string): Promise<void> {
  const response = await fetch(`${BaseRoute}/resumes/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  const res = await response.json();
  if (response.status !== 200) {
    throw new Error(res.error ?? "Failed to delete resume");
  }
}

export async function getResumeDownloadUrl(id: string): Promise<string> {
  const response = await fetch(`${BaseRoute}/resumes/${id}/download`, {
    method: "GET",
    credentials: "include",
  });

  const res = await response.json();
  if (response.status !== 200) {
    throw new Error(res.error ?? "Failed to get download URL");
  }
  return res.url;
}
