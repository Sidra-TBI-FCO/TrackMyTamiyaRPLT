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
  const [urlParseLog, setUrlParseLog] = useState<string[]>([]);
  const [productText, setProductText] = useState("");
  const [isParsingText, setIsParsingText] = useState(false);
  const [textParseLog, setTextParseLog] = useState<string[]>([]);
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
      configurationType: "kit",
      chassis: "",
      chassisName: "",
      chassisItemNumber: "",
      chassisCost: 0,
      bodyName: "",
      bodyItemNumber: "",
      bodyCost: 0,
      bodyManufacturer: "",
      bodyScale: "",
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

  const commonTags = [
    "Racing", "Drift", "Buggy", "Touring", "Rally", "Truck", 
    "Vintage", "Competition", "Beginner", "Advanced", "TT-02", "TT-01",
    "Chassis", "Body", "Upgrade", "Electronics"
  ];

  const createModelMutation = useMutation({
    mutationFn: async (data: FormData) => {
      console.log("Mutation function called with data:", data);
      // Show debugging toast for mobile
      toast({
        title: "API Request Started",
        description: "Sending data to server...",
      });
      
      try {
        const response = await apiRequest("POST", "/api/models", data);
        console.log("API response:", response);
        return response;
      } catch (error) {
        console.error("API request failed:", error);
        toast({
          title: "API Error",
          description: `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Mutation successful:", data);
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
      console.error("Error details:", JSON.stringify(error, null, 2));
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
            console.log("Tamiya scraping also failed:", tamiyaError);
            setUrlParseLog(prev => [...prev, "❌ Tamiya database lookup failed"]);
          }
        } else {
          setUrlParseLog(prev => [...prev, "❌ Could not extract item number"]);
        }
      }
    } catch (error) {
      console.error("Error parsing URL:", error);
      setUrlParseLog(prev => [...prev, "❌ Error occurred while parsing URL"]);
      toast({
        title: "Error",
        description: "Failed to parse product URL",
        variant: "destructive",
      });
    } finally {
      setIsParsingUrl(false);
    }
  };

  // Text blob parsing function
  const parseProductText = async (text: string) => {
    if (!text.trim()) {
      toast({
        title: "Error", 
        description: "Please enter product description text",
        variant: "destructive",
      });
      return;
    }

    setIsParsingText(true);
    setTextParseLog(["🔄 Parsing product description..."]);

    try {
      // Convert text to lowercase for case-insensitive matching
      const textLower = text.toLowerCase();
      
      // Extract chassis information
      const chassisPatterns = [
        /XV-(\d+)/gi,
        /TT-(\d+)/gi,
        /TA-(\d+)/gi,
        /TB-(\d+)/gi,
        /DF-(\d+)/gi,
        /M-(\d+)/gi,
        /CC-(\d+)/gi,
        /CR-(\d+)/gi,
        /DT-(\d+)/gi,
        /FF-(\d+)/gi,
        /TC-(\d+)/gi,
      ];

      let foundChassis = "";
      for (const pattern of chassisPatterns) {
        const match = text.match(pattern);
        if (match) {
          foundChassis = match[0].toUpperCase();
          break;
        }
      }

      // Extract scale
      const scaleMatch = text.match(/1\/(\d+)\s*scale/i);
      let foundScale = "";
      if (scaleMatch) {
        foundScale = `1/${scaleMatch[1]}`;
      }

      // Extract drive type
      let foundDriveType = "";
      if (textLower.includes('4wd') || textLower.includes('four wheel')) foundDriveType = "4WD";
      else if (textLower.includes('rwd') || textLower.includes('rear wheel')) foundDriveType = "RWD";
      else if (textLower.includes('fwd') || textLower.includes('front wheel')) foundDriveType = "FWD";
      else if (textLower.includes('awd') || textLower.includes('all wheel')) foundDriveType = "AWD";

      // Extract chassis material
      let foundChassisMaterial = "";
      if (textLower.includes('carbon fiber') || textLower.includes('carbon-fiber')) foundChassisMaterial = "Carbon";
      else if (textLower.includes('aluminum') || textLower.includes('aluminium')) foundChassisMaterial = "Aluminium";
      else if (textLower.includes('plastic') || textLower.includes('resin')) foundChassisMaterial = "Plastic";
      else if (textLower.includes('frp') || textLower.includes('fiber reinforced')) foundChassisMaterial = "FRP";

      // Extract differential type
      let foundDifferentialType = "";
      if (textLower.includes('ball diff') || textLower.includes('ball differential')) foundDifferentialType = "Ball Diff";
      else if (textLower.includes('oil diff') || textLower.includes('oil differential')) foundDifferentialType = "Oil";
      else if (textLower.includes('gear diff') || textLower.includes('gear differential')) foundDifferentialType = "Gears";
      else if (textLower.includes('one-way') || textLower.includes('oneway')) foundDifferentialType = "One-way";

      // Extract motor size
      let foundMotorSize = "";
      if (textLower.includes('540') && textLower.includes('motor')) foundMotorSize = "540";
      else if (textLower.includes('380') && textLower.includes('motor')) foundMotorSize = "380";
      else if (textLower.includes('brushless')) foundMotorSize = "Brushless";
      else {
        const motorMatch = textLower.match(/(\d+\.?\d*)\s*t\s*(brushless|motor)/);
        if (motorMatch) foundMotorSize = `${motorMatch[1]}T Brushless`;
      }

      // Extract battery type
      let foundBatteryType = "";
      if (textLower.includes('7.2v') && textLower.includes('nimh')) foundBatteryType = "7.2V NiMH";
      else if (textLower.includes('7.4v') && textLower.includes('lipo')) foundBatteryType = "7.4V LiPo 2S";
      else if (textLower.includes('11.1v') && textLower.includes('lipo')) foundBatteryType = "11.1V LiPo 3S";
      else if (textLower.includes('14.8v') && textLower.includes('lipo')) foundBatteryType = "14.8V LiPo 4S";
      else if (textLower.includes('nimh')) foundBatteryType = "7.2V NiMH";
      else if (textLower.includes('lipo')) foundBatteryType = "7.4V LiPo 2S";

      // Extract item numbers (5-digit codes)
      const itemNumberMatch = text.match(/\b(\d{5})\b/);
      let foundItemNumber = "";
      if (itemNumberMatch) {
        foundItemNumber = itemNumberMatch[1];
      }

      // Extract model name from title-like patterns
      const titlePatterns = [
        /Tamiya\s+[\d\/]+\s+([^(\n]+)/i,
        /^([^:\n]+(?:chassis|kit|pro))/im,
        /Include[s]?:\s*([^(\n]+)/i,
      ];

      let foundName = "";
      for (const pattern of titlePatterns) {
        const match = text.match(pattern);
        if (match) {
          foundName = match[1].trim().replace(/\s+/g, ' ');
          // Clean up common suffixes
          foundName = foundName.replace(/(EP|Kit|Chassis|Assembly).*$/i, '').trim();
          break;
        }
      }

      // Apply extracted data
      const newLog = ["🔄 Parsing product description..."];
      let foundData = false;

      if (foundItemNumber) {
        form.setValue('itemNumber', foundItemNumber);
        newLog.push(`✅ Item number: ${foundItemNumber}`);
        foundData = true;
      }

      if (foundName) {
        form.setValue('name', foundName);
        newLog.push(`✅ Model name: ${foundName}`);
        foundData = true;
      }

      if (foundChassis) {
        form.setValue('chassis', foundChassis);
        newLog.push(`✅ Chassis: ${foundChassis}`);
        foundData = true;
      }

      if (foundScale) {
        form.setValue('scale', foundScale);
        newLog.push(`✅ Scale: ${foundScale}`);
        foundData = true;
      }

      if (foundDriveType) {
        form.setValue('driveType', foundDriveType);
        newLog.push(`✅ Drive type: ${foundDriveType}`);
        foundData = true;
      }

      if (foundChassisMaterial) {
        form.setValue('chassisMaterial', foundChassisMaterial);
        newLog.push(`✅ Chassis material: ${foundChassisMaterial}`);
        foundData = true;
      }

      if (foundDifferentialType) {
        form.setValue('differentialType', foundDifferentialType);
        newLog.push(`✅ Differential: ${foundDifferentialType}`);
        foundData = true;
      }

      if (foundMotorSize) {
        form.setValue('motorSize', foundMotorSize);
        newLog.push(`✅ Motor: ${foundMotorSize}`);
        foundData = true;
      }

      if (foundBatteryType) {
        form.setValue('batteryType', foundBatteryType);
        newLog.push(`✅ Battery: ${foundBatteryType}`);
        foundData = true;
      }

      // Auto-detect tags based on content
      const detectedTags = [];
      
      if (textLower.includes('touring') || textLower.includes('on-road')) detectedTags.push('Touring');
      if (textLower.includes('rally')) detectedTags.push('Rally');
      if (textLower.includes('drift')) detectedTags.push('Drift');
      if (textLower.includes('racing')) detectedTags.push('Racing');
      if (textLower.includes('competition') || textLower.includes('pro')) detectedTags.push('Competition');
      if (textLower.includes('carbon')) detectedTags.push('Carbon');
      if (textLower.includes('aluminum') || textLower.includes('aluminium')) detectedTags.push('Aluminum');
      if (textLower.includes('4wd') || textLower.includes('four wheel')) detectedTags.push('4WD');
      
      if (detectedTags.length > 0) {
        const currentTags = form.getValues("tags") || [];
        const newTags = [...currentTags, ...detectedTags.filter(tag => !currentTags.includes(tag))];
        form.setValue("tags", newTags);
        newLog.push(`✅ Auto-tagged: ${detectedTags.join(', ')}`);
        foundData = true;
      }

      setTextParseLog(newLog);

      if (foundData) {
        toast({
          title: "Description parsed successfully!",
          description: `Extracted ${newLog.length - 1} details from description`,
        });
      } else {
        setTextParseLog(prev => [...prev, "⚠️ No recognizable data found in description"]);
        toast({
          title: "Parsing completed",
          description: "No extractable data found in the description",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error("Error parsing text:", error);
      setTextParseLog(prev => [...prev, "❌ Error occurred while parsing text"]);
      toast({
        title: "Error",
        description: "Failed to parse product description",
        variant: "destructive",
      });
    } finally {
      setIsParsingText(false);
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
    
    // Show toast for debugging on mobile
    toast({
      title: "Form Submission Started",
      description: `Submitting model: ${data.name}`,
    });
    
    // Data already includes userId from default values
    
    console.log("Submitting to API:", data);
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
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono">Add New Tamiya Model</DialogTitle>
          <p id="dialog-description" className="text-sm text-gray-600 dark:text-gray-400 font-mono">
            Enter your Tamiya model details to add it to your collection.
          </p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-dashlane-autofill="false">
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
              
              {urlParseLog.length > 0 && (
                <div className="text-xs font-mono space-y-1 max-h-20 overflow-y-auto">
                  {urlParseLog.map((log, index) => (
                    <div key={index} className="text-gray-600 dark:text-gray-300">{log}</div>
                  ))}
                </div>
              )}
            </div>

            {/* Text Parsing Section */}
            <div className="space-y-3 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-green-600" />
                <h3 className="font-mono text-sm font-semibold">Parse Product Description</h3>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                Copy and paste product description text to extract model details automatically.
              </p>
              
              <div className="space-y-2">
                <Textarea
                  value={productText}
                  onChange={(e) => setProductText(e.target.value)}
                  placeholder="Paste product description here (e.g., from Tamiya website, manual, or retailer)..."
                  className="min-h-[100px] font-mono text-sm"
                  disabled={isParsingText}
                />
                
                <Button
                  type="button"
                  onClick={() => parseProductText(productText)}
                  disabled={!productText.trim() || isParsingText}
                  size="sm"
                  className="w-full bg-green-600 hover:bg-green-700 font-mono"
                >
                  {isParsingText ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Parsing...
                    </>
                  ) : (
                    <>
                      <Tag className="mr-2 h-4 w-4" />
                      Parse Description
                    </>
                  )}
                </Button>
              </div>
              
              {/* Parse log display for text parsing */}
              {textParseLog.length > 0 && (
                <div className="space-y-1">
                  <h4 className="text-sm font-medium font-mono">Parse Results:</h4>
                  <div className="bg-white dark:bg-gray-900 border rounded p-3 space-y-1 max-h-32 overflow-y-auto">
                    {textParseLog.map((log, index) => (
                      <div key={index} className="text-xs font-mono text-gray-600 dark:text-gray-400">
                        {log}
                      </div>
                    ))}
                  </div>
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
              name="configurationType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono">Configuration Type</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="font-mono">
                        <SelectValue placeholder="Select configuration type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kit">Complete Kit</SelectItem>
                        <SelectItem value="chassis_body">Separate Chassis + Body</SelectItem>
                        <SelectItem value="custom">Custom Build</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1">
                    {field.value === "kit" && "Single complete kit with everything included"}
                    {field.value === "chassis_body" && "Separate chassis and body with individual item numbers"}
                    {field.value === "custom" && "Custom or scratch-built configuration"}
                  </div>
                </FormItem>
              )}
            />

            {/* Conditional fields based on configuration type */}
            {form.watch("configurationType") === "kit" && (
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
            )}

            {form.watch("configurationType") === "chassis_body" && (
              <>
                {/* Chassis Information */}
                <div className="space-y-4 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
                  <h3 className="font-mono font-semibold text-blue-900 dark:text-blue-100">Chassis Details</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="chassisName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-mono">Chassis Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value || ""}
                              placeholder="e.g. TT-02 Chassis"
                              className="font-mono"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="chassisItemNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-mono">Chassis Item #</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value || ""}
                              placeholder="e.g. 46005"
                              className="font-mono"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="chassisCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-mono">Chassis Cost</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            type="number"
                            step="0.01"
                            min="0"
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

                {/* Body Information */}
                <div className="space-y-4 p-4 border rounded-lg bg-green-50 dark:bg-green-950">
                  <h3 className="font-mono font-semibold text-green-900 dark:text-green-100">Body Details</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="bodyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-mono">Body Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value || ""}
                              placeholder="e.g. Subaru BRZ Body"
                              className="font-mono"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bodyItemNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-mono">Body Item #</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value || ""}
                              placeholder="e.g. 51612"
                              className="font-mono"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="bodyCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-mono">Body Cost</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value || ""}
                              type="number"
                              step="0.01"
                              min="0"
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
                      name="bodyManufacturer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-mono">Body Manufacturer</FormLabel>
                          <FormControl>
                            <Select value={field.value || ""} onValueChange={field.onChange}>
                              <SelectTrigger className="font-mono">
                                <SelectValue placeholder="Select manufacturer" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Tamiya">Tamiya</SelectItem>
                                <SelectItem value="HPI Racing">HPI Racing</SelectItem>
                                <SelectItem value="Protoform">Protoform</SelectItem>
                                <SelectItem value="Bittydesign">Bittydesign</SelectItem>
                                <SelectItem value="JConcepts">JConcepts</SelectItem>
                                <SelectItem value="Custom">Custom/Other</SelectItem>
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
                    name="bodyScale"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-mono">Body Scale (if different from chassis)</FormLabel>
                        <FormControl>
                          <Select value={field.value || ""} onValueChange={field.onChange}>
                            <SelectTrigger className="font-mono">
                              <SelectValue placeholder="Select body scale" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1/10">1/10</SelectItem>
                              <SelectItem value="1/12">1/12</SelectItem>
                              <SelectItem value="1/8">1/8</SelectItem>
                              <SelectItem value="1/14">1/14</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
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
                onClick={(e) => {
                  console.log("Submit button clicked");
                  toast({
                    title: "Submit Button Clicked",
                    description: "Form submission initiated",
                  });
                  
                  // Check form validation
                  const formValues = form.getValues();
                  const formErrors = form.formState.errors;
                  console.log("Form values:", formValues);
                  console.log("Form errors:", formErrors);
                  
                  // Show validation errors via toast for mobile debugging
                  if (Object.keys(formErrors).length > 0) {
                    toast({
                      title: "Form Validation Failed",
                      description: `Missing: ${Object.keys(formErrors).join(', ')}`,
                      variant: "destructive",
                    });
                    e.preventDefault(); // Prevent form submission if there are errors
                  }
                }}
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
