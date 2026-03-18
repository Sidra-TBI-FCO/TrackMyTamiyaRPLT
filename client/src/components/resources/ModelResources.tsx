import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { FileText, FileImage, FileSpreadsheet, Upload, ScanLine, Trash2, ExternalLink, Download, Pencil, Check, X, Loader2, FolderOpen } from "lucide-react";
import type { ModelDocument } from "@shared/schema";
import DocumentScanner from "./DocumentScanner";
import { format } from "date-fns";

const DOC_TYPES = [
  { value: "manual", label: "Manual" },
  { value: "setup_sheet", label: "Setup Sheet" },
  { value: "leaflet", label: "Parts Leaflet" },
  { value: "other", label: "Other" },
];

function docTypeLabel(t: string) {
  return DOC_TYPES.find(d => d.value === t)?.label ?? "Other";
}

function docTypeColor(t: string) {
  switch (t) {
    case "manual": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    case "setup_sheet": return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
    case "leaflet": return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
    default: return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  }
}

function FileIcon({ name, url }: { name: string; url: string }) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["xls", "xlsx", "csv"].includes(ext)) return <FileSpreadsheet className="h-5 w-5 text-green-700 shrink-0" />;
  if (["jpg", "jpeg", "png", "webp", "heic", "gif"].includes(ext) || url.includes("image")) return <FileImage className="h-5 w-5 text-green-600 shrink-0" />;
  return <FileText className="h-5 w-5 text-blue-600 shrink-0" />;
}

function formatBytes(b: number | null | undefined) {
  if (!b) return "";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

interface DocRowProps {
  doc: ModelDocument;
  modelId: number;
}

function DocRow({ doc, modelId }: DocRowProps) {
  const [editing, setEditing] = useState(false);
  const [descVal, setDescVal] = useState(doc.description ?? "");
  const [typeVal, setTypeVal] = useState(doc.documentType);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const updateMut = useMutation({
    mutationFn: () =>
      fetch(`/api/models/${modelId}/documents/${doc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ description: descVal || null, documentType: typeVal }),
      }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/models", modelId, "documents"] });
      setEditing(false);
      toast({ title: "Saved" });
    },
    onError: () => toast({ title: "Failed to save changes", variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: () =>
      fetch(`/api/models/${modelId}/documents/${doc.id}`, {
        method: "DELETE",
        credentials: "include",
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/models", modelId, "documents"] }),
    onError: () => toast({ title: "Failed to delete document", variant: "destructive" }),
  });

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = doc.url;
    a.download = doc.originalName;
    a.target = "_blank";
    a.click();
  };

  return (
    <>
      <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/30 transition-colors group">
        <div className="pt-0.5">
          <FileIcon name={doc.originalName} url={doc.url} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium hover:underline truncate max-w-[180px]"
              title={doc.originalName}
            >
              {doc.originalName}
            </a>
            <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {editing ? (
            <div className="mt-2 flex flex-col gap-2">
              <Select value={typeVal} onValueChange={setTypeVal}>
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={descVal}
                onChange={e => setDescVal(e.target.value)}
                placeholder="Add a description…"
                className="h-7 text-xs"
              />
              <div className="flex gap-1">
                <Button size="sm" className="h-6 text-xs px-2 bg-green-600 hover:bg-green-700" onClick={() => updateMut.mutate()} disabled={updateMut.isPending}>
                  {updateMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Save
                </Button>
                <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => { setEditing(false); setDescVal(doc.description ?? ""); setTypeVal(doc.documentType); }}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-0.5 space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${docTypeColor(doc.documentType)}`}>
                  {docTypeLabel(doc.documentType)}
                </span>
                {doc.fileSize ? <span className="text-[10px] text-muted-foreground">{formatBytes(doc.fileSize)}</span> : null}
              </div>
              {doc.description && (
                <p className="text-xs text-muted-foreground truncate" title={doc.description}>{doc.description}</p>
              )}
              <p className="text-[10px] text-muted-foreground">
                {format(new Date(doc.createdAt), "MMM d, yyyy")}
              </p>
            </div>
          )}
        </div>

        {!editing && (
          <div className="flex gap-1 shrink-0">
            <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" title="Download" onClick={handleDownload}>
              <Download className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{doc.originalName}</strong>. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => { setConfirmDelete(false); deleteMut.mutate(); }}
              disabled={deleteMut.isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface ModelResourcesProps {
  modelId: number;
  className?: string;
}

export default function ModelResources({ modelId, className }: ModelResourcesProps) {
  const [uploading, setUploading] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [uploadType, setUploadType] = useState("other");
  const [uploadDesc, setUploadDesc] = useState("");
  const [showUploadForm, setShowUploadForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: docs = [], isLoading } = useQuery<ModelDocument[]>({
    queryKey: ["/api/models", modelId, "documents"],
    queryFn: () =>
      fetch(`/api/models/${modelId}/documents`, { credentials: "include" }).then(r => r.json()),
  });

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file, file.name);
      fd.append("documentType", uploadType);
      if (uploadDesc) fd.append("description", uploadDesc);

      const res = await fetch(`/api/models/${modelId}/documents`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      if (!res.ok) throw new Error("Upload failed");

      qc.invalidateQueries({ queryKey: ["/api/models", modelId, "documents"] });
      setShowUploadForm(false);
      setUploadDesc("");
      setUploadType("other");
      toast({ title: "Document uploaded" });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    files.forEach(uploadFile);
  };

  const handleScanResult = (file: File) => uploadFile(file);

  return (
    <>
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="font-mono text-base flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-green-600" />
            Resources
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : docs.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No documents yet. Upload manuals, setup sheets, or parts leaflets.
            </p>
          ) : (
            <div className="space-y-2">
              {docs.map(doc => (
                <DocRow key={doc.id} doc={doc} modelId={modelId} />
              ))}
            </div>
          )}

          {showUploadForm && (
            <div className="border border-dashed border-muted rounded-lg p-3 space-y-2">
              <Select value={uploadType} onValueChange={setUploadType}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Document type" />
                </SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={uploadDesc}
                onChange={e => setUploadDesc(e.target.value)}
                placeholder="Description (optional)"
                className="h-8 text-xs"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs h-8"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading
                    ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Uploading…</>
                    : <><Upload className="h-3 w-3 mr-1" />Choose File(s)</>}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs h-8"
                  onClick={() => { setScannerOpen(true); setShowUploadForm(false); }}
                >
                  <ScanLine className="h-3 w-3 mr-1" />Scan
                </Button>
                <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setShowUploadForm(false)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {!showUploadForm && (
            <div className="flex gap-2 pt-1">
              <Button size="sm" variant="outline" className="flex-1 text-xs h-8" onClick={() => setShowUploadForm(true)}>
                <Upload className="h-3 w-3 mr-1" />Upload
              </Button>
              <Button size="sm" variant="outline" className="flex-1 text-xs h-8" onClick={() => setScannerOpen(true)}>
                <ScanLine className="h-3 w-3 mr-1" />Scan
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      <DocumentScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onResult={handleScanResult}
      />
    </>
  );
}
