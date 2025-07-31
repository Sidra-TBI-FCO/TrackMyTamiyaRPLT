import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Camera, MoreVertical, Trash2, Edit } from "lucide-react";
import { Link } from "wouter";
import { ModelWithRelations } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface ModelCardProps {
  model: ModelWithRelations;
  onAddPhoto: (modelId: number) => void;
}

export default function ModelCard({ model, onAddPhoto }: ModelCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "built":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "building":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "planning":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const deleteModelMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/models/${model.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/models"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Model deleted",
        description: `${model.name} has been removed from your collection.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete model",
        variant: "destructive",
      });
    },
  });

  const boxArtPhoto = model.photos.find(p => p.isBoxArt) || model.photos[0];
  const photoCount = model.photos.length;
  const hopUpCount = model.hopUpParts.length;



  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full">
      {boxArtPhoto ? (
        <div className="w-full h-48 bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
          <img
            src={boxArtPhoto.url}
            alt={model.name}
            className="max-w-full max-h-full object-contain"
            onError={(e) => {
              console.error(`Failed to load image for ${model.name}:`, boxArtPhoto.url);
            }}
          />
        </div>
      ) : (
        <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
          <div className="text-gray-400 dark:text-gray-500 text-center">
            <Camera className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm font-mono">No photo</p>
          </div>
        </div>
      )}

      <CardContent className="p-4 flex flex-col flex-grow">
        {/* Header section - fixed height */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-mono font-semibold text-gray-900 dark:text-white line-clamp-2 flex-1 mr-2 min-h-[2.5rem] leading-tight">
            {model.buildType === 'custom' && model.bodyName ? model.bodyName : model.name}
          </h3>
          <Badge className={`text-xs font-mono flex-shrink-0 ${getStatusColor(model.buildStatus)}`}>
            {model.buildStatus.charAt(0).toUpperCase() + model.buildStatus.slice(1)}
          </Badge>
        </div>

        {/* Item number - fixed height */}
        <p className="text-sm font-mono text-gray-500 dark:text-gray-400 mb-3">
          Item #{model.itemNumber}
        </p>

        {/* Tags section - flexible content but consistent spacing */}
        <div className="flex flex-wrap gap-1 mb-3 min-h-[28px]">
          {model.tags && model.tags.length > 0 ? (
            <>
              {model.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs font-mono">
                  {tag}
                </Badge>
              ))}
              {model.tags.length > 3 && (
                <Badge variant="outline" className="text-xs font-mono text-gray-500">
                  +{model.tags.length - 3}
                </Badge>
              )}
            </>
          ) : null}
        </div>

        {/* Stats section - grows to fill available space */}
        <div className="flex items-center justify-between text-sm font-mono text-gray-600 dark:text-gray-400 mb-4 flex-grow items-end">
          <span>{photoCount} photos</span>
          <span>{hopUpCount} hop-ups</span>
        </div>

        {/* Action buttons - always at bottom */}
        <div className="flex space-x-2 mt-auto">
          <Link href={`/models/${model.id}`} className="flex-1">
            <Button
              size="sm"
              className="w-full text-white font-mono"
              style={{backgroundColor: 'var(--theme-primary)'}}
            >
              View Details
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddPhoto(model.id)}
            className="p-2"
            title="Add Photo"
          >
            <Camera className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="p-2 text-destructive hover:text-destructive-foreground hover:bg-destructive/10"
            title="Delete Model"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Model</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{model.name}"? This action cannot be undone.
              All photos, build logs, and hop-up parts associated with this model will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteModelMutation.mutate()}
              disabled={deleteModelMutation.isPending}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {deleteModelMutation.isPending ? "Deleting..." : "Delete Model"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
