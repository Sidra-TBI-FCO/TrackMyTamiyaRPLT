import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, Camera, Image as ImageIcon, X, Star } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PhotoData {
  file: File;
  preview: string;
  caption: string;
  isBoxArt: boolean;
}

interface AddPhotoDialogProps {
  modelId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddPhotoDialog({ modelId, open, onOpenChange }: AddPhotoDialogProps) {
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadPhotoMutation = useMutation({
    mutationFn: async (photosData: PhotoData[]) => {
      console.log('Starting photo upload:', {
        photoCount: photosData.length,
        photos: photosData.map(p => ({ 
          name: p.file.name, 
          caption: p.caption, 
          isBoxArt: p.isBoxArt 
        }))
      });

      // Since server expects individual captions per photo, we need to upload them separately
      // but handle errors better for mobile
      const results = [];
      for (const photoData of photosData) {
        try {
          const formData = new FormData();
          formData.append("photos", photoData.file);
          formData.append("caption", photoData.caption);
          formData.append("isBoxArt", photoData.isBoxArt.toString());
          formData.append("modelId", modelId.toString());

          console.log('Uploading photo:', photoData.file.name, 'caption:', photoData.caption, 'boxArt:', photoData.isBoxArt);
          
          const response = await apiRequest("POST", `/api/models/${modelId}/photos`, formData);
          results.push(response);
        } catch (error: any) {
          console.error('Failed to upload photo:', photoData.file.name, error);
          throw new Error(`Failed to upload ${photoData.file.name}: ${error.message || 'Network error'}`);
        }
      }
      
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/models", modelId.toString()] });
      queryClient.invalidateQueries({ queryKey: ["/api/models"] });
      toast({
        title: "Photos uploaded",
        description: `${photos.length} photo(s) added successfully`,
      });
      handleClose();
    },
    onError: (error: any) => {
      console.error('Upload mutation error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload photos. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onDrop = (acceptedFiles: File[]) => {
    console.log('onDrop called with files:', acceptedFiles.map(f => ({ name: f.name, type: f.type, size: f.size })));
    
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const imageFiles = acceptedFiles.filter(file => 
      file.type.startsWith("image/") || allowedTypes.includes(file.type)
    );

    if (imageFiles.length !== acceptedFiles.length) {
      toast({
        title: "Invalid files",
        description: "Only image files are allowed (JPG, PNG, GIF, WebP)",
        variant: "destructive",
      });
    }

    if (imageFiles.length === 0) {
      toast({
        title: "No valid files",
        description: "Please select valid image files",
        variant: "destructive",
      });
      return;
    }

    // Create PhotoData objects for each file
    const newPhotos: PhotoData[] = imageFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      caption: "",
      isBoxArt: false
    }));

    setPhotos(prev => [...prev, ...newPhotos]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"]
    },
    multiple: true,
  });

  const removePhoto = (index: number) => {
    setPhotos(prev => {
      const newPhotos = [...prev];
      // Revoke the URL to prevent memory leaks
      URL.revokeObjectURL(newPhotos[index].preview);
      newPhotos.splice(index, 1);
      return newPhotos;
    });
  };

  const updatePhotoCaption = (index: number, caption: string) => {
    setPhotos(prev => {
      const newPhotos = [...prev];
      newPhotos[index].caption = caption;
      return newPhotos;
    });
  };

  const toggleBoxArt = (index: number) => {
    setPhotos(prev => {
      const newPhotos = [...prev];
      // Only one photo can be box art
      newPhotos.forEach((photo, i) => {
        photo.isBoxArt = i === index ? !photo.isBoxArt : false;
      });
      return newPhotos;
    });
  };

  const handleClose = () => {
    // Clean up preview URLs
    photos.forEach(photo => URL.revokeObjectURL(photo.preview));
    setPhotos([]);
    onOpenChange(false);
  };

  const handleSubmit = () => {
    if (photos.length === 0) {
      toast({
        title: "No photos selected",
        description: "Please select at least one photo to upload",
        variant: "destructive",
      });
      return;
    }

    uploadPhotoMutation.mutate(photos);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono">Add Photos</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Area */}
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-red-500 bg-red-50 dark:bg-red-950' 
                : 'border-gray-300 dark:border-gray-600 hover:border-red-400'
            }`}
          >
            <input {...getInputProps()} />
            <div className="space-y-2">
              <div className="flex justify-center">
                {isDragActive ? (
                  <Upload className="h-12 w-12 text-red-500" />
                ) : (
                  <ImageIcon className="h-12 w-12 text-gray-400" />
                )}
              </div>
              <h3 className="text-lg font-mono font-semibold text-gray-900 dark:text-white">
                {isDragActive ? "Drop photos here" : "Add Photos"}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 font-mono">
                Drag and drop images here, or click to select files
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 font-mono">
                Supports JPG, PNG, GIF, WebP • Max 10MB per file
              </p>
            </div>
          </div>

          {/* Photo Preview and Configuration */}
          {photos.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-mono font-semibold text-gray-900 dark:text-white">
                Configure Photos ({photos.length})
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {photos.map((photo, index) => (
                  <Card key={index} className="overflow-hidden">
                    <div className="relative">
                      <img
                        src={photo.preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-48 object-cover"
                      />
                      
                      {/* Remove button */}
                      <button
                        onClick={() => removePhoto(index)}
                        className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 transition-colors"
                        title="Remove photo"
                      >
                        <X className="h-4 w-4" />
                      </button>

                      {/* Box art badge */}
                      {photo.isBoxArt && (
                        <Badge className="absolute top-2 left-2 bg-yellow-500 text-black">
                          <Star className="h-3 w-3 mr-1" />
                          Box Art
                        </Badge>
                      )}
                    </div>
                    
                    <CardContent className="p-4 space-y-3">
                      {/* File name */}
                      <p className="text-sm font-mono text-gray-600 dark:text-gray-400 truncate">
                        {photo.file.name}
                      </p>
                      
                      {/* Caption input */}
                      <div className="space-y-1">
                        <label className="text-sm font-mono font-medium text-gray-700 dark:text-gray-300">
                          Caption
                        </label>
                        <Textarea
                          placeholder="Add a caption for this photo..."
                          value={photo.caption}
                          onChange={(e) => updatePhotoCaption(index, e.target.value)}
                          className="font-mono text-sm"
                          rows={2}
                        />
                      </div>
                      
                      {/* Box art checkbox */}
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`boxart-${index}`}
                          checked={photo.isBoxArt}
                          onCheckedChange={() => toggleBoxArt(index)}
                        />
                        <label 
                          htmlFor={`boxart-${index}`}
                          className="text-sm font-mono font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                        >
                          Set as box art
                        </label>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={uploadPhotoMutation.isPending}
              className="font-mono"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={photos.length === 0 || uploadPhotoMutation.isPending}
              className="bg-red-600 hover:bg-red-700 font-mono"
            >
              {uploadPhotoMutation.isPending ? (
                <>Uploading...</>
              ) : (
                <>Upload {photos.length} Photo{photos.length !== 1 ? 's' : ''}</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}