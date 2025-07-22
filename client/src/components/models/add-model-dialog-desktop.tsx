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
import { ModelWithRelations } from "@/types";
import { useTamiyaScraper } from "@/hooks/use-tamiya-scraper";
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
  const [isParsingUrl, setIsParsingUrl] = useState(false);
  const [urlParseLog, setUrlParseLog] = useState<string[]>([]);
  const [productUrl, setProductUrl] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { scrapeModelData, isLoading: isScraping } = useTamiyaScraper();

  // Get all models to extract existing tags
  const { data: models } = useQuery<ModelWithRelations[]>({
    queryKey: ["/api/models"],
  });

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
      scale: "",
      driveType: "",
      chassisMaterial: "",
      differentialType: "",
      motorSize: "",
      batteryType: "",
      tags: [],
      userId: 2, // Mock user ID
    },
  });

  const createModelMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/models", data);
      return response;
    },
    onSuccess: (newModel: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/models"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Model added successfully!",
        description: `${newModel.name} has been added to your collection.`,
      });
      form.reset();
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add model",
        variant: "destructive",
      });
    },
  });

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

  // Auto-populate from item number
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
      }
    }
  };

  // URL parsing function
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
    setUrlParseLog(["🔄 Parsing product URL..."]);
    
    try {
      // Extract item number from URL first
      const tamiyaItemMatch = url.match(/(\d{5})/);
      let extractedItemNumber = "";
      
      if (tamiyaItemMatch) {
        extractedItemNumber = tamiyaItemMatch[1];
        form.setValue('itemNumber', extractedItemNumber);
        setUrlParseLog(prev => [...prev, `✅ Item number: ${extractedItemNumber}`]);
      }

      // Try web scraping first
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
          const newLog = [...urlParseLog, "✅ Successfully scraped product page!"];
          
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
          
          setUrlParseLog(newLog);
          
          toast({
            title: "Product scraped successfully!",
            description: `Found ${newLog.length - 1} product details`,
          });
        } else {
          throw new Error('Scraping failed');
        }
      } catch (scrapeError) {
        console.log("Web scraping failed:", scrapeError);
        setUrlParseLog(prev => [...prev, "❌ Web scraping failed"]);
        
        // Fallback to item number-based scraping if we have it
        if (extractedItemNumber) {
          setUrlParseLog(prev => [...prev, "⚠️ Trying Tamiya database..."]);
          try {
            const scrapedData = await scrapeModelData(extractedItemNumber);
            if (scrapedData) {
              const newLog = [...urlParseLog, "✅ Found data from Tamiya database!"];
              
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
              
              setUrlParseLog(newLog);
              toast({
                title: "Tamiya data found!",
                description: "Found model details from Tamiya database",
              });
            } else {
              setUrlParseLog(prev => [...prev, "⚠️ No data found in Tamiya database"]);
            }
          } catch (tamiyaError) {
            setUrlParseLog(prev => [...prev, "❌ Tamiya database lookup failed"]);
          }
        }
        
        toast({
          title: "Auto-population failed",
          description: "Please enter model details manually",
          variant: "destructive",
        });
      }
    } catch (error) {
      setUrlParseLog(prev => [...prev, "❌ Parsing failed completely"]);
      toast({
        title: "Error",
        description: "Failed to parse URL",
        variant: "destructive",
      });
    } finally {
      setIsParsingUrl(false);
    }
  };

  const onSubmit = (data: FormData) => {
    createModelMutation.mutate(data);
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
      <DialogContent className="sm:max-w-[425px] lg:max-w-[1200px] xl:max-w-[1400px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono text-xl">Add New Tamiya Model</DialogTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
            Enter your Tamiya model details to add it to your collection.
          </p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Desktop Layout with Two Columns */}
            <div className="lg:grid lg:grid-cols-2 lg:gap-8 space-y-6 lg:space-y-0">
              {/* Left Column - Basic Information */}
              <div className="space-y-6">
                <div className="space-y-4 p-4 border rounded-lg bg-white dark:bg-gray-900">
                  <h3 className="text-lg font-mono font-semibold text-gray-900 dark:text-white">Basic Information</h3>
                  
                  {/* URL Parsing Section */}
                  <div className="space-y-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="font-mono text-sm text-blue-800 dark:text-blue-200">Quick Add from URL</span>
                    </div>
                    <div className="flex space-x-2">
                      <Input
                        value={productUrl}
                        onChange={(e) => setProductUrl(e.target.value)}
                        placeholder="Paste Amazon, eBay, or Tamiya product URL..."
                        className="font-mono flex-1"
                        disabled={isParsingUrl}
                      />
                      <Button
                        type="button"
                        onClick={() => parseProductUrl(productUrl)}
                        disabled={isParsingUrl || !productUrl}
                        className="bg-blue-600 hover:bg-blue-700 font-mono whitespace-nowrap"
                      >
                        {isParsingUrl ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link className="h-4 w-4" />}
                        {isParsingUrl ? "Parsing..." : "Parse"}
                      </Button>
                    </div>
                    {urlParseLog.length > 0 && (
                      <div className="text-xs font-mono bg-white dark:bg-gray-800 p-2 rounded border max-h-20 overflow-y-auto">
                        {urlParseLog.map((log, index) => (
                          <div key={index} className="text-gray-700 dark:text-gray-300">{log}</div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  </div>

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

                  <FormField
                    control={form.control}
                    name="chassis"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-mono">Chassis</FormLabel>
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
                </div>

                {/* Project Details */}
                <div className="space-y-4 p-4 border rounded-lg bg-white dark:bg-gray-900">
                  <h3 className="text-lg font-mono font-semibold text-gray-900 dark:text-white">Project Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            placeholder="Any additional notes or comments about this model..."
                            rows={3}
                            className="font-mono resize-none"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Right Column - Technical Specifications & Tags */}
              <div className="space-y-6">
                <div className="space-y-4 p-4 border rounded-lg bg-white dark:bg-gray-900">
                  <h3 className="text-lg font-mono font-semibold text-gray-900 dark:text-white">Technical Specifications</h3>
                  
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
                                <SelectItem value="1/14">1/14</SelectItem>
                                <SelectItem value="1/16">1/16</SelectItem>
                                <SelectItem value="1/18">1/18</SelectItem>
                                <SelectItem value="1/24">1/24</SelectItem>
                                <SelectItem value="1/32">1/32</SelectItem>
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
                                <SelectItem value="4WD">4WD (Four Wheel Drive)</SelectItem>
                                <SelectItem value="RWD">RWD (Rear Wheel Drive)</SelectItem>
                                <SelectItem value="FWD">FWD (Front Wheel Drive)</SelectItem>
                                <SelectItem value="AWD">AWD (All Wheel Drive)</SelectItem>
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
                                <SelectValue placeholder="Select chassis material" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Plastic">Plastic</SelectItem>
                                <SelectItem value="Carbon">Carbon Fiber</SelectItem>
                                <SelectItem value="Aluminium">Aluminium</SelectItem>
                                <SelectItem value="Carbon/Alu">Carbon & Aluminium</SelectItem>
                                <SelectItem value="FRP">FRP (Fiber Reinforced Plastic)</SelectItem>
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

                {/* Tags Section */}
                <div className="space-y-4 p-4 border rounded-lg bg-white dark:bg-gray-900">
                  <h3 className="text-lg font-mono font-semibold text-gray-900 dark:text-white">Tags</h3>
                  
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="Add tag..."
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newTag.trim()) {
                            e.preventDefault();
                            addTag(newTag.trim());
                          }
                        }}
                        className="flex-1 font-mono"
                      />
                      <Button
                        type="button"
                        onClick={() => addTag(newTag)}
                        disabled={!newTag.trim()}
                        size="sm"
                        className="font-mono"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Selected tags */}
                    {(form.watch("tags") || []).length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {(form.watch("tags") || []).map((tag) => (
                          <Badge key={tag} variant="secondary" className="font-mono">
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="ml-1 hover:text-red-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
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
                disabled={createModelMutation.isPending}
                className="bg-red-600 hover:bg-red-700 font-mono"
              >
                {createModelMutation.isPending ? "Adding..." : "Add Model"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}