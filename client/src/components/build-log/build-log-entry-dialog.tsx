import { useState, useRef, useEffect } from "react";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Camera, Mic, MicOff, Trash2, Upload, X } from "lucide-react";
import { insertBuildLogEntrySchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { addStorageFallbackParam } from "@/lib/file-utils";

const formSchema = insertBuildLogEntrySchema.extend({
  title: z.string().min(1, "Title is required"),
  entryDate: z.string(),
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

  // Fetch photos already attached to this entry when editing
  const { data: entryPhotos = [], refetch: refetchEntryPhotos } = useQuery<any[]>({
    queryKey: [`/api/build-log-entries/${existingEntry?.id}/photos`],
    enabled: open && !!existingEntry?.id,
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

  useEffect(() => {
    if (existingEntry) {
      form.reset({
        modelId,
        entryNumber: existingEntry.entryNumber,
        title: existingEntry.title || "",
        content: existingEntry.content || "",
        entryDate: existingEntry.entryDate || new Date().toISOString(),
        photos: [],
      });
    } else {
      form.reset({
        modelId,
        entryNumber: nextEntryNumber,
        title: "",
        content: "",
        entryDate: new Date().toISOString(),
        photos: [],
      });
    }
    setSelectedFiles([]);
    setSelectedExistingPhotos([]);
  }, [existingEntry, modelId, nextEntryNumber, open]);

  // Remove photo mutation (unlinks photo from entry)
  const removePhotoMutation = useMutation({
    mutationFn: async (photoId: number) => {
      await apiRequest("DELETE", `/api/build-log-entries/${existingEntry.id}/photos/${photoId}`);
    },
    onSuccess: () => {
      refetchEntryPhotos();
      queryClient.invalidateQueries({ queryKey: [`/api/models/${modelId}/build-log-entries`] });
      toast({ title: "Photo removed", description: "Photo unlinked from this entry." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove photo.", variant: "destructive" });
    },
  });

  const createEntryMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const entryData = {
        modelId: data.modelId,
        entryNumber: data.entryNumber,
        title: data.title,
        content: data.content,
        entryDate: data.entryDate,
      };

      const responseRaw = existingEntry 
        ? await apiRequest("PUT", `/api/build-log-entries/${existingEntry.id}`, entryData)
        : await apiRequest("POST", `/api/models/${modelId}/build-log-entries`, entryData);
      
      const response = await responseRaw.json();
      
      if (selectedFiles.length > 0) {
        const formData = new FormData();
        selectedFiles.forEach((item, index) => {
          formData.append('photos', item.file);
          formData.append(`caption_${index}`, item.caption);
        });
        formData.append('buildLogEntryId', response.id.toString());
        await apiRequest("POST", `/api/build-log-entries/${response.id}/photos`, formData);
      }

      if (selectedExistingPhotos.length > 0) {
        for (const existingPhoto of selectedExistingPhotos) {
          await apiRequest("POST", `/api/build-log-entries/${response.id}/existing-photos`, {
            photoId: existingPhoto.id,
          });
        }
      }

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/models/${modelId}/build-log-entries`] });
      queryClient.invalidateQueries({ queryKey: [`/api/models/${modelId}`] });
      queryClient.refetchQueries({ queryKey: [`/api/models/${modelId}/build-log-entries`] });
      toast({
        title: existingEntry ? "Build log entry updated" : "Build log entry created",
        description: existingEntry ? "Your changes have been saved." : "Your build progress has been documented.",
      });
      onOpenChange(false);
      form.reset();
      setSelectedFiles([]);
      setSelectedExistingPhotos([]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save build log entry",
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

        recognition.onstart = () => setIsRecording(true);

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

        recognition.onend = () => setIsRecording(false);

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

  // Photos already on the model (for picking from gallery — exclude ones already on entry)
  const entryPhotoIds = new Set(entryPhotos.map((p: any) => p.id));
  const availableGalleryPhotos = (modelData as any)?.photos?.filter((p: any) => !entryPhotoIds.has(p.id)) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono">
            {existingEntry ? `Edit Build Log Entry #${existingEntry.entryNumber}` : `Add Build Log Entry #${nextEntryNumber}`}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="entryDate"
              render={({ field }) => {
                const currentDate = field.value ? new Date(field.value) : new Date();
                const timeString = `${currentDate.getHours().toString().padStart(2, '0')}:${currentDate.getMinutes().toString().padStart(2, '0')}`;

                const handleDateSelect = (date: Date | undefined) => {
                  if (!date) return;
                  const [h, m] = timeString.split(':').map(Number);
                  const combined = new Date(date);
                  combined.setHours(h, m, 0, 0);
                  field.onChange(combined.toISOString());
                };

                const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                  const [h, m] = e.target.value.split(':').map(Number);
                  const combined = new Date(field.value || new Date());
                  combined.setHours(h || 0, m || 0, 0, 0);
                  field.onChange(combined.toISOString());
                };

                return (
                  <FormItem>
                    <FormLabel className="font-mono">Entry Date</FormLabel>
                    <div className="flex gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="flex-1 justify-start text-left font-mono font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                            {currentDate ? format(currentDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={currentDate}
                            onSelect={handleDateSelect}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <Input
                        type="time"
                        value={timeString}
                        onChange={handleTimeChange}
                        className="w-32 font-mono"
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

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
                        <><MicOff className="h-4 w-4 mr-2" />Stop Recording</>
                      ) : (
                        <><Mic className="h-4 w-4 mr-2" />Voice Input</>
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

            {/* Photos Section */}
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

              {/* Existing entry photos (only shown when editing) */}
              {existingEntry && entryPhotos.length > 0 && (
                <div className="space-y-2">
                  <label className="font-mono text-sm font-medium text-gray-600 dark:text-gray-400">
                    Attached photos ({entryPhotos.length})
                  </label>
                  <div className="space-y-2">
                    {entryPhotos.map((photo: any) => (
                      <div key={photo.id} className="flex items-center space-x-3 p-2 border rounded-lg bg-gray-50 dark:bg-gray-900">
                        <img
                          src={addStorageFallbackParam(photo.url)}
                          alt={photo.caption || 'Build log photo'}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-mono text-gray-700 dark:text-gray-300 truncate">
                            {photo.caption || photo.originalName || 'No caption'}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm("Remove this photo from the entry?")) {
                              removePhotoMutation.mutate(photo.id);
                            }
                          }}
                          disabled={removePhotoMutation.isPending}
                          className="text-red-500 hover:text-red-700 shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New files to upload */}
              {selectedFiles.length > 0 && (
                <div className="space-y-3">
                  <label className="font-mono text-sm font-medium text-gray-600 dark:text-gray-400">
                    New photos to add
                  </label>
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

              {/* Gallery photo picker — exclude already-attached photos */}
              {availableGalleryPhotos.length > 0 && (
                <div className="space-y-3">
                  <label className="font-mono text-sm font-medium">Or select from model gallery</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                    {availableGalleryPhotos.map((photo: any) => {
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
                            src={addStorageFallbackParam(photo.url)}
                            alt={photo.caption || 'Model photo'}
                            className="w-full h-20 object-cover"
                          />
                          {photo.isBoxArt && (
                            <Badge className="absolute top-1 left-1 text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
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
                        const photo = availableGalleryPhotos.find((p: any) => p.id === selectedPhoto.id);
                        return (
                          <div key={selectedPhoto.id} className="flex items-center space-x-3 p-2 border rounded">
                            <img
                              src={addStorageFallbackParam(photo?.url || '')}
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
                {createEntryMutation.isPending 
                  ? (existingEntry ? "Updating..." : "Creating...") 
                  : (existingEntry ? "Update Entry" : "Create Entry")
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
