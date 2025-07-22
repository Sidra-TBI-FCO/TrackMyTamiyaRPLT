import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus, X, Tag, Link, Loader2, Globe } from "lucide-react";
import { insertModelSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTamiyaScraper } from "@/hooks/use-tamiya-scraper";
import { ModelWithRelations } from "@/types";
import { z } from "zod";

const formSchema = insertModelSchema.extend({
  itemNumber: z.string().min(1, "Item number is required"),
  name: z.string().min(1, "Model name is required"),
  tags: z.array(z.string()).default([]),
  totalCost: z.union([z.string(), z.number()]).transform(val => typeof val === 'string' ? (val === '' ? 0 : parseFloat(val)) : val).default(0),
});

type FormData = z.infer<typeof formSchema>;

interface AddModelDialogProps {
  trigger?: React.ReactNode;
}

const popularChassis = [
  "TT-01", "TT-02", "TT-03", "TA-01", "TA-02", "TA-03", "TA-04", "TA-05", "TA-06", "TA-07", "TA-08",
  "TB-01", "TB-02", "TB-03", "TB-04", "TB-05", "TC-01", "TC-02", "TC-03",
  "DF-01", "DF-02", "DF-03", "DF-04", "M-01", "M-02", "M-03", "M-04", "M-05", "M-06", "M-07", "M-08",
  "XV-01", "XV-02", "CC-01", "CC-02", "CR-01", "DT-01", "DT-02", "DT-03",
  "FF-01", "FF-02", "FF-03", "F-1", "F103", "F104", "F201", "Gravel Hound"
];

