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
  "Tamiya", "Yeah Racing", "MST", "Xtra Speed", "3Racing",
  "GPM Racing", "Hot Racing", "RC Mart", "AMain Hobbies", "Tower Hobbies",
  "Horizon Hobby", "Other"
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
    try {
      // Auto-detect if this is a TamiyaBase URL and move it to the correct field
      if (url.includes('tamiyabase.com')) {
        form.setValue('tamiyaBaseUrl', url);
        form.setValue('productUrl', '');
        form.setValue('isTamiyaBrand', true);
        toast({ title: "TamiyaBase URL detected and moved to correct field" });
        return;
      }

      // Simple URL parsing for common RC retailers
      const urlLower = url.toLowerCase();
      
      // Detect Tamiya parts from official sources
      if (urlLower.includes('tamiya') || urlLower.includes('47') || urlLower.includes('54')) {
        form.setValue('isTamiyaBrand', true);
        form.setValue('supplier', 'Tamiya');
      }
      
      // Detect suppliers from URL
      if (urlLower.includes('rcmart')) {
        form.setValue('supplier', 'RC Mart');
      } else if (urlLower.includes('amain')) {
        form.setValue('supplier', 'AMain Hobbies');
      } else if (urlLower.includes('tower')) {
        form.setValue('supplier', 'Tower Hobbies');
      }
      
      // Extract potential part numbers from URL
      const partNumberMatch = url.match(/(\d{5,})/);
      if (partNumberMatch && !form.getValues('itemNumber')) {
        form.setValue('itemNumber', partNumberMatch[1]);
      }
      
      // Auto-categorize based on URL keywords
      if (urlLower.includes('motor')) {
        form.setValue('category', 'Motor');
      } else if (urlLower.includes('chassis') || urlLower.includes('frame')) {
        form.setValue('category', 'Chassis');
      } else if (urlLower.includes('damper') || urlLower.includes('shock')) {
        form.setValue('category', 'Suspension');
      } else if (urlLower.includes('wheel') || urlLower.includes('rim')) {
        form.setValue('category', 'Wheels');
      } else if (urlLower.includes('tire') || urlLower.includes('tyre')) {
        form.setValue('category', 'Tires');
      } else if (urlLower.includes('body') || urlLower.includes('shell')) {
        form.setValue('category', 'Body');
      }

      // Detect materials from URL
      if (urlLower.includes('carbon')) {
        form.setValue('material', 'Carbon Fiber');
      } else if (urlLower.includes('aluminum') || urlLower.includes('aluminium')) {
        form.setValue('material', 'Aluminum');
      }

      // Detect chassis compatibility from URL
      const chassisMatch = url.match(/(ta\d+|tb\d+|tt\d+|df\d+|m\d+)/i);
      if (chassisMatch) {
        const chassis = chassisMatch[1].toUpperCase();
        const currentCompat = form.getValues('compatibility') || [];
        if (!currentCompat.includes(chassis)) {
          form.setValue('compatibility', [...currentCompat, chassis]);
        }
      }

      toast({ title: "URL analyzed and fields populated" });
    } catch (error) {
      toast({ title: "Could not parse URL automatically", variant: "destructive" });
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
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Basic Information</h4>
              
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
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
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

                <FormField
                  control={form.control}
                  name="supplier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
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

              <FormField
                control={form.control}
                name="productUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product URL</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input placeholder="https://www.rcmart.com/..." {...field} />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const url = form.getValues('productUrl');
                          if (url) parseProductUrl(url);
                        }}
                        disabled={isParsingUrl || !field.value}
                      >
                        {isParsingUrl ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Parse"
                        )}
                      </Button>
                    </div>
                    <FormDescription>
                      Paste a URL from RC Mart, AMain, etc. and click Parse to auto-fill fields
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
                        <Input placeholder="https://tamiyabase.com/parts/..." {...field} />
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
                    <FormDescription>
                      Link to TamiyaBase part database entry
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
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