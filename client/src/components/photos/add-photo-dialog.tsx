import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, Camera, Image as ImageIcon, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useDropzone } from "react-dropzone";
import { z } from "zod";

const photoSchema = z.object({
  caption: z.string().optional(),
  isBoxArt: z.boolean().default(false),
});

type PhotoFormData = z.infer<typeof photoSchema>;

interface AddPhotoDialogProps {
  modelId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddPhotoDialog({ modelId, open, onOpenChange }: AddPhotoDialogProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<PhotoFormData>({
    resolver: zodResolver(photoSchema),
    defaultValues: {
      caption: "",
      isBoxArt: false,
    },
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: async (data: { files: File[]; caption: string; isBoxArt: boolean }) => {
      console.log('Starting photo upload:', {
        fileCount: data.files.length,
        files: data.files.map(f => ({ name: f.name, type: f.type, size: f.size })),
        caption: data.caption,
        isBoxArt: data.isBoxArt
      });

      const formData = new FormData();
      data.files.forEach((file, index) => {
        console.log(`Appending file ${index}: ${file.name} (${file.type})`);
        formData.append("photos", file);
      });
      formData.append("caption", data.caption);
      formData.append("isBoxArt", data.isBoxArt.toString());
      formData.append("modelId", modelId.toString());

      console.log('FormData entries:', Array.from(formData.entries()).map(([key, value]) => 
        key === 'photos' ? [key, `File: ${(value as File).name}`] : [key, value]
      ));

      const response = await apiRequest("POST", `/api/models/${modelId}/photos`, formData);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload failed:', response.status, errorText);
        throw new Error(`Upload failed: ${response.status} ${errorText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/models", modelId.toString()] });
      queryClient.invalidateQueries({ queryKey: ["/api/models"] });
      toast({
        title: "Photos uploaded",
        description: `${selectedFiles.length} photo(s) added successfully`,
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload photos",
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

    setSelectedFiles(imageFiles);
    
    // Create preview URLs
    const urls = imageFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"]
    },
    multiple: true,
  });

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newUrls = previewUrls.filter((_, i) => i !== index);
    
    // Revoke the URL to prevent memory leaks
    URL.revokeObjectURL(previewUrls[index]);
    
    setSelectedFiles(newFiles);
    setPreviewUrls(newUrls);
  };

  const handleClose = () => {
    // Clean up preview URLs
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setSelectedFiles([]);
    setPreviewUrls([]);
    form.reset();
    onOpenChange(false);
  };

  const onSubmit = (data: PhotoFormData) => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one photo to upload",
        variant: "destructive",
      });
      return;
    }

    uploadPhotoMutation.mutate({
      files: selectedFiles,
      caption: data.caption || "",
      isBoxArt: data.isBoxArt,
    });
  };

  const triggerFileInput = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/jpg,image/png,image/gif,image/webp";
    input.multiple = true;
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      console.log('File input selected files:', files.map(f => ({ name: f.name, type: f.type, size: f.size })));
      onDrop(files);
    };
    input.click();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono">Add Photos</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* File Upload Area */}
            <div className="space-y-4">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                  ${isDragActive 
                    ? "border-red-500 bg-red-50 dark:bg-red-950" 
                    : "border-gray-300 dark:border-gray-600 hover:border-red-400 dark:hover:border-red-500"
                  }`}
              >
                <input {...getInputProps()} />
                <div className="space-y-4">
                  <div className="flex justify-center space-x-4">
                    <Upload className="h-8 w-8 text-gray-400" />
                    <Camera className="h-8 w-8 text-gray-400" />
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  
                  {isDragActive ? (
                    <p className="font-mono text-red-600 dark:text-red-400">
                      Drop photos here...
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <p className="font-mono text-gray-900 dark:text-white">
                        Drag & drop photos here, or click to select
                      </p>
                      <p className="text-sm font-mono text-gray-500 dark:text-gray-400">
                        Supports JPG, PNG, GIF, WebP
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile-specific buttons */}
              <div className="flex space-x-2 md:hidden">
                <Button
                  type="button"
                  variant="outline"
                  onClick={triggerFileInput}
                  className="flex-1 font-mono"
                >
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Gallery
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/jpeg,image/jpg,image/png,image/gif,image/webp";
                    input.capture = "environment";
                    input.multiple = true;
                    input.onchange = (e) => {
                      const files = Array.from((e.target as HTMLInputElement).files || []);
                      console.log('Camera input selected files:', files.map(f => ({ name: f.name, type: f.type, size: f.size })));
                      onDrop(files);
                    };
                    input.click();
                  }}
                  className="flex-1 font-mono"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Camera
                </Button>
              </div>
            </div>

            {/* Preview Selected Files */}
            {selectedFiles.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-mono text-sm font-medium">Selected Photos ({selectedFiles.length})</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b font-mono truncate">
                        {selectedFiles[index].name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Caption Field */}
            <FormField
              control={form.control}
              name="caption"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono">Caption (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Add a caption for these photos..."
                      className="font-mono"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Box Art Checkbox */}
            <FormField
              control={form.control}
              name="isBoxArt"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="font-mono">
                      Set as box art
                    </FormLabel>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                      This will be the main photo displayed for the model
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="font-mono"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={uploadPhotoMutation.isPending || selectedFiles.length === 0}
                className="bg-blue-600 hover:bg-blue-700 font-mono"
              >
                {uploadPhotoMutation.isPending ? "Uploading..." : `Upload ${selectedFiles.length} Photo(s)`}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}