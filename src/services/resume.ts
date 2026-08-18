import { apiFetch } from "./api";

export interface Resume {
  id: string;
  displayName?: string;
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

export async function updateResumeDisplayName(
  id: string,
  displayName: string,
): Promise<Resume> {
  const res = await apiFetch(`/resumes/${id}/display-name`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ displayName }),
    fallbackError: "Failed to update display name",
  });
  return res.data;
}

export async function uploadResume(
  file: File,
  processResume: boolean = false,
  displayName?: string,
): Promise<Resume> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("processResume", processResume.toString());
  const trimmedDisplayName = displayName?.trim();
  if (trimmedDisplayName) {
    formData.append("displayName", trimmedDisplayName);
  }

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
