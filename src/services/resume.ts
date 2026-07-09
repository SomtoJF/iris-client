import { apiFetch } from "./api";

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
  const res = await apiFetch("/resumes", {
    method: "GET",
    fallbackError: "Failed to fetch resumes",
  });
  return res.data;
}

export async function setResumeAsActive(id: string): Promise<void> {
  await apiFetch(`/resumes/${id}/activate`, {
    method: "PUT",
    fallbackError: "Failed to set resume as active",
  });
}

export async function uploadResume(file: File, processResume: boolean = false): Promise<Resume> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("processResume", processResume.toString());

  const res = await apiFetch("/resumes", {
    method: "POST",
    body: formData,
    fallbackError: "Failed to upload resume",
  });
  return res.data;
}

export async function deleteResume(id: string): Promise<void> {
  await apiFetch(`/resumes/${id}`, {
    method: "DELETE",
    fallbackError: "Failed to delete resume",
  });
}

export async function getResumeDownloadUrl(id: string): Promise<string> {
  const res = await apiFetch(`/resumes/${id}/download`, {
    method: "GET",
    fallbackError: "Failed to get download URL",
  });
  return res.url;
}
