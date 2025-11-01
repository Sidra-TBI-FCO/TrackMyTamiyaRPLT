import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Edit, Trash2, Image as ImageIcon, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FeatureScreenshot {
  id: number;
  title: string;
  description: string | null;
  category: string;
  imageUrl: string;
  route: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function AdminScreenshots() {
  const { toast } = useToast();
  const [editingScreenshot, setEditingScreenshot] = useState<FeatureScreenshot | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "desktop",
    route: "",
    sortOrder: 0,
    isActive: true,
  });
  
  const { data: screenshots, isLoading } = useQuery<FeatureScreenshot[]>({
    queryKey: ["/api/admin/screenshots"],
  });
  
  const uploadScreenshotMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("screenshot", file);
      
      const response = await fetch("/api/admin/upload-screenshot", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Upload failed");
      }
      
      return response.json();
    },
  });
  
  const createScreenshotMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/admin/screenshots", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/screenshots"] });
      toast({ title: "Screenshot created successfully" });
      setShowAddDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Failed to create screenshot", description: error.message, variant: "destructive" });
    },
  });
  
  const updateScreenshotMutation = useMutation({
    mutationFn: async (data: { id: number; updates: any }) => {
      return apiRequest("PUT", `/api/admin/screenshots/${data.id}`, data.updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/screenshots"] });
      toast({ title: "Screenshot updated successfully" });
      setShowEditDialog(false);
    },
    onError: () => {
      toast({ title: "Failed to update screenshot", variant: "destructive" });
    },
  });
  
  const deleteScreenshotMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/admin/screenshots/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/screenshots"] });
      toast({ title: "Screenshot deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete screenshot", variant: "destructive" });
    },
  });
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadingFile(e.target.files[0]);
    }
  };
  
  const handleAddScreenshot = async () => {
    if (!uploadingFile) {
      toast({ title: "Please select an image file", variant: "destructive" });
      return;
    }
    
    try {
      const uploadResult = await uploadScreenshotMutation.mutateAsync(uploadingFile);
      
      await createScreenshotMutation.mutateAsync({
        ...formData,
        imageUrl: uploadResult.url,
      });
    } catch (error: any) {
      toast({ 
        title: "Upload failed", 
        description: error.message,
        variant: "destructive" 
      });
    }
  };
  
  const handleEdit = (screenshot: FeatureScreenshot) => {
    setEditingScreenshot(screenshot);
    setFormData({
      title: screenshot.title,
      description: screenshot.description || "",
      category: screenshot.category,
      route: screenshot.route || "",
      sortOrder: screenshot.sortOrder,
      isActive: screenshot.isActive,
    });
    setShowEditDialog(true);
  };
  
  const handleUpdate = () => {
    if (!editingScreenshot) return;
    
    updateScreenshotMutation.mutate({
      id: editingScreenshot.id,
      updates: formData,
    });
  };
  
  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "desktop",
      route: "",
      sortOrder: 0,
      isActive: true,
    });
    setUploadingFile(null);
  };
  
  const openAddDialog = () => {
    resetForm();
    setShowAddDialog(true);
  };
  
  if (isLoading) {
    return <div className="text-center py-8">Loading screenshots...</div>;
  }
  
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Feature Screenshots</span>
            <Button onClick={openAddDialog} data-testid="button-add-screenshot">
              <Upload className="w-4 h-4 mr-2" />
              Upload Screenshot
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Preview</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {screenshots && screenshots.length > 0 ? (
                  screenshots.map((screenshot) => (
                    <TableRow key={screenshot.id}>
                      <TableCell>
                        <img 
                          src={screenshot.imageUrl} 
                          alt={screenshot.title}
                          className="w-16 h-12 object-cover rounded border"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{screenshot.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{screenshot.category}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {screenshot.route || "—"}
                      </TableCell>
                      <TableCell>{screenshot.sortOrder}</TableCell>
                      <TableCell>
                        <Badge variant={screenshot.isActive ? "default" : "secondary"}>
                          {screenshot.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(screenshot)}
                            data-testid={`button-edit-screenshot-${screenshot.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteScreenshotMutation.mutate(screenshot.id)}
                            disabled={deleteScreenshotMutation.isPending}
                            className="text-red-600 hover:text-red-700"
                            data-testid={`button-delete-screenshot-${screenshot.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No screenshots uploaded yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Screenshot Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload New Screenshot</DialogTitle>
            <DialogDescription>
              Add a new feature screenshot for the marketing page
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="screenshot-file">Screenshot Image</Label>
              <Input
                id="screenshot-file"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                data-testid="input-screenshot-file"
              />
              {uploadingFile && (
                <p className="text-sm text-muted-foreground mt-1">
                  Selected: {uploadingFile.name}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Model Gallery"
                data-testid="input-screenshot-title"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Browse and manage your RC car collection"
                data-testid="input-screenshot-description"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                  <SelectTrigger data-testid="select-screenshot-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mobile">Mobile</SelectItem>
                    <SelectItem value="desktop">Desktop</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="route">Route (optional)</Label>
                <Input
                  id="route"
                  value={formData.route}
                  onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                  placeholder="/models"
                  data-testid="input-screenshot-route"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Input
                id="sortOrder"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                data-testid="input-screenshot-sort-order"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddScreenshot}
              disabled={uploadScreenshotMutation.isPending || createScreenshotMutation.isPending}
              data-testid="button-save-screenshot"
            >
              {(uploadScreenshotMutation.isPending || createScreenshotMutation.isPending) ? "Uploading..." : "Upload Screenshot"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Screenshot Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Screenshot</DialogTitle>
            <DialogDescription>
              Update screenshot details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                data-testid="input-edit-screenshot-title"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                data-testid="input-edit-screenshot-description"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-category">Category</Label>
                <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                  <SelectTrigger data-testid="select-edit-screenshot-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mobile">Mobile</SelectItem>
                    <SelectItem value="desktop">Desktop</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="edit-route">Route</Label>
                <Input
                  id="edit-route"
                  value={formData.route}
                  onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                  data-testid="input-edit-screenshot-route"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-sortOrder">Sort Order</Label>
                <Input
                  id="edit-sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  data-testid="input-edit-screenshot-sort-order"
                />
              </div>
              
              <div className="flex items-center space-x-2 pt-8">
                <input
                  type="checkbox"
                  id="edit-isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded"
                  data-testid="checkbox-screenshot-active"
                />
                <Label htmlFor="edit-isActive">Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updateScreenshotMutation.isPending}
              data-testid="button-update-screenshot"
            >
              {updateScreenshotMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
