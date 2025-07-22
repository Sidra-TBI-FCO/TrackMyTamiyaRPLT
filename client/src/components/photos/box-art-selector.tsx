import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, Check } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Photo {
  id: number;
  url: string;
  originalName: string;
  isBoxArt: boolean;
}

interface BoxArtSelectorProps {
  modelId: number;
  photos: Photo[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BoxArtSelector({ modelId, photos, open, onOpenChange }: BoxArtSelectorProps) {
  const [selectedPhotoId, setSelectedPhotoId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateBoxArtMutation = useMutation({
    mutationFn: async (photoId: number) => {
      const response = await apiRequest("PUT", `/api/photos/${photoId}`, {
        isBoxArt: true
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/models", modelId] });
      queryClient.invalidateQueries({ queryKey: ["/api/models"] });
      toast({
        title: "Success",
        description: "Box art updated successfully",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update box art",
        variant: "destructive",
      });
    },
  });

  const handleSelectBoxArt = () => {
    if (selectedPhotoId) {
      updateBoxArtMutation.mutate(selectedPhotoId);
    }
  };

  const currentBoxArt = photos.find(p => p.isBoxArt);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono flex items-center">
            <Camera className="mr-2 h-5 w-5" />
            Select Box Art
          </DialogTitle>
        </DialogHeader>

        {photos.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 font-mono">
            No photos available. Add photos first to select box art.
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
              Click on a photo to select it as the new box art for this model.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                    selectedPhotoId === photo.id
                      ? "border-red-500 ring-2 ring-red-200 dark:ring-red-800"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                  onClick={() => setSelectedPhotoId(photo.id)}
                >
                  <div className="aspect-square">
                    <img
                      src={photo.url}
                      alt={photo.originalName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Selection indicator */}
                  {selectedPhotoId === photo.id && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                  
                  {/* Current box art indicator */}
                  {photo.isBoxArt && (
                    <div className="absolute top-2 left-2">
                      <Badge variant="secondary" className="text-xs font-mono">
                        Current Box Art
                      </Badge>
                    </div>
                  )}
                  
                  {/* Photo name */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-2">
                    <p className="truncate font-mono">{photo.originalName}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="font-mono"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSelectBoxArt}
                disabled={!selectedPhotoId || updateBoxArtMutation.isPending}
                className="bg-red-600 hover:bg-red-700 font-mono"
              >
                {updateBoxArtMutation.isPending ? "Updating..." : "Set as Box Art"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}