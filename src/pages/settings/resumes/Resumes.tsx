import { useEffect, useState } from "react";
import { Download, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePageTitle } from "@/hooks/page-title";
import { toast } from "@/hooks/toast";
import { deleteResume, fetchResumes, getResumeDownloadUrl, setResumeAsActive, updateResumeDisplayName, uploadResume, type Resume } from "@/services/resume";

const ALLOWED_TYPES = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
const MAX_SIZE = 2 * 1024 * 1024;

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Resumes() {
  usePageTitle("Resumes");
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [updatedName, setUpdatedName] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function loadResumes() {
    try { setIsLoading(true); setResumes(await fetchResumes()); }
    catch (error) { console.error(error); toast.error("Failed to load resumes"); }
    finally { setIsLoading(false); }
  }
  useEffect(() => { void loadResumes(); }, []);

  function selectFile(file: File | null) {
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) return void toast.error("Only PDF, DOC, and DOCX files are allowed");
    if (file.size > MAX_SIZE) return void toast.error("File size must be less than 2MB");
    setSelectedFile(file);
  }
  async function handleUpload() {
    if (!selectedFile) return;
    try { setIsLoading(true); await uploadResume(selectedFile, false, displayName); toast.success("Resume uploaded successfully"); setSelectedFile(null); setDisplayName(""); await loadResumes(); }
    catch (error) { console.error(error); toast.error(error instanceof Error ? error.message : "Failed to upload resume"); }
    finally { setIsLoading(false); }
  }
  async function activate(id: string) {
    try { setIsLoading(true); await setResumeAsActive(id); toast.success("Resume set as active"); await loadResumes(); }
    catch (error) { console.error(error); toast.error("Failed to set resume as active"); }
    finally { setIsLoading(false); }
  }
  async function download(id: string, fileName: string) {
    try { setIsLoading(true); const url = await getResumeDownloadUrl(id); const link = document.createElement("a"); link.href = url; link.download = fileName; link.click(); }
    catch (error) { console.error(error); toast.error("Failed to download resume"); }
    finally { setIsLoading(false); }
  }
  async function remove(id: string) {
    try { setIsLoading(true); await deleteResume(id); toast.success("Resume deleted successfully"); await loadResumes(); }
    catch (error) { console.error(error); toast.error("Failed to delete resume"); }
    finally { setIsLoading(false); }
  }
  async function saveName() {
    if (!editingId) return;
    const resume = resumes.find((item) => item.id === editingId);
    const name = updatedName.trim(); setEditingId(null);
    if (!resume || !name || name === (resume.displayName || resume.fileName)) return;
    try { await updateResumeDisplayName(resume.id, name); toast.success("Display name updated"); await loadResumes(); }
    catch (error) { console.error(error); toast.error("Failed to update display name"); }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div><h1 className="text-xl font-semibold">Resumes</h1><p className="mt-1 text-sm text-muted-foreground">Upload and manage the resumes Iris uses for applications.</p></div>
      <Card>
        <CardHeader><CardTitle>Upload a resume</CardTitle><CardDescription>PDF, DOC, or DOCX files up to 2MB.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div><Label htmlFor="resume-display-name">Display name (optional)</Label><Input id="resume-display-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="mt-2" placeholder="e.g. Backend resume" /></div>
          <div className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${isDragOver ? "border-purple-500 bg-purple-50" : "border-gray-300 hover:border-gray-400"}`} onDragOver={(event) => { event.preventDefault(); setIsDragOver(true); }} onDragLeave={() => setIsDragOver(false)} onDrop={(event) => { event.preventDefault(); setIsDragOver(false); selectFile(event.dataTransfer.files[0]); }} onClick={() => document.getElementById("resume-file-input")?.click()}>
            <input id="resume-file-input" type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(event) => selectFile(event.target.files?.[0] || null)} />
            <Upload className="mx-auto mb-2 h-10 w-10 text-gray-400" /><p className="text-sm text-gray-600">Click or drag a resume here</p>{selectedFile && <p className="mt-2 text-xs text-purple-600">Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})</p>}
          </div>
          <Button disabled={!selectedFile || isLoading} onClick={() => void handleUpload()}>{isLoading && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}Upload resume</Button>
        </CardContent>
      </Card>
      <Card><CardHeader><CardTitle>Your resumes</CardTitle><CardDescription>Choose an active resume or manage your saved files.</CardDescription></CardHeader><CardContent className="space-y-2">
        {isLoading && resumes.length === 0 ? <p className="py-4 text-center text-sm text-muted-foreground">Loading resumes...</p> : resumes.length === 0 ? <p className="py-4 text-center text-sm text-muted-foreground">No resumes uploaded yet.</p> : resumes.map((resume) => <div key={resume.id} className="flex items-center justify-between gap-3 rounded-lg border bg-gray-50 p-3"><div className="min-w-0 flex-1">{editingId === resume.id ? <Input autoFocus value={updatedName} onChange={(event) => setUpdatedName(event.target.value)} onBlur={() => void saveName()} onKeyDown={(event) => { if (event.key === "Enter") void saveName(); if (event.key === "Escape") setEditingId(null); }} /> : <button className="truncate text-left text-sm font-medium hover:underline" onClick={() => { setEditingId(resume.id); setUpdatedName(resume.displayName || resume.fileName); }}>{resume.displayName || resume.fileName}</button>}{resume.displayName && <p className="truncate text-xs text-gray-500">{resume.fileName}</p>}<p className="text-xs text-gray-500">{formatFileSize(resume.fileSize)}</p></div><div className="flex shrink-0 gap-1">{resume.isActive ? <span className="self-center rounded bg-purple-100 px-2 py-0.5 text-xs text-purple-700">Active</span> : <Button size="sm" variant="outline" disabled={isLoading} onClick={() => void activate(resume.id)}>Set Active</Button>}<Button size="icon-sm" variant="outline" disabled={isLoading} onClick={() => void download(resume.id, resume.fileName)}><Download className="h-4 w-4" /></Button><Button size="icon-sm" variant="outline" disabled={isLoading} className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => void remove(resume.id)}><Trash2 className="h-4 w-4" /></Button></div></div>)}
      </CardContent></Card>
    </div>
  );
}
