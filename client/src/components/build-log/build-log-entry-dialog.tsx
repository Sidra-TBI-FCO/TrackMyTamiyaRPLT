import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Calendar, Camera, Mic, MicOff, Upload, X } from "lucide-react";
import { insertBuildLogEntrySchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const formSchema = insertBuildLogEntrySchema.extend({
  title: z.string().min(1, "Title is required"),
  photos: z.array(z.object({
    file: z.any(),
    caption: z.string(),
  })).default([]),
});

type FormData = z.infer<typeof formSchema>;

interface BuildLogEntryDialogProps {
  modelId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nextEntryNumber: number;
  existingEntry?: any;
}

export default function BuildLogEntryDialog({ 
  modelId, 
  open, 
  onOpenChange, 
  nextEntryNumber,
  existingEntry 
}: BuildLogEntryDialogProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Array<{ file: File; caption: string }>>([]);
  const [selectedExistingPhotos, setSelectedExistingPhotos] = useState<Array<{ id: number; caption: string }>>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch model data to get existing photos
  const { data: modelData } = useQuery({
    queryKey: [`/api/models/${modelId}`],
    enabled: open,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      modelId,
      entryNumber: nextEntryNumber,
      title: "",
      content: "",
      entryDate: new Date().toISOString(),
      photos: [],
    },
  });

  const createEntryMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Create the build log entry first
      const entryData = {
        modelId: data.modelId,
        entryNumber: data.entryNumber,
        title: data.title,
        content: data.content,
        entryDate: data.entryDate,
      };

      const response = await apiRequest("POST", `/api/models/${modelId}/build-log-entries`, entryData);
      
      // Upload new photos if any
      if (selectedFiles.length > 0) {
        const formData = new FormData();
        selectedFiles.forEach((item, index) => {
          formData.append('photos', item.file);
          formData.append(`caption_${index}`, item.caption);
        });
        formData.append('buildLogEntryId', response.id.toString());

        await apiRequest("POST", `/api/build-log-entries/${response.id}/photos`, formData);
      }

      // Link existing photos if any
      if (selectedExistingPhotos.length > 0) {
        for (const existingPhoto of selectedExistingPhotos) {
          await apiRequest("POST", `/api/build-log-entries/${response.id}/existing-photos`, {
            photoId: existingPhoto.id,
            caption: existingPhoto.caption,
          });
        }
      }

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/models", modelId.toString(), "build-log-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/models", modelId.toString()] });
      toast({
        title: "Build log entry created",
        description: "Your build progress has been documented.",
      });
      onOpenChange(false);
      form.reset();
      setSelectedFiles([]);
      setSelectedExistingPhotos([]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create build log entry",
        variant: "destructive",
      });
    },
  });

  const startVoiceRecording = async () => {
    try {
      if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsRecording(true);
        };

        recognition.onresult = (event) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript + ' ';
            }
          }
          
          if (finalTranscript) {
            const currentContent = form.getValues("content") || "";
            form.setValue("content", currentContent + finalTranscript);
          }
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
          toast({
            title: "Voice recording error",
            description: "Could not process voice input. Please type your entry instead.",
            variant: "destructive",
          });
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } else {
        toast({
          title: "Voice input not supported",
          description: "Your browser doesn't support voice input. Please type your entry.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error starting voice recording:', error);
      toast({
        title: "Voice recording error",
        description: "Could not start voice recording. Please type your entry instead.",
        variant: "destructive",
      });
    }
  };

  const stopVoiceRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles = files.map(file => ({ file, caption: "" }));
    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const updateFileCaption = (index: number, caption: string) => {
    setSelectedFiles(prev => 
      prev.map((item, i) => i === index ? { ...item, caption } : item)
    );
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (data: FormData) => {
    createEntryMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono">
            Add Build Log Entry #{nextEntryNumber}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Entry Date */}
            <FormField
              control={form.control}
              name="entryDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono">Entry Date</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                      value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ""}
                      onChange={(e) => field.onChange(new Date(e.target.value).toISOString())}
                      className="font-mono"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono">Title</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g. Installed motor mount and drivetrain"
                      className="font-mono"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Content with Voice Recording */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="font-mono">Content</FormLabel>
                    <Button
                      type="button"
                      variant={isRecording ? "destructive" : "outline"}
                      size="sm"
                      onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                      className="font-mono"
                    >
                      {isRecording ? (
                        <>
                          <MicOff className="h-4 w-4 mr-2" />
                          Stop Recording
                        </>
                      ) : (
                        <>
                          <Mic className="h-4 w-4 mr-2" />
                          Voice Input
                        </>
                      )}
                    </Button>
                  </div>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe what you did in this build session..."
                      className="font-mono min-h-[120px]"
                      value={field.value || ""}
                    />
                  </FormControl>
                  {isRecording && (
                    <div className="flex items-center text-sm text-red-600 dark:text-red-400">
                      <Mic className="h-4 w-4 mr-2 animate-pulse" />
                      Recording... Speak to add to your build log
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Photo Upload */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="font-mono text-sm font-medium">Photos</label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('photo-upload')?.click()}
                  className="font-mono"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload New
                </Button>
              </div>
              
              <input
                id="photo-upload"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {selectedFiles.length > 0 && (
                <div className="space-y-3">
                  {selectedFiles.map((item, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <img
                        src={URL.createObjectURL(item.file)}
                        alt="Preview"
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                            {item.file.name}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <Input
                          placeholder="Photo caption (optional)"
                          value={item.caption}
                          onChange={(e) => updateFileCaption(index, e.target.value)}
                          className="font-mono text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Existing Photos Selection */}
              {modelData?.photos && modelData.photos.length > 0 && (
                <div className="space-y-3">
                  <label className="font-mono text-sm font-medium">Or select from existing photos</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                    {modelData.photos.map((photo: any) => {
                      const isSelected = selectedExistingPhotos.some(p => p.id === photo.id);
                      return (
                        <div 
                          key={photo.id} 
                          className={`relative cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                            isSelected 
                              ? 'border-red-500 bg-red-50 dark:bg-red-950' 
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedExistingPhotos(prev => prev.filter(p => p.id !== photo.id));
                            } else {
                              setSelectedExistingPhotos(prev => [...prev, { id: photo.id, caption: photo.caption || '' }]);
                            }
                          }}
                        >
                          <img
                            src={photo.url}
                            alt={photo.caption || 'Model photo'}
                            className="w-full h-20 object-cover"
                          />
                          {photo.isBoxArt && (
                            <Badge 
                              className="absolute top-1 left-1 text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                            >
                              Box Art
                            </Badge>
                          )}
                          {isSelected && (
                            <div className="absolute inset-0 bg-red-500 bg-opacity-20 flex items-center justify-center">
                              <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center">
                                ✓
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {selectedExistingPhotos.length > 0 && (
                    <div className="space-y-2">
                      <label className="font-mono text-sm font-medium">Add captions to selected photos</label>
                      {selectedExistingPhotos.map((selectedPhoto, index) => {
                        const photo = modelData.photos.find((p: any) => p.id === selectedPhoto.id);
                        return (
                          <div key={selectedPhoto.id} className="flex items-center space-x-3 p-2 border rounded">
                            <img
                              src={photo?.url}
                              alt=""
                              className="w-12 h-12 object-cover rounded"
                            />
                            <Input
                              placeholder="Photo caption (optional)"
                              value={selectedPhoto.caption}
                              onChange={(e) => {
                                setSelectedExistingPhotos(prev => 
                                  prev.map((p, i) => i === index ? { ...p, caption: e.target.value } : p)
                                );
                              }}
                              className="font-mono text-sm"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedExistingPhotos(prev => prev.filter(p => p.id !== selectedPhoto.id));
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="font-mono"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createEntryMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white font-mono"
              >
                {createEntryMutation.isPending ? "Creating..." : "Create Entry"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}