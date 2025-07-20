import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface UploadOptions {
  modelId?: number;
  isBoxArt?: boolean;
  caption?: string;
}

interface PhotoUploadResult {
  id: number;
  url: string;
  filename: string;
  originalName: string;
}

export function usePhotoUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async ({ 
      files, 
      modelId, 
      isBoxArt = false, 
      caption 
    }: { 
      files: File[]; 
      modelId: number; 
      isBoxArt?: boolean; 
      caption?: string; 
    }) => {
      const uploadPromises = files.map(async (file, index) => {
        const formData = new FormData();
        formData.append('photo', file);
        if (caption) formData.append('caption', caption);
        formData.append('isBoxArt', String(isBoxArt && index === 0));

        // Create a unique key for this upload
        const uploadKey = `${file.name}-${Date.now()}-${index}`;
        
        // Create XMLHttpRequest for progress tracking
        return new Promise<PhotoUploadResult>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const percentComplete = (event.loaded / event.total) * 100;
              setUploadProgress(prev => ({
                ...prev,
                [uploadKey]: percentComplete
              }));
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status === 201) {
              const result = JSON.parse(xhr.responseText);
              // Remove progress entry when complete
              setUploadProgress(prev => {
                const { [uploadKey]: removed, ...rest } = prev;
                return rest;
              });
              resolve(result);
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          });

          xhr.addEventListener('error', () => {
            reject(new Error('Upload failed'));
          });

          xhr.open('POST', `/api/models/${modelId}/photos`);
          xhr.send(formData);
        });
      });

      return Promise.all(uploadPromises);
    },
    onSuccess: (results, variables) => {
      toast({
        title: "Success",
        description: `${results.length} photo${results.length > 1 ? 's' : ''} uploaded successfully`,
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/models", variables.modelId.toString()] });
      queryClient.invalidateQueries({ queryKey: ["/api/models"] });
      
      if (variables.modelId) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/models", variables.modelId.toString(), "photos"] 
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUploading(false);
      setUploadProgress({});
    }
  });

  const uploadPhotos = useCallback(async (
    files: File[], 
    options: UploadOptions = {}
  ) => {
    if (!files.length) {
      toast({
        title: "No Files",
        description: "Please select at least one photo to upload",
        variant: "destructive",
      });
      return;
    }

    if (!options.modelId) {
      toast({
        title: "Missing Model",
        description: "Please specify which model these photos belong to",
        variant: "destructive",
      });
      return;
    }

    // Validate file types and sizes
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    const invalidFiles = files.filter(file => 
      !allowedTypes.includes(file.type) || file.size > maxSize
    );

    if (invalidFiles.length > 0) {
      toast({
        title: "Invalid Files",
        description: `${invalidFiles.length} file(s) are either too large (>10MB) or not supported image formats`,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    return uploadMutation.mutateAsync({
      files,
      modelId: options.modelId,
      isBoxArt: options.isBoxArt,
      caption: options.caption
    });
  }, [uploadMutation, toast]);

  const uploadSinglePhoto = useCallback(async (
    file: File,
    options: UploadOptions = {}
  ) => {
    const results = await uploadPhotos([file], options);
    return results?.[0] || null;
  }, [uploadPhotos]);

  // Calculate overall upload progress
  const overallProgress = Object.keys(uploadProgress).length > 0 
    ? Object.values(uploadProgress).reduce((sum, progress) => sum + progress, 0) / Object.keys(uploadProgress).length
    : 0;

  return {
    uploadPhotos,
    uploadSinglePhoto,
    isUploading: isUploading || uploadMutation.isPending,
    uploadProgress: overallProgress,
    individualProgress: uploadProgress,
    error: uploadMutation.error?.message || null
  };
}