export default function AddModelDialog({ trigger }: AddModelDialogProps) {
  const [open, setOpen] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [productUrl, setProductUrl] = useState("");
  const [isParsingUrl, setIsParsingUrl] = useState(false);
  const [parseLog, setParseLog] = useState<string[]>([]);
  const [chassisSuggestions, setChassisSuggestions] = useState<string[]>([]);
  const [showChassisSuggestions, setShowChassisSuggestions] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { scrapeModelData, isLoading: isScraping } = useTamiyaScraper();

  // Get all models to extract existing tags
  const { data: models } = useQuery<ModelWithRelations[]>({
    queryKey: ["/api/models"],
  });

  // Get all unique existing tags from all models
  const allExistingTags = Array.from(
    new Set(
      models?.flatMap(model => model.tags || []) || []
    )
  ).sort();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      itemNumber: "", 
      chassis: "",
      releaseYear: undefined,
      buildStatus: "planning",
      totalCost: 0,
      notes: "",
      tags: [],
    },
  });

  const commonTags = [
    "Racing", "Drift", "Buggy", "Touring", "Rally", "Truck", 
    "Vintage", "Competition", "Beginner", "Advanced", "TT-02", "TT-01",
    "Chassis", "Body", "Upgrade", "Electronics"
  ];

  const createModelMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/models", data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/models"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Model added successfully",
      });
      setOpen(false);
      form.reset();
    },
    onError: (error) => {
      console.error("Mutation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add model",
        variant: "destructive",
      });
    },
  });

  const handleItemNumberBlur = async () => {
    const itemNumber = form.getValues("itemNumber");
    if (itemNumber && !form.getValues("name")) {
      try {
        const scrapedData = await scrapeModelData(itemNumber);
        if (scrapedData) {
          form.setValue("name", scrapedData.name);
          if (scrapedData.chassis) form.setValue("chassis", scrapedData.chassis);
          if (scrapedData.releaseYear) form.setValue("releaseYear", scrapedData.releaseYear);
        }
      } catch (error) {
        console.log("Auto-population failed, user can enter data manually");
        // Silently fail - user can still enter data manually
      }
    }
  };

  // URL parsing function for models
  const parseProductUrl = async (url: string) => {
    if (!url.trim()) {
      toast({
        title: "Error",
        description: "Please enter a product URL",
        variant: "destructive",
      });
      return;
    }

    setIsParsingUrl(true);
    setParseLog(["🔄 Parsing product URL..."]);
    
    try {
      // Extract item number from URL first
      const tamiyaItemMatch = url.match(/(\d{5})/);
      let extractedItemNumber = "";
      
      if (tamiyaItemMatch) {
        extractedItemNumber = tamiyaItemMatch[1];
        form.setValue('itemNumber', extractedItemNumber);
        setParseLog(prev => [...prev, `✅ Item number: ${extractedItemNumber}`]);
      }

      // Try web scraping (optional - fails gracefully)
      try {
        const response = await fetch('/api/scrape-product', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url }),
        });
        
        if (response.ok) {
          const scrapedData = await response.json();
          const newLog = [...parseLog, "✅ Successfully scraped product page!"];
          
          if (scrapedData.name) {
            form.setValue('name', scrapedData.name);
            newLog.push(`✅ Model name: ${scrapedData.name}`);
          }
          
          if (scrapedData.chassis) {
            form.setValue('chassis', scrapedData.chassis);
            newLog.push(`✅ Chassis: ${scrapedData.chassis}`);
          }

          if (scrapedData.totalCost) {
            form.setValue('totalCost', scrapedData.totalCost.toString());
            newLog.push(`✅ Price: $${scrapedData.totalCost}`);
          }

          if (scrapedData.releaseYear) {
            form.setValue('releaseYear', scrapedData.releaseYear);
            newLog.push(`✅ Release year: ${scrapedData.releaseYear}`);
          }
          
          setParseLog(newLog);
          
          toast({
            title: "Product scraped successfully!",
            description: `Found ${newLog.length - 1} product details`,
          });
        } else {
          throw new Error('Scraping failed');
        }
      } catch (scrapeError) {
        console.log("Web scraping failed:", scrapeError);
        setParseLog(prev => [...prev, "❌ Web scraping failed"]);
        
        // Fallback to item number-based scraping if we have it
        if (extractedItemNumber) {
          setParseLog(prev => [...prev, "⚠️ Trying Tamiya database..."]);
          try {
            const scrapedData = await scrapeModelData(extractedItemNumber);
            if (scrapedData) {
              const newLog = [...parseLog, "✅ Found data from Tamiya database!"];
              
              if (scrapedData.name) {
                form.setValue("name", scrapedData.name);
                newLog.push(`✅ Model name: ${scrapedData.name}`);
              }
              if (scrapedData.chassis) {
                form.setValue("chassis", scrapedData.chassis);
                newLog.push(`✅ Chassis: ${scrapedData.chassis}`);
              }
              if (scrapedData.releaseYear) {
                form.setValue("releaseYear", scrapedData.releaseYear);
                newLog.push(`✅ Release year: ${scrapedData.releaseYear}`);
              }
              
              setParseLog(newLog);
              toast({
                title: "Tamiya data found!",
                description: "Found model details from Tamiya database",
              });
            } else {
              setParseLog(prev => [...prev, "⚠️ No data found in Tamiya database"]);
            }
          } catch (tamiyaError) {
            console.log("Tamiya scraping also failed:", tamiyaError);
            setParseLog(prev => [...prev, "❌ Tamiya database lookup failed"]);
          }
        } else {
          setParseLog(prev => [...prev, "❌ Could not extract item number"]);
        }
      }
    } catch (error) {
      console.error("Error parsing URL:", error);
      setParseLog(prev => [...prev, "❌ Error occurred while parsing URL"]);
      toast({
        title: "Error",
        description: "Failed to parse product URL",
        variant: "destructive",
      });
    } finally {
      setIsParsingUrl(false);
    }
  };

  const addTag = (tag: string) => {
    const currentTags = form.getValues("tags") || [];
    if (tag && !currentTags.includes(tag)) {
      form.setValue("tags", [...currentTags, tag]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues("tags") || [];
    form.setValue("tags", currentTags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      addTag(newTag.trim());
    }
  };

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

  // Update chassis suggestions when chassis field changes  
  const chassisValue = form.watch("chassis");
  useEffect(() => {
    if (chassisValue && chassisValue.trim()) {
      const suggestions = popularChassis.filter(chassis =>
        chassis.toLowerCase().includes(chassisValue.toLowerCase())
      ).slice(0, 5);
      setChassisSuggestions(suggestions);
      setShowChassisSuggestions(suggestions.length > 0 && suggestions[0] !== chassisValue);
    } else {
      setShowChassisSuggestions(false);
    }
  }, [chassisValue]);

  const onSubmit = (data: FormData) => {
    console.log("Form submitted with data:", data);
    console.log("Form errors:", form.formState.errors);
    
    const submissionData = {
      ...data,
      userId: 2, // Mock user ID - should be from auth in production
    };
    
    console.log("Submitting to API:", submissionData);
    createModelMutation.mutate(submissionData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-red-600 hover:bg-red-700 text-white font-mono">
            <Plus className="mr-2 h-4 w-4" />
            Add New Model
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto" aria-describedby="dialog-description">
        <DialogHeader>
          <DialogTitle className="font-mono">Add New Tamiya Model</DialogTitle>
          <p id="dialog-description" className="text-sm text-gray-600 dark:text-gray-400 font-mono">
            Enter your Tamiya model details to add it to your collection.
          </p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* URL Parsing Section */}
            <div className="space-y-3 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center gap-2">
                <Link className="h-4 w-4 text-blue-600" />
                <h3 className="font-mono text-sm font-semibold">Parse from URL</h3>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="https://www.rcmart.com/tamiya-1-10-xv-02-pro-4wd-chassis-kit-ep-58707-00117470"
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  className="font-mono text-sm"
                  disabled={isParsingUrl}
                />
                <Button 
                  type="button"
                  onClick={() => parseProductUrl(productUrl)}
                  disabled={isParsingUrl || !productUrl.trim()}
                  size="sm"
                >
                  {isParsingUrl ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                  Parse
                </Button>
              </div>
              
              {parseLog.length > 0 && (
                <div className="text-xs font-mono space-y-1 max-h-20 overflow-y-auto">
                  {parseLog.map((log, index) => (
                    <div key={index} className="text-gray-600 dark:text-gray-300">{log}</div>
                  ))}
                </div>
              )}
            </div>
            <FormField
              control={form.control}
              name="itemNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono">Item Number *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g. 58679"
                      className="font-mono"
                      onBlur={handleItemNumberBlur}
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
                      disabled={isScraping}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="chassis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono">Chassis</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        placeholder="e.g. TT-02"
                        className="font-mono"
                        disabled={isScraping}
                        onFocus={() => {
                          if (!field.value) {
                            setChassisSuggestions(popularChassis.slice(0, 8));
                            setShowChassisSuggestions(true);
                          }
                        }}
                        onBlur={(e) => {
                          // Delay hiding suggestions to allow clicking on them
                          setTimeout(() => setShowChassisSuggestions(false), 150);
                        }}
                      />
                    </FormControl>
                    
                    {/* Chassis suggestions dropdown */}
                    {showChassisSuggestions && chassisSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {chassisSuggestions.map((chassis) => (
                          <button
                            key={chassis}
                            type="button"
                            className="w-full px-3 py-2 text-left text-sm font-mono hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none"
                            onClick={() => {
                              field.onChange(chassis);
                              setShowChassisSuggestions(false);
                            }}
                          >
                            {chassis}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      disabled={isScraping}
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
                      value={field.value?.toString() || ""}
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="font-mono"
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono flex items-center">
                    <Tag className="mr-2 h-4 w-4" />
                    Tags
                  </FormLabel>
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
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input
                              value={newTag}
                              onChange={(e) => setNewTag(e.target.value)}
                              onKeyPress={handleTagInputKeyPress}
                              placeholder="Add a tag..."
                              className="font-mono"
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
                onClick={() => setOpen(false)}
                className="font-mono"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createModelMutation.isPending || isScraping}
                className="bg-red-600 hover:bg-red-700 font-mono"
              >
                {createModelMutation.isPending || isScraping ? "Adding..." : "Add Model"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
