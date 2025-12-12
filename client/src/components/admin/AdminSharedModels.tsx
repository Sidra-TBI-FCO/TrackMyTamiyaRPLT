import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Search, Share2, Eye, EyeOff, ExternalLink, Image } from "lucide-react";

interface SharedModelData {
  model: {
    id: number;
    name: string;
    itemNumber: string | null;
    publicSlug: string | null;
    isShared: boolean;
    updatedAt: string;
  };
  owner: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    sharePreference: string;
  };
  photoCount: number;
}

export function AdminSharedModels() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModel, setSelectedModel] = useState<SharedModelData | null>(null);
  const [unshareReason, setUnshareReason] = useState("");
  const [showUnshareDialog, setShowUnshareDialog] = useState(false);
  
  const { data: sharedModels, isLoading } = useQuery<SharedModelData[]>({
    queryKey: ["/api/admin/shared-models"],
  });
  
  const unshareMutation = useMutation({
    mutationFn: async ({ modelId, reason }: { modelId: number; reason: string }) => {
      return apiRequest("POST", `/api/admin/shared-models/${modelId}/unshare`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/shared-models"] });
      queryClient.invalidateQueries({ queryKey: ["/api/community/models"] });
      toast({ title: "Model unshared successfully" });
      setShowUnshareDialog(false);
      setUnshareReason("");
      setSelectedModel(null);
    },
    onError: () => {
      toast({ title: "Failed to unshare model", variant: "destructive" });
    },
  });
  
  const filteredModels = sharedModels?.filter(sm => {
    const searchLower = searchQuery.toLowerCase();
    return (
      sm.model.name.toLowerCase().includes(searchLower) ||
      sm.owner.email.toLowerCase().includes(searchLower) ||
      (sm.owner.firstName?.toLowerCase() || "").includes(searchLower) ||
      (sm.owner.lastName?.toLowerCase() || "").includes(searchLower) ||
      (sm.model.itemNumber?.toLowerCase() || "").includes(searchLower)
    );
  }) || [];
  
  const handleUnshare = (model: SharedModelData) => {
    setSelectedModel(model);
    setUnshareReason("");
    setShowUnshareDialog(true);
  };
  
  const confirmUnshare = () => {
    if (!selectedModel || !unshareReason.trim()) {
      toast({ title: "Please provide a reason", variant: "destructive" });
      return;
    }
    unshareMutation.mutate({ 
      modelId: selectedModel.model.id, 
      reason: unshareReason.trim() 
    });
  };
  
  const getSharePreferenceBadge = (preference: string) => {
    switch (preference) {
      case 'public':
        return <Badge variant="default" className="bg-green-600">Public</Badge>;
      case 'authenticated':
        return <Badge variant="secondary">Auth Only</Badge>;
      case 'private':
        return <Badge variant="outline">Private</Badge>;
      default:
        return <Badge variant="outline">{preference}</Badge>;
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Share2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p>Loading shared models...</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="w-5 h-5" />
          Shared Models ({sharedModels?.length || 0})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by model name, owner email, or item number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-shared-models"
            />
          </div>
        </div>
        
        {filteredModels.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? "No models match your search" : "No models are currently shared with the community"}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Preference</TableHead>
                  <TableHead>Photos</TableHead>
                  <TableHead>Public URL</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredModels.map((sm) => (
                  <TableRow key={sm.model.id} data-testid={`row-shared-model-${sm.model.id}`}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{sm.model.name}</p>
                        {sm.model.itemNumber && (
                          <p className="text-sm text-muted-foreground">#{sm.model.itemNumber}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">
                          {sm.owner.firstName} {sm.owner.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">{sm.owner.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getSharePreferenceBadge(sm.owner.sharePreference)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Image className="w-4 h-4 text-muted-foreground" />
                        <span>{sm.photoCount}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {sm.model.publicSlug ? (
                        <a 
                          href={`/community/models/${sm.model.publicSlug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-sm">No slug</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleUnshare(sm)}
                        data-testid={`button-unshare-${sm.model.id}`}
                      >
                        <EyeOff className="w-4 h-4 mr-1" />
                        Unshare
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      
      <Dialog open={showUnshareDialog} onOpenChange={setShowUnshareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unshare Model</DialogTitle>
            <DialogDescription>
              This will remove the model from the community gallery. The owner will be notified.
            </DialogDescription>
          </DialogHeader>
          
          {selectedModel && (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-lg">
                <p className="font-medium">{selectedModel.model.name}</p>
                <p className="text-sm text-muted-foreground">
                  Owner: {selectedModel.owner.firstName} {selectedModel.owner.lastName} ({selectedModel.owner.email})
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for unsharing *</Label>
                <Textarea
                  id="reason"
                  placeholder="e.g., Inappropriate content, copyright violation, user request..."
                  value={unshareReason}
                  onChange={(e) => setUnshareReason(e.target.value)}
                  rows={3}
                  data-testid="textarea-unshare-reason"
                />
                <p className="text-xs text-muted-foreground">
                  This reason will be logged for audit purposes.
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUnshareDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmUnshare}
              disabled={unshareMutation.isPending || !unshareReason.trim()}
              data-testid="button-confirm-unshare"
            >
              {unshareMutation.isPending ? "Unsharing..." : "Confirm Unshare"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
