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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      modelId,
      name: "",
      itemNumber: "",
      category: "Other",
      supplier: "",
      cost: 0,
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

  // Load part data for editing
  useEffect(() => {
    if (part) {
      form.reset({
        modelId: part.modelId,
        name: part.name,
        itemNumber: part.itemNumber || "",
        category: part.category,
        supplier: part.supplier || "",
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
        category: "Other",
        supplier: "",
        cost: 0,
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

  const parseProductUrl = async (url: string) => {
    setIsParsingUrl(true);
    
    const parseLog: string[] = ["🔍 Starting URL analysis..."];
    
    try {
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
        
        toast({ 
          title: "TamiyaBase URL Processed",
          description: parseLog.join('\n')
        });
        return;
      }

      // Detect store/supplier from URL domain
      if (urlLower.includes('rcmart')) {
        form.setValue('supplier', 'RC Mart');
        parseLog.push("✅ Store detected: RC Mart");
      } else if (urlLower.includes('amain')) {
        form.setValue('supplier', 'AMain Hobbies');
        parseLog.push("✅ Store detected: AMain Hobbies");
      } else if (urlLower.includes('tower')) {
        form.setValue('supplier', 'Tower Hobbies');
        parseLog.push("✅ Store detected: Tower Hobbies");
      } else if (urlLower.includes('horizonhobby')) {
        form.setValue('supplier', 'Horizon Hobby');
        parseLog.push("✅ Store detected: Horizon Hobby");
      } else if (urlLower.includes('tamiyabase')) {
        form.setValue('supplier', 'TamiyaBase');
        parseLog.push("✅ Store detected: TamiyaBase");
      } else {
        parseLog.push("⚠️ Store not auto-detected");
      }

      // Detect brand/manufacturer from URL path
      const brandPatterns = [
        { pattern: /xtra-speed/i, brand: 'Xtra Speed', code: 'XS' },
        { pattern: /yeah-racing/i, brand: 'Yeah Racing', code: 'YR' },
        { pattern: /gpm-racing/i, brand: 'GPM Racing', code: 'GPM' },
        { pattern: /hot-racing/i, brand: 'Hot Racing', code: 'HR' },
        { pattern: /3racing/i, brand: '3Racing', code: '3R' },
        { pattern: /mst/i, brand: 'MST', code: 'MST' },
      ];

      let detectedBrand = null;
      for (const { pattern, brand, code } of brandPatterns) {
        if (pattern.test(url)) {
          form.setValue('manufacturer', brand);
          detectedBrand = { brand, code };
          parseLog.push(`✅ Manufacturer detected: ${brand}`);
          break;
        }
      }

      // Only detect Tamiya if no other brand was found and it's actually a Tamiya part
      if (!detectedBrand && (urlLower.includes('tamiya-47') || urlLower.includes('tamiya-54') || urlLower.includes('/tamiya/47') || urlLower.includes('/tamiya/54'))) {
        form.setValue('isTamiyaBrand', true);
        form.setValue('manufacturer', 'Tamiya');
        parseLog.push("✅ Official Tamiya part detected");
      } else if (detectedBrand) {
        form.setValue('isTamiyaBrand', false);
        parseLog.push("✅ Marked as aftermarket part");
      }
      
      // Extract part numbers - look for brand-specific patterns first
      let partNumberFound = false;
      
      if (detectedBrand) {
        // Look for brand-specific part number patterns
        const brandPartPatterns = [
          new RegExp(`${detectedBrand.code.toLowerCase()}-([a-z0-9]+)`, 'i'), // XS-TA29181RD
          new RegExp(`${detectedBrand.code.toLowerCase()}([a-z0-9]+)`, 'i'),  // XSTA29181RD
        ];
        
        for (const pattern of brandPartPatterns) {
          const match = url.match(pattern);
          if (match) {
            const fullPartNumber = `${detectedBrand.code}-${match[1].toUpperCase()}`;
            form.setValue('itemNumber', fullPartNumber);
            parseLog.push(`✅ Brand part number extracted: ${fullPartNumber}`);
            partNumberFound = true;
            break;
          }
        }
      }
      
      // Fallback to generic 5+ digit pattern if no brand-specific number found
      if (!partNumberFound) {
        const partNumberMatches = url.match(/(\d{5,})/g);
        if (partNumberMatches && !form.getValues('itemNumber')) {
          const partNumber = partNumberMatches[0];
          form.setValue('itemNumber', partNumber);
          parseLog.push(`✅ Generic part number extracted: ${partNumber}`);
        } else {
          parseLog.push("⚠️ No part number found in URL");
        }
      }
      
      // Extract part name from URL path - improved logic
      const pathParts = url.split('/').pop()?.split('-') || [];
      if (pathParts.length > 2) {
        // Remove brand name, model numbers, and store-specific codes
        const filteredParts = pathParts
          .filter(part => 
            !part.match(/^\d+$/) && // Remove pure numbers
            part.length > 1 && // Remove single characters
            !part.match(/^(xs|yr|gpm|hr|3r|mst)$/i) && // Remove brand codes
            !part.match(/^(ta|tb|tt|df|m|tc|xv)\d+/i) && // Remove chassis codes
            !part.match(/^\d{8,}$/) // Remove long product codes
          );
          
        // Take meaningful parts and clean them up
        const meaningfulParts = filteredParts.slice(0, 8); // Limit length
        const potentialName = meaningfulParts
          .join(' ')
          .replace(/[^a-zA-Z0-9\s]/g, ' ')
          .replace(/\s+/g, ' ')
          .replace(/\b(for|tamiya|w|with)\b/gi, '') // Remove common filler words
          .trim();
        
        if (potentialName && !form.getValues('name')) {
          const cleanName = potentialName.charAt(0).toUpperCase() + potentialName.slice(1);
          form.setValue('name', cleanName);
          parseLog.push(`✅ Part name extracted: ${cleanName}`);
        }
      }

      // Auto-categorize based on URL keywords - more specific patterns
      const categoryKeywords = {
        'Suspension': ['damper', 'shock', 'spring', 'suspension', 'steering-set', 'steering-linkage'],
        'Drivetrain': ['gear', 'differential', 'driveshaft', 'belt', 'bearing', 'steering-set'],
        'Chassis': ['main-frame', 'chassis-conversion', 'chassis-plate'],
        'Motor': ['motor', 'brushless', 'brushed'],
        'Wheels': ['wheel', 'rim', 'hub'],
        'Tires': ['tire', 'tyre', 'rubber'],
        'Body': ['body', 'shell', 'lexan'],
        'Electronics': ['esc', 'servo', 'receiver', 'transmitter'],
        'Tools': ['tool', 'wrench', 'hex', 'driver']
      };

      let categoryFound = false;
      // Check for specific part types first
      if (urlLower.includes('steering')) {
        form.setValue('category', 'Suspension');
        parseLog.push("✅ Category detected: Suspension (steering component)");
        categoryFound = true;
      } else if (urlLower.includes('drive-shaft') || urlLower.includes('driveshaft')) {
        form.setValue('category', 'Drivetrain');
        parseLog.push("✅ Category detected: Drivetrain (drive shaft)");
        categoryFound = true;
      } else {
        for (const [category, keywords] of Object.entries(categoryKeywords)) {
          if (keywords.some(keyword => urlLower.includes(keyword))) {
            form.setValue('category', category);
            parseLog.push(`✅ Category detected: ${category}`);
            categoryFound = true;
            break;
          }
        }
      }
      if (!categoryFound) {
        parseLog.push("⚠️ Category not auto-detected - leave blank for manual selection");
      }

      // Detect materials from URL - prioritize the actual part material over context
      const materialKeywords = {
        'Aluminum': ['aluminum-', 'aluminium-', '-aluminum', '-aluminium'], // More specific patterns
        'Carbon Fiber': ['carbon-fiber', '-carbon-', 'cf-'],
        'Steel': ['steel-', '-steel', 'hardened-steel'],
        'Plastic': ['plastic-', '-plastic', 'abs-'],
        'Titanium': ['titanium-', '-titanium', 'ti-']
      };

      let materialFound = false;
      for (const [material, keywords] of Object.entries(materialKeywords)) {
        if (keywords.some(keyword => urlLower.includes(keyword))) {
          form.setValue('material', material);
          parseLog.push(`✅ Material detected: ${material}`);
          materialFound = true;
          break;
        }
      }
      
      // Special case: if we see "carbon chassis" but the part itself is aluminum
      if (!materialFound && urlLower.includes('aluminum')) {
        form.setValue('material', 'Aluminum');
        parseLog.push("✅ Material detected: Aluminum (from part description)");
        materialFound = true;
      }
      
      if (!materialFound) {
        parseLog.push("⚠️ Material not auto-detected");
      }

      // Detect chassis compatibility from URL
      const chassisPatterns = [
        /(ta0?\d+)/i, /(tb0?\d+)/i, /(tt0?\d+)/i, /(df0?\d+)/i, 
        /(m0?\d+)/i, /(tc0?\d+)/i, /(xv0?\d+)/i
      ];
      
      let chassisFound = false;
      for (const pattern of chassisPatterns) {
        const chassisMatch = url.match(pattern);
        if (chassisMatch) {
          const chassis = chassisMatch[1].toUpperCase();
          const currentCompat = form.getValues('compatibility') || [];
          if (!currentCompat.includes(chassis)) {
            form.setValue('compatibility', [...currentCompat, chassis]);
            parseLog.push(`✅ Chassis compatibility detected: ${chassis}`);
            chassisFound = true;
          }
        }
      }
      if (!chassisFound) {
        parseLog.push("⚠️ Chassis compatibility not auto-detected");
      }

      // Color detection
      const colorKeywords = ['red', 'blue', 'black', 'white', 'silver', 'gold', 'green', 'orange', 'purple'];
      const colorFound = colorKeywords.find(color => urlLower.includes(color));
      if (colorFound) {
        form.setValue('color', colorFound.charAt(0).toUpperCase() + colorFound.slice(1));
        parseLog.push(`✅ Color detected: ${colorFound}`);
      } else {
        parseLog.push("⚠️ Color not auto-detected");
      }

      parseLog.push("✅ URL analysis complete!");
      
      console.log("URL Parse Debug Log:", parseLog);
      
      toast({ 
        title: "URL Analysis Complete",
        description: `Found ${parseLog.filter(log => log.includes('✅')).length - 1} details. Check console for full log.`
      });
      
    } catch (error) {
      parseLog.push(`❌ Error: ${error}`);
      console.error("URL Parse Error:", parseLog);
      toast({ title: "URL parsing failed", description: "Check console for details", variant: "destructive" });
    } finally {
      setIsParsingUrl(false);
    }
  };

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
                          className="whitespace-nowrap"
                        >
                          {isParsingUrl ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Auto-Fill"
                          )}
                        </Button>
                      </div>
                      <FormDescription className="text-xs">
                        <div className="space-y-1">
                          <div>Supported stores: RC Mart, AMain Hobbies, Tower Hobbies, TamiyaBase</div>
                          <details className="text-xs">
                            <summary className="cursor-pointer hover:text-blue-600">Click for example URLs to test</summary>
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
                        <Input placeholder="e.g., 47479" {...field} />
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
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                      <Select onValueChange={field.onChange} value={field.value}>
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
                      <Select onValueChange={field.onChange} value={field.value}>
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
                        checked={field.value}
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
                        <Input placeholder="https://www.rcmart.com/..." {...field} className="font-mono text-sm" />
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
                          <Input placeholder="https://tamiyabase.com/parts/..." {...field} className="font-mono text-sm" />
                        </FormControl>
                        {field.value && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(field.value, '_blank')}
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
                        <Input placeholder="e.g., Carbon Fiber, Aluminum" {...field} />
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
                        <Input placeholder="e.g., Red, Blue, Black" {...field} />
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