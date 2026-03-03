import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Plus, Pencil, Trash2, Image, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface BrandLogo {
  id: number;
  keyword: string;
  displayName: string;
  url: string;
  isTamiyaStamp: boolean;
}

interface LogoFormState {
  keyword: string;
  displayName: string;
  isTamiyaStamp: boolean;
  file: File | null;
}

const DEFAULT_FORM: LogoFormState = {
  keyword: "",
  displayName: "",
  isTamiyaStamp: false,
  file: null,
};

export function AdminBrandLogos() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [editLogo, setEditLogo] = useState<BrandLogo | null>(null);
  const [deleteLogo, setDeleteLogo] = useState<BrandLogo | null>(null);
  const [form, setForm] = useState<LogoFormState>(DEFAULT_FORM);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { data: logos, isLoading } = useQuery<BrandLogo[]>({
    queryKey: ["/api/brand-logos"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: LogoFormState) => {
      const fd = new FormData();
      fd.append("keyword", data.keyword);
      fd.append("displayName", data.displayName);
      fd.append("isTamiyaStamp", String(data.isTamiyaStamp));
      if (data.file) fd.append("logo", data.file);
      const res = await fetch("/api/admin/brand-logos", { method: "POST", body: fd });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brand-logos"] });
      setAddOpen(false);
      setForm(DEFAULT_FORM);
      setPreviewUrl(null);
      toast({ title: "Logo added" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: LogoFormState }) => {
      const fd = new FormData();
      fd.append("keyword", data.keyword);
      fd.append("displayName", data.displayName);
      fd.append("isTamiyaStamp", String(data.isTamiyaStamp));
      if (data.file) fd.append("logo", data.file);
      const res = await fetch(`/api/admin/brand-logos/${id}`, { method: "PUT", body: fd });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brand-logos"] });
      setEditLogo(null);
      setForm(DEFAULT_FORM);
      setPreviewUrl(null);
      toast({ title: "Logo updated" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/brand-logos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brand-logos"] });
      setDeleteLogo(null);
      toast({ title: "Logo deleted" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setForm(f => ({ ...f, file }));
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  }

  function openEdit(logo: BrandLogo) {
    setEditLogo(logo);
    setForm({ keyword: logo.keyword, displayName: logo.displayName, isTamiyaStamp: logo.isTamiyaStamp, file: null });
    setPreviewUrl(null);
  }

  function openAdd() {
    setForm(DEFAULT_FORM);
    setPreviewUrl(null);
    setAddOpen(true);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Image className="w-5 h-5" />
                Brand Logos
              </CardTitle>
              <CardDescription className="mt-1">
                Logos used when printing model cards. The stamp logo appears on every card; brand logos appear when the model name contains the keyword.
              </CardDescription>
            </div>
            <Button onClick={openAdd} size="sm" className="font-mono">
              <Plus className="w-4 h-4 mr-2" />
              Add Logo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : !logos?.length ? (
            <div className="text-center py-12 text-muted-foreground font-mono">
              <Image className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No brand logos configured yet.</p>
              <p className="text-xs mt-1">Add logos to have them appear on printed model cards.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logos.map(logo => (
                <div key={logo.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="w-16 h-10 bg-white dark:bg-gray-800 rounded border flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <img src={logo.url} alt={logo.displayName} className="max-w-full max-h-full object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium text-sm">{logo.displayName}</span>
                      {logo.isTamiyaStamp && (
                        <Badge className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-200">
                          <Star className="w-3 h-3 mr-1" />
                          Stamp
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">keyword: {logo.keyword}</span>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button variant="outline" size="sm" onClick={() => openEdit(logo)}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => setDeleteLogo(logo)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={v => { setAddOpen(v); if (!v) { setForm(DEFAULT_FORM); setPreviewUrl(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-mono">Add Brand Logo</DialogTitle>
            <DialogDescription>Upload a logo and assign a keyword that will be matched against model names.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="font-mono text-xs">Display Name</Label>
              <Input value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} placeholder="e.g. Volkswagen" className="font-mono" />
            </div>
            <div className="space-y-1">
              <Label className="font-mono text-xs">Keyword</Label>
              <Input value={form.keyword} onChange={e => setForm(f => ({ ...f, keyword: e.target.value.toLowerCase() }))} placeholder="e.g. volkswagen" className="font-mono" />
              <p className="text-xs text-muted-foreground">Matched case-insensitively against model names.</p>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.isTamiyaStamp} onCheckedChange={v => setForm(f => ({ ...f, isTamiyaStamp: v }))} />
              <div>
                <Label className="font-mono text-xs">Tamiya Stamp</Label>
                <p className="text-xs text-muted-foreground">Shown on every card regardless of model name.</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-mono text-xs">Logo File</Label>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              <Button variant="outline" className="w-full font-mono" onClick={() => fileInputRef.current?.click()}>
                <Image className="w-4 h-4 mr-2" />
                {form.file ? form.file.name : "Choose image..."}
              </Button>
              {previewUrl && (
                <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                  <img src={previewUrl} alt="preview" className="max-h-full max-w-full object-contain" />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddOpen(false); setForm(DEFAULT_FORM); setPreviewUrl(null); }}>Cancel</Button>
            <Button
              onClick={() => createMutation.mutate(form)}
              disabled={!form.keyword || !form.displayName || !form.file || createMutation.isPending}
              className="font-mono"
            >
              {createMutation.isPending ? "Uploading..." : "Add Logo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editLogo} onOpenChange={v => { if (!v) { setEditLogo(null); setForm(DEFAULT_FORM); setPreviewUrl(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-mono">Edit Brand Logo</DialogTitle>
            <DialogDescription>Update the logo details or replace the image file.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="font-mono text-xs">Display Name</Label>
              <Input value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} className="font-mono" />
            </div>
            <div className="space-y-1">
              <Label className="font-mono text-xs">Keyword</Label>
              <Input value={form.keyword} onChange={e => setForm(f => ({ ...f, keyword: e.target.value.toLowerCase() }))} className="font-mono" />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.isTamiyaStamp} onCheckedChange={v => setForm(f => ({ ...f, isTamiyaStamp: v }))} />
              <div>
                <Label className="font-mono text-xs">Tamiya Stamp</Label>
                <p className="text-xs text-muted-foreground">Shown on every card regardless of model name.</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-mono text-xs">Replace Image (optional)</Label>
              <input ref={editFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              <Button variant="outline" className="w-full font-mono" onClick={() => editFileInputRef.current?.click()}>
                <Image className="w-4 h-4 mr-2" />
                {form.file ? form.file.name : "Choose new image..."}
              </Button>
              {(previewUrl || editLogo?.url) && (
                <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                  <img src={previewUrl ?? editLogo?.url} alt="preview" className="max-h-full max-w-full object-contain" />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditLogo(null); setForm(DEFAULT_FORM); setPreviewUrl(null); }}>Cancel</Button>
            <Button
              onClick={() => editLogo && updateMutation.mutate({ id: editLogo.id, data: form })}
              disabled={!form.keyword || !form.displayName || updateMutation.isPending}
              className="font-mono"
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteLogo} onOpenChange={v => { if (!v) setDeleteLogo(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete logo?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <strong>{deleteLogo?.displayName}</strong> from the brand logos list. It will no longer appear on printed model cards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteLogo && deleteMutation.mutate(deleteLogo.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
