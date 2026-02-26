import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Upload, Trash2, Download, Loader2 } from "lucide-react";
import {
  fetchResumes,
  setResumeAsActive,
  deleteResume,
  getResumeDownloadUrl,
  uploadResume,
  type Resume,
} from "@/services/resume";
import { toast } from "@/hooks/toast";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function ResumeOnboardingPage() {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadResumes();
  }, []);

  async function loadResumes() {
    try {
      setIsLoading(true);
      const data = await fetchResumes();
      setResumes(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load resumes");
    } finally {
      setIsLoading(false);
    }
  }

  function handleFileSelect(file: File | null) {
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Only PDF, DOC, and DOCX files are allowed");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("File size must be less than 2MB");
      return;
    }
    setSelectedFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  }

  async function handleUpload() {
    if (!selectedFile) return;
    try {
      setIsUploading(true);
      await uploadResume(selectedFile, true);
      toast.success("Resume uploaded successfully");
      setSelectedFile(null);
      await loadResumes();
      navigate("/onboarding/application");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload resume",
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSetActive(id: string) {
    try {
      setIsLoading(true);
      await setResumeAsActive(id);
      toast.success("Resume set as active");
      await loadResumes();
    } catch (error) {
      console.error(error);
      toast.error("Failed to set resume as active");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDownload(id: string, fileName: string) {
    try {
      setIsLoading(true);
      const url = await getResumeDownloadUrl(id);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
    } catch (error) {
      console.error(error);
      toast.error("Failed to download resume");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      setIsLoading(true);
      await deleteResume(id);
      toast.success("Resume deleted successfully");
      await loadResumes();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete resume");
    } finally {
      setIsLoading(false);
    }
  }

  const loading = isLoading || isUploading;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg border bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">
              Upload your resume
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Upload your resume in PDF, DOC, or DOCX format (max 2MB). You can
              manage your existing resumes below.
            </p>
          </div>

          {/* Resume list */}
          <div className="mb-6 space-y-2 max-h-60 overflow-y-auto">
            {resumes.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-500">
                No resumes uploaded yet
              </p>
            ) : (
              resumes.map((resume) => (
                <div
                  key={resume.id}
                  className="flex items-center justify-between rounded-lg border bg-gray-50 p-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{resume.fileName}</p>
                      {resume.isActive && (
                        <span className="rounded bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(resume.fileSize)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={resume.isActive || loading}
                      onClick={() => handleSetActive(resume.id)}
                    >
                      Set Active
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="outline"
                      disabled={loading}
                      onClick={() => handleDownload(resume.id, resume.fileName)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="outline"
                      disabled={loading}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => handleDelete(resume.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Upload area */}
          <div
            className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
              isDragOver
                ? "border-purple-500 bg-purple-50 shadow-lg shadow-purple-200"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() =>
              document.getElementById("resume-file-input")?.click()
            }
          >
            <input
              id="resume-file-input"
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
            />
            <Upload className="mx-auto mb-2 h-10 w-10 text-gray-400" />
            <p className="text-sm text-gray-600">
              Click or drag PDF/DOC/DOCX (max 2MB)
            </p>
            {selectedFile && (
              <p className="mt-2 text-xs text-purple-600">
                Selected: {selectedFile.name} (
                {formatFileSize(selectedFile.size)})
              </p>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              type="button"
              disabled={!selectedFile || loading}
              onClick={handleUpload}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  Uploading
                </>
              ) : (
                "Upload"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
