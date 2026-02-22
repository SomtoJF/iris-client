import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Trash2, Download } from "lucide-react";
import {
  fetchResumes,
  setResumeAsActive,
  deleteResume,
  getResumeDownloadUrl,
  type Resume,
} from "@/services/resume";
import { toast } from "@/hooks/toast";

interface ResumeUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (file: File) => void;
  isLoading?: boolean;
}

export default function ResumeUploadDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading: externalLoading = false,
}: ResumeUploadDialogProps) {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loading = isLoading || externalLoading;

  useEffect(() => {
    if (open) {
      loadResumes();
    }
  }, [open]);

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

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only PDF, DOC, and DOCX files are allowed");
      return;
    }

    // Validate file size (2MB = 2 * 1024 * 1024 bytes)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
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

  async function handleSubmit() {
    if (!selectedFile) return;

    await onSubmit(selectedFile);

    // Reset and reload
    setSelectedFile(null);
    await loadResumes();
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

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Resume</DialogTitle>
          <DialogDescription>
            Upload your resume in PDF, DOC, or DOCX format (max 2MB). You can
            manage your existing resumes below.
          </DialogDescription>
        </DialogHeader>

        {/* Resume List */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {resumes.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No resumes uploaded yet
            </p>
          ) : (
            resumes.map((resume) => (
              <div
                key={resume.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{resume.fileName}</p>
                    {resume.isActive && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
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
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="outline"
                    disabled={loading}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(resume.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragOver
              ? "border-purple-500 bg-purple-50 shadow-lg shadow-purple-200"
              : "border-gray-300 hover:border-gray-400"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById("file-input")?.click()}
        >
          <input
            id="file-input"
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
          />
          <Upload className="w-10 h-10 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600">
            Click or drag PDF/DOC/DOCX (max 2MB)
          </p>
          {selectedFile && (
            <p className="text-xs text-purple-600 mt-2">
              Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)}
              )
            </p>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            disabled={!selectedFile || loading}
            onClick={handleSubmit}
          >
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
