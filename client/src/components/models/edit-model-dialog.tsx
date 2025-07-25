import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { X, Tag, ExternalLink } from "lucide-react";
import { insertModelSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ModelWithRelations } from "@/types";
import { z } from "zod";

const formSchema = insertModelSchema.omit({
  userId: true, // Server will provide this from the authenticated user
}).extend({
  itemNumber: z.string().min(1, "Item number is required"),
  name: z.string().min(1, "Model name is required"),
  tags: z.array(z.string()).optional().default([]),
  buildType: z.enum(["kit", "custom"]).default("kit"),
}).partial();

type FormData = z.infer<typeof formSchema>;

interface EditModelDialogProps {
  model: ModelWithRelations;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditModelDialog({ model, open, onOpenChange }: EditModelDialogProps) {
  const [newTag, setNewTag] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [buildType, setBuildType] = useState<"kit" | "custom">((model.buildType as "kit" | "custom") || "kit");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get all models to extract existing tags
  const { data: models } = useQuery<ModelWithRelations[]>({
    queryKey: ["/api/models"],
  });

  // Get all unique existing tags from all models
  const allExistingTags = Array.from(
    new Set(
      models?.flatMap(m => m.tags || []) || []
    )
  ).sort();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: model.name,
      itemNumber: model.itemNumber,
      chassis: model.chassis || "",
      releaseYear: model.releaseYear || undefined,
      buildStatus: model.buildStatus,
      buildType: (model.buildType as "kit" | "custom") || "kit",
      totalCost: parseFloat(model.totalCost || "0"),
      notes: model.notes || "",
      scale: model.scale || "",
      driveType: model.driveType || "",
      chassisMaterial: model.chassisMaterial || "",
      differentialType: model.differentialType || "",
      motorSize: model.motorSize || "",
      batteryType: model.batteryType || "",
      bodyName: model.bodyName || "",
      bodyItemNumber: model.bodyItemNumber || "",
      bodyManufacturer: model.bodyManufacturer || "",
      tamiyaUrl: model.tamiyaUrl || "",
      tamiyaBaseUrl: model.tamiyaBaseUrl || "",
      tags: model.tags || [],
    },
  });

  const commonTags = [
    "Racing", "Drift", "Buggy", "Touring", "Rally", "Truck", 
    "Vintage", "Competition", "Beginner", "Advanced", "TT-02", "TT-01",
    "Chassis", "Body", "Upgrade", "Electronics"
  ];

  const updateModelMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("PUT", `/api/models/${model.id}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/models"] });
      queryClient.invalidateQueries({ queryKey: ["/api/models", model.id.toString()] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Model updated",
        description: "Your model has been successfully updated.",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update model",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    updateModelMutation.mutate(data);
  };

  const addTag = (tag: string) => {
    const currentTags = form.getValues("tags") || [];
    if (!currentTags.includes(tag)) {
      form.setValue("tags", [...currentTags, tag]);
    }
    setNewTag("");
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues("tags") || [];
    form.setValue("tags", currentTags.filter(tag => tag !== tagToRemove));
  };

  // Update buildType state when model changes
  useEffect(() => {
    setBuildType((model.buildType as "kit" | "custom") || "kit");
  }, [model.buildType]);

  // Update tag suggestions when newTag changes
  useEffect(() => {
    if (newTag.trim()) {
      const currentTags = form.getValues("tags") || [];
      const suggestions = allExistingTags.filter(tag =>
        tag.toLowerCase().includes(newTag.toLowerCase()) &&
        !currentTags.includes(tag)
      ).slice(0, 5);
      setTagSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [newTag, allExistingTags]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono">Edit Model</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="itemNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono">Item Number *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g. 47461"
                      className="font-mono"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono">Model Name *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g. TT-02 Subaru BRZ"
                      className="font-mono"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Build Type Slider */}
            <div className="space-y-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-sm text-gray-700 dark:text-gray-300">Build Type:</span>
                  <div className="flex items-center space-x-3">
                    <span className={`font-mono text-sm transition-colors ${buildType === 'kit' ? 'text-orange-600 dark:text-orange-400 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>
                      Kit Build
                    </span>
                    <FormField
                      control={form.control}
                      name="buildType"
                      render={({ field }) => (
                        <FormControl>
                          <Switch
                            checked={field.value === "custom"}
                            onCheckedChange={(checked) => {
                              const newBuildType = checked ? "custom" : "kit";
                              field.onChange(newBuildType);
                              setBuildType(newBuildType);
                            }}
                            className="data-[state=checked]:bg-orange-600"
                          />
                        </FormControl>
                      )}
                    />
                    <span className={`font-mono text-sm transition-colors ${buildType === 'custom' ? 'text-orange-600 dark:text-orange-400 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>
                      Custom Build
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-xs font-mono text-gray-600 dark:text-gray-400">
                {buildType === 'kit' ? 'Complete kit with body included' : 'Separate chassis and body selection'}
              </p>
            </div>

            <FormField
              control={form.control}
              name="chassis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono">Chassis {buildType === 'custom' ? '(Chassis only)' : ''}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ""}
                      placeholder="e.g. TT-02"
                      className="font-mono"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Custom Build - Body Section */}
            {buildType === 'custom' && (
              <div className="space-y-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center space-x-2 mb-3">
                  <Tag className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="font-mono text-sm font-semibold text-green-800 dark:text-green-200">Body Details</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="bodyItemNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-mono text-sm">Body Item Number</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            placeholder="e.g. 51589"
                            className="font-mono"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bodyManufacturer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-mono text-sm">Body Manufacturer</FormLabel>
                        <FormControl>
                          <Select value={field.value || ""} onValueChange={field.onChange}>
                            <SelectTrigger className="font-mono">
                              <SelectValue placeholder="Select manufacturer" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Tamiya">Tamiya</SelectItem>
                              <SelectItem value="Killerbody">Killerbody</SelectItem>
                              <SelectItem value="Pro-Line">Pro-Line</SelectItem>
                              <SelectItem value="JConcepts">JConcepts</SelectItem>
                              <SelectItem value="HPI Racing">HPI Racing</SelectItem>
                              <SelectItem value="Associated">Associated</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="bodyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono text-sm">Body Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="e.g. Subaru BRZ Street-Custom"
                          className="font-mono"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="releaseYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono">Release Year</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ""}
                      type="number"
                      placeholder="e.g. 2023"
                      className="font-mono"
                      min={1960}
                      max={new Date().getFullYear() + 1}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="buildStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono">Build Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="font-mono">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="building">Building</SelectItem>
                      <SelectItem value="built">Built</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="totalCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono">Total Cost</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="font-mono"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Technical Specifications */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-mono font-semibold text-gray-900 dark:text-white">Technical Specifications</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="scale"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono">Scale</FormLabel>
                      <FormControl>
                        <Select value={field.value || ""} onValueChange={field.onChange}>
                          <SelectTrigger className="font-mono">
                            <SelectValue placeholder="Select scale" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1/10">1/10</SelectItem>
                            <SelectItem value="1/12">1/12</SelectItem>
                            <SelectItem value="1/8">1/8</SelectItem>
                            <SelectItem value="1/16">1/16</SelectItem>
                            <SelectItem value="1/18">1/18</SelectItem>
                            <SelectItem value="1/24">1/24</SelectItem>
                            <SelectItem value="Mini-Z">Mini-Z</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="driveType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono">Drive Type</FormLabel>
                      <FormControl>
                        <Select value={field.value || ""} onValueChange={field.onChange}>
                          <SelectTrigger className="font-mono">
                            <SelectValue placeholder="Select drive type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="4WD">4WD (All-Wheel Drive)</SelectItem>
                            <SelectItem value="2WD">2WD (Two-Wheel Drive)</SelectItem>
                            <SelectItem value="RWD">RWD (Rear-Wheel Drive)</SelectItem>
                            <SelectItem value="FWD">FWD (Front-Wheel Drive)</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="chassisMaterial"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono">Chassis Material</FormLabel>
                      <FormControl>
                        <Select value={field.value || ""} onValueChange={field.onChange}>
                          <SelectTrigger className="font-mono">
                            <SelectValue placeholder="Select material" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Carbon Fiber">Carbon Fiber</SelectItem>
                            <SelectItem value="Aluminum">Aluminum</SelectItem>
                            <SelectItem value="Plastic">Plastic/ABS</SelectItem>
                            <SelectItem value="Glass Fiber">Glass Fiber</SelectItem>
                            <SelectItem value="Steel">Steel</SelectItem>
                            <SelectItem value="Composite">Composite</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="differentialType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono">Differential Type</FormLabel>
                      <FormControl>
                        <Select value={field.value || ""} onValueChange={field.onChange}>
                          <SelectTrigger className="font-mono">
                            <SelectValue placeholder="Select differential type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Gears">Gear Differential</SelectItem>
                            <SelectItem value="Oil">Oil Differential</SelectItem>
                            <SelectItem value="Ball Diff">Ball Differential</SelectItem>
                            <SelectItem value="One-way">One-way Differential</SelectItem>
                            <SelectItem value="Limited Slip">Limited Slip Differential</SelectItem>
                            <SelectItem value="Spool">Spool (Locked)</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="motorSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono">Motor Size</FormLabel>
                      <FormControl>
                        <Select value={field.value || ""} onValueChange={field.onChange}>
                          <SelectTrigger className="font-mono">
                            <SelectValue placeholder="Select motor size" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="540">540 Motor</SelectItem>
                            <SelectItem value="380">380 Motor</SelectItem>
                            <SelectItem value="Brushless">Brushless Motor</SelectItem>
                            <SelectItem value="13.5T">13.5T Brushless</SelectItem>
                            <SelectItem value="17.5T">17.5T Brushless</SelectItem>
                            <SelectItem value="21.5T">21.5T Brushless</SelectItem>
                            <SelectItem value="25.5T">25.5T Brushless</SelectItem>
                            <SelectItem value="Custom">Custom/Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="batteryType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono">Battery Type</FormLabel>
                      <FormControl>
                        <Select value={field.value || ""} onValueChange={field.onChange}>
                          <SelectTrigger className="font-mono">
                            <SelectValue placeholder="Select battery type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="7.2V NiMH">7.2V NiMH</SelectItem>
                            <SelectItem value="7.4V LiPo 2S">7.4V LiPo (2S)</SelectItem>
                            <SelectItem value="11.1V LiPo 3S">11.1V LiPo (3S)</SelectItem>
                            <SelectItem value="14.8V LiPo 4S">14.8V LiPo (4S)</SelectItem>
                            <SelectItem value="6V NiMH">6V NiMH</SelectItem>
                            <SelectItem value="8.4V NiMH">8.4V NiMH</SelectItem>
                            <SelectItem value="LiFe">LiFe (Lithium Iron)</SelectItem>
                            <SelectItem value="Custom">Custom/Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono">Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      placeholder="Additional notes about this model..."
                      className="font-mono"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Reference Links */}
            <div className="space-y-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center space-x-2 mb-3">
                <ExternalLink className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span className="font-mono text-sm font-semibold text-purple-800 dark:text-purple-200">Reference Links</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tamiyaUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono text-sm">Official Tamiya URL</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="https://www.tamiya.com/english/products/..."
                          className="font-mono text-xs"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tamiyaBaseUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono text-sm">TamiyaBase URL</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="https://www.tamiyabase.com/database/item/..."
                          className="font-mono text-xs"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Tags Section */}
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono">Tags</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      {/* Current tags */}
                      {field.value && field.value.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {field.value.map((tag) => (
                            <Badge key={tag} variant="secondary" className="font-mono">
                              {tag}
                              <button
                                type="button"
                                onClick={() => removeTag(tag)}
                                className="ml-2 hover:text-red-600"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      {/* Add new tag */}
                      <div className="relative">
                        <div className="flex space-x-2">
                          <div className="relative flex-1">
                            <Input
                              value={newTag}
                              onChange={(e) => setNewTag(e.target.value)}
                              placeholder="Add a tag..."
                              className="font-mono"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  if (newTag.trim()) {
                                    addTag(newTag.trim());
                                  }
                                }
                                if (e.key === "Escape") {
                                  setShowSuggestions(false);
                                }
                              }}
                              onFocus={() => {
                                if (tagSuggestions.length > 0) {
                                  setShowSuggestions(true);
                                }
                              }}
                              onBlur={() => {
                                // Delay hiding suggestions to allow clicking
                                setTimeout(() => setShowSuggestions(false), 200);
                              }}
                            />
                            
                            {/* Tag suggestions dropdown */}
                            {showSuggestions && tagSuggestions.length > 0 && (
                              <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-40 overflow-y-auto">
                                {tagSuggestions.map((suggestion) => (
                                  <button
                                    key={suggestion}
                                    type="button"
                                    className="w-full text-left px-3 py-2 text-sm font-mono hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    onClick={() => {
                                      addTag(suggestion);
                                      setNewTag("");
                                      setShowSuggestions(false);
                                    }}
                                  >
                                    {suggestion}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addTag(newTag.trim())}
                            disabled={!newTag.trim()}
                            className="font-mono"
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                      
                      {/* Common tags */}
                      <div className="space-y-2">
                        <p className="text-sm text-gray-500 font-mono">Quick add:</p>
                        <div className="flex flex-wrap gap-1">
                          {commonTags.map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => addTag(tag)}
                              disabled={field.value?.includes(tag)}
                              className="text-xs bg-gray-100 dark:bg-gray-800 hover:bg-red-100 dark:hover:bg-red-900 disabled:opacity-50 disabled:cursor-not-allowed px-2 py-1 rounded font-mono transition-colors"
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                disabled={updateModelMutation.isPending}
                className="bg-red-600 hover:bg-red-700 font-mono"
              >
                {updateModelMutation.isPending ? "Updating..." : "Update Model"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}