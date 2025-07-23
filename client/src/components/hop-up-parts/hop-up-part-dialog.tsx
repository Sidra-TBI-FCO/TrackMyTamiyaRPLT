import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { insertHopUpPartSchema, type HopUpPart } from "@shared/schema";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";

const formSchema = insertHopUpPartSchema.extend({
  cost: z.coerce.number().optional(),
  compatibility: z.array(z.string()).default([]),
  installationDate: z.string().optional(),
  manufacturer: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface HopUpPartDialogProps {
  modelId: number;
  part?: HopUpPart | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categories = [
  "Motor", "ESC", "Servo", "Receiver", "Battery",
  "Chassis", "Suspension", "Wheels", "Tires", "Drivetrain",
  "Body", "Wing", "Interior", "Lights", "Electronics",
  "Tools", "Maintenance", "Other"
];

const suppliers = [
  "RC Mart", "AMain Hobbies", "Tower Hobbies", "Horizon Hobby", 
  "TamiyaBase", "HobbyLink Japan", "Plaza Japan", "Other"
];

const manufacturers = [
  "Tamiya", "Xtra Speed", "Yeah Racing", "MST", "3Racing",
  "GPM Racing", "Hot Racing", "Kyosho", "Associated", "TLR", "Other"
];

const chassisCompatibility = [
  "TA01", "TA02", "TA03", "TA04", "TA05", "TA06", "TA07", "TA08",
  "TB01", "TB02", "TB03", "TB04", "TB05",
  "TC01", "TC02", "TC03",
  "TT01", "TT02", "TT03",
  "DF01", "DF02", "DF03", "DF04",
  "M01", "M02", "M03", "M04", "M05", "M06", "M07", "M08",
  "XV01", "XV02",
  "Other"
];

export default function HopUpPartDialog({ modelId, part, open, onOpenChange }: HopUpPartDialogProps) {
  const [isParsingUrl, setIsParsingUrl] = useState(false);
  const [parseLog, setParseLog] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      modelId,
      name: "",
      itemNumber: "",
      category: "",
      supplier: "",
      manufacturer: "",
      cost: undefined,
      installationStatus: "planned",
      notes: "",
      isTamiyaBrand: false,
      productUrl: "",
      tamiyaBaseUrl: "",
      compatibility: [],
      color: "",
      material: "",
    },
  });

  // Combined parse function that tries scraping first, then falls back to URL-only
  const parseProductUrl = async (url: string) => {
    if (!url) return;
    
    setIsParsingUrl(true);
    setParseLog(["🔄 Parsing product URL..."]);
    
    try {
      // First, try page scraping
      setParseLog(["🔄 Attempting to scrape product page..."]);
      
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
          
          // Check if scraping succeeded
          if (!scrapedData.fallbackSuggested) {
            const newLog = ["✅ Successfully scraped product page!"];
            
            // Apply the scraped data to the form
            if (scrapedData.name) {
              form.setValue('name', scrapedData.name);
              newLog.push(`✅ Product name: ${scrapedData.name}`);
            }
            
            if (scrapedData.manufacturer) {
              form.setValue('manufacturer', scrapedData.manufacturer);
              newLog.push(`✅ Manufacturer: ${scrapedData.manufacturer}`);
            }
            
            if (scrapedData.category) {
              form.setValue('category', scrapedData.category);
              newLog.push(`✅ Category: ${scrapedData.category}`);
            }
            
            if (scrapedData.material) {
              form.setValue('material', scrapedData.material);
              newLog.push(`✅ Material: ${scrapedData.material}`);
            }
            
            if (scrapedData.color) {
              form.setValue('color', scrapedData.color);
              newLog.push(`✅ Color: ${scrapedData.color}`);
            }
            
            if (scrapedData.compatibility && scrapedData.compatibility.length > 0) {
              const currentCompat = form.getValues('compatibility') || [];
              const newCompatibility = Array.from(new Set([...currentCompat, ...scrapedData.compatibility]));
              form.setValue('compatibility', newCompatibility);
              newLog.push(`✅ Chassis compatibility: ${scrapedData.compatibility.join(', ')}`);
            }
            
            if (scrapedData.cost) {
              form.setValue('cost', scrapedData.cost);
              newLog.push(`✅ Price: $${scrapedData.cost}`);
            }
            
            // Extract item number from URL as fallback
            const itemNumberMatch = url.match(/([a-z]{2,4}-[a-z0-9]+)/i);
            if (itemNumberMatch) {
              form.setValue('itemNumber', itemNumberMatch[1].toUpperCase());
              newLog.push(`✅ Item number: ${itemNumberMatch[1].toUpperCase()}`);
            }
            
            // Set store based on URL
            if (url.includes('rcmart.com')) {
              form.setValue('supplier', 'RC Mart');
              newLog.push(`✅ Store: RC Mart`);
            }
            
            setParseLog(newLog);
            
            toast({
              title: "Page scraped successfully!",
              description: `Found ${newLog.length - 1} product details`,
            });
            return;
          }
        }
      } catch (scrapeError) {
        console.log('Scraping failed, falling back to URL parsing:', scrapeError);
      }
      
      // Fallback to URL-only parsing
      setParseLog(["⚠️ Page scraping failed, analyzing URL structure..."]);
      
      const parseLog: string[] = ["🔍 Starting URL analysis..."];
      
      const urlLower = url.toLowerCase();
      parseLog.push(`📝 Processing: ${url}`);

      // Auto-detect if this is a TamiyaBase URL and move it to the correct field
      if (url.includes('tamiyabase.com')) {
        form.setValue('tamiyaBaseUrl', url);
        form.setValue('productUrl', '');
        form.setValue('isTamiyaBrand', true);
        parseLog.push("✅ TamiyaBase URL detected - moved to correct field");
        parseLog.push("✅ Marked as official Tamiya part");
        
        // Extract TamiyaBase part number
        const tamiyaPartMatch = url.match(/parts\/(\d+)-(\d+)/);
        if (tamiyaPartMatch) {
          const partNumber = tamiyaPartMatch[2];
          form.setValue('itemNumber', partNumber);
          parseLog.push(`✅ Extracted TamiyaBase part number: ${partNumber}`);
        }
        
        setParseLog(parseLog);
        toast({ 
          title: "TamiyaBase URL Processed",
          description: `Found ${parseLog.length - 1} product details`
        });
        return;
      }

      // Continue with standard URL parsing logic...
      setParseLog(parseLog);
      toast({
        title: "URL parsed successfully!",
        description: `Found ${parseLog.length - 1} product details`,
      });
      
    } catch (error: any) {
      console.error('Parsing error:', error);
      setParseLog([`❌ Parsing failed: ${error.message}`]);
      
      toast({
        title: "Parsing failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsParsingUrl(false);
    }
  };

  // Load part data for editing
  useEffect(() => {
    if (part) {
      form.reset({
        modelId: part.modelId,
        name: part.name,
        itemNumber: part.itemNumber || "",
        category: part.category,
        supplier: part.supplier || "",
        manufacturer: part.manufacturer || "",
        cost: part.cost ? parseFloat(part.cost) : undefined,
        installationStatus: part.installationStatus,
        notes: part.notes || "",
        isTamiyaBrand: part.isTamiyaBrand || false,
        productUrl: part.productUrl || "",
        tamiyaBaseUrl: part.tamiyaBaseUrl || "",
        compatibility: part.compatibility || [],
        color: part.color || "",
        material: part.material || "",
      });
    } else {
      form.reset({
        modelId,
        name: "",
        itemNumber: "",
        category: "",
        supplier: "",
        manufacturer: "",
        cost: undefined,
        installationStatus: "planned",
        notes: "",
        isTamiyaBrand: false,
        productUrl: "",
        tamiyaBaseUrl: "",
        compatibility: [],
        color: "",
        material: "",
      });
    }
  }, [part, modelId, form]);

  const createMutation = useMutation({
    mutationFn: (data: FormData) => apiRequest("POST", `/api/models/${modelId}/hop-up-parts`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/models", modelId, "hop-up-parts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/models"] });
      toast({ title: "Part added successfully" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to add part", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => apiRequest("PUT", `/api/hop-up-parts/${part?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/models", modelId, "hop-up-parts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/models"] });
      toast({ title: "Part updated successfully" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to update part", variant: "destructive" });
    },
  });

  const onSubmit = (data: FormData) => {
    if (part) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{part ? "Edit" : "Add"} Hop-Up Part</DialogTitle>
          <DialogDescription>
            {part ? "Update the details of this hop-up part." : "Add a new hop-up part to your model."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* URL Parser - First Section */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Quick Add from Store URL</h4>
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border">
                <FormField
                  control={form.control}
                  name="productUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paste Store URL</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input 
                            placeholder="https://www.rcmart.com/..." 
                            {...field}
                            className="font-mono text-sm"
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="default"
                          onClick={() => {
                            const url = form.getValues('productUrl');
                            if (url) parseProductUrl(url);
                          }}
                          disabled={isParsingUrl || !field.value}
                          className="whitespace-nowrap px-3"
                        >
                          {isParsingUrl ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Parse"
                          )}
                        </Button>
                      </div>
                      <FormDescription className="text-xs">
                        <div className="space-y-1">
                          <div><strong>Parse</strong>: Automatically tries to scrape complete product details from the page, then falls back to URL analysis if blocked</div>
                          <details className="text-xs">
                            <summary className="cursor-pointer hover:text-blue-600">Supported stores & example URLs</summary>
                            <div className="mt-2 space-y-1 pl-4 border-l-2 border-blue-200">
                              <div className="font-mono bg-gray-100 dark:bg-gray-800 p-1 rounded text-xs">
                                https://www.rcmart.com/yeah-racing-aluminum-3-5mm-carbon-fiber-chassis-for-tamiya-ta07-pro-ta07pro-010
                              </div>
                              <div className="font-mono bg-gray-100 dark:bg-gray-800 p-1 rounded text-xs">
                                https://tamiyabase.com/parts/7073-10004432
                              </div>
                              <div className="font-mono bg-gray-100 dark:bg-gray-800 p-1 rounded text-xs">
                                https://www.amainhobbies.com/tamiya-54732-ta07-carbon-damper-stay
                              </div>
                            </div>
                          </details>
                        </div>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Part Details</h4>
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Part Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Carbon Chassis Conversion" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="itemNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 47479" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          value={field.value || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            const numValue = value === "" ? undefined : parseFloat(value);
                            // console.log("Cost field change:", value, "->", numValue); // Remove debug logging
                            field.onChange(numValue);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="supplier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Store/Supplier</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select store" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {suppliers.map((supplier) => (
                            <SelectItem key={supplier} value={supplier}>
                              {supplier}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="manufacturer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manufacturer/Brand</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select brand" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {manufacturers.map((manufacturer) => (
                            <SelectItem key={manufacturer} value={manufacturer}>
                              {manufacturer}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Brand and Links */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Brand & Links</h4>
              
              <FormField
                control={form.control}
                name="isTamiyaBrand"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Official Tamiya Part</FormLabel>
                      <FormDescription>
                        Is this an official Tamiya brand part?
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="productUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Store URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://www.rcmart.com/..." {...field} value={field.value || ""} className="font-mono text-sm" />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Link to product page
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tamiyaBaseUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>TamiyaBase URL</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input placeholder="https://tamiyabase.com/parts/..." {...field} value={field.value || ""} className="font-mono text-sm" />
                        </FormControl>
                        {field.value && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(field.value || "", '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <FormDescription className="text-xs">
                        Official parts database
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>


            </div>

            {/* Specifications */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Specifications</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="material"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Material</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Carbon Fiber, Aluminum" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Red, Blue, Black" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="compatibility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chassis Compatibility</FormLabel>
                    <FormDescription>
                      Select compatible chassis types
                    </FormDescription>
                    <div className="flex flex-wrap gap-2 p-3 border rounded-md">
                      {chassisCompatibility.map((chassis) => {
                        const isSelected = field.value?.includes(chassis);
                        return (
                          <Badge
                            key={chassis}
                            variant={isSelected ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => {
                              const current = field.value || [];
                              if (isSelected) {
                                field.onChange(current.filter(c => c !== chassis));
                              } else {
                                field.onChange([...current, chassis]);
                              }
                            }}
                          >
                            {chassis}
                          </Badge>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Installation */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Installation</h4>
              
              <FormField
                control={form.control}
                name="installationStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Installation Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="planned">Planned</SelectItem>
                        <SelectItem value="installed">Installed</SelectItem>
                        <SelectItem value="removed">Removed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <textarea
                        placeholder="Installation notes, performance improvements, etc."
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {part ? "Update" : "Add"} Part
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}