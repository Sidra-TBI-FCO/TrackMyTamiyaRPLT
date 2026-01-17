import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Library, Plus, Pencil, Trash2, Search, Package, ExternalLink, Filter, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { HopUpLibraryItem } from "@shared/schema";

const hopUpLibraryFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  itemNumber: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  manufacturer: z.string().optional(),
  isTamiyaBrand: z.boolean().optional(),
  productUrl: z.string().url().optional().or(z.literal("")),
  tamiyaBaseUrl: z.string().url().optional().or(z.literal("")),
  compatibility: z.string().optional(),
  color: z.string().optional(),
  material: z.string().optional(),
  notes: z.string().optional(),
});

type HopUpLibraryFormData = z.infer<typeof hopUpLibraryFormSchema>;

const CATEGORIES = [
  "Suspension",
  "Drivetrain",
  "Steering",
  "Body & Exterior",
  "Wheels & Tires",
  "Electronics",
  "Chassis",
  "Bearings",
  "Screws & Hardware",
  "Decals",
  "Other",
];

function HopUpLibraryDialog({ item, open, onOpenChange }: { item?: HopUpLibraryItem; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const form = useForm<HopUpLibraryFormData>({
    resolver: zodResolver(hopUpLibraryFormSchema),
    defaultValues: {
      name: item?.name || "",
      itemNumber: item?.itemNumber || "",
      category: item?.category || "",
      manufacturer: item?.manufacturer || "",
      isTamiyaBrand: item?.isTamiyaBrand || false,
      productUrl: item?.productUrl || "",
      tamiyaBaseUrl: item?.tamiyaBaseUrl || "",
      compatibility: item?.compatibility?.join(", ") || "",
      color: item?.color || "",
      material: item?.material || "",
      notes: item?.notes || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: HopUpLibraryFormData) => {
      const payload = {
        ...data,
        compatibility: data.compatibility ? data.compatibility.split(",").map(s => s.trim()).filter(Boolean) : [],
        productUrl: data.productUrl || null,
        tamiyaBaseUrl: data.tamiyaBaseUrl || null,
      };
      return apiRequest("POST", "/api/hop-up-library", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hop-up-library"] });
      toast({ title: "Item added to library" });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: HopUpLibraryFormData) => {
      const payload = {
        ...data,
        compatibility: data.compatibility ? data.compatibility.split(",").map(s => s.trim()).filter(Boolean) : [],
        productUrl: data.productUrl || null,
        tamiyaBaseUrl: data.tamiyaBaseUrl || null,
      };
      return apiRequest("PUT", `/api/hop-up-library/${item?.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hop-up-library"] });
      toast({ title: "Item updated" });
      onOpenChange(false);
    },
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const onSubmit = (data: HopUpLibraryFormData) => {
    if (item) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono">{item ? "Edit Library Item" : "Add to Library"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Name *</FormLabel><FormControl><Input {...field} placeholder="e.g., Aluminum Shock Dampers" /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="itemNumber" render={({ field }) => (
                <FormItem><FormLabel>Item Number</FormLabel><FormControl><Input {...field} placeholder="e.g., 54000" /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="manufacturer" render={({ field }) => (
                <FormItem><FormLabel>Manufacturer</FormLabel><FormControl><Input {...field} placeholder="e.g., Tamiya" /></FormControl></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem><FormLabel>Category *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select category..." /></SelectTrigger></FormControl>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="isTamiyaBrand" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <FormLabel>Tamiya Brand</FormLabel>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="color" render={({ field }) => (
                <FormItem><FormLabel>Color</FormLabel><FormControl><Input {...field} placeholder="e.g., Red" /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="material" render={({ field }) => (
                <FormItem><FormLabel>Material</FormLabel><FormControl><Input {...field} placeholder="e.g., Aluminum" /></FormControl></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="compatibility" render={({ field }) => (
              <FormItem><FormLabel>Compatible Models</FormLabel><FormControl><Input {...field} placeholder="e.g., TA-05, TT-02, XV-01 (comma separated)" /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="productUrl" render={({ field }) => (
              <FormItem><FormLabel>Product URL</FormLabel><FormControl><Input {...field} placeholder="https://..." /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="tamiyaBaseUrl" render={({ field }) => (
              <FormItem><FormLabel>TamiyaBase URL</FormLabel><FormControl><Input {...field} placeholder="https://tamiyabase.com/..." /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea {...field} placeholder="Additional notes..." /></FormControl></FormItem>
            )} />
            <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
              {item ? "Update Item" : "Add to Library"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function HopUpLibraryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterBrand, setFilterBrand] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HopUpLibraryItem | undefined>();

  const { toast } = useToast();

  const { data: items = [], isLoading } = useQuery<HopUpLibraryItem[]>({ queryKey: ["/api/hop-up-library"] });

  const deleteItem = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/hop-up-library/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hop-up-library"] });
      toast({ title: "Item deleted from library" });
    },
  });

  const categories = Array.from(new Set(items.map(item => item.category).filter(Boolean)));

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.itemNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
                         (item.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesCategory = filterCategory === "all" || item.category === filterCategory;
    const matchesBrand = filterBrand === "all" || 
                        (filterBrand === "tamiya" && item.isTamiyaBrand) ||
                        (filterBrand === "aftermarket" && !item.isTamiyaBrand);
    return matchesSearch && matchesCategory && matchesBrand;
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4 overflow-x-hidden space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-mono font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Library className="h-6 w-6" />
              Hop-Up Library
            </h1>
            <p className="text-gray-600 dark:text-gray-400 font-mono">
              Your personal catalog of hop-up parts to reuse across models
            </p>
          </div>
          <Button onClick={() => { setEditingItem(undefined); setDialogOpen(true); }} className="font-mono">
            <Plus className="h-4 w-4 mr-2" />Add Part
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-2xl font-mono font-bold">{items.length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">Library Items</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">Tamiya</Badge>
                <div>
                  <p className="text-2xl font-mono font-bold">{items.filter(i => i.isTamiyaBrand).length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">Tamiya Parts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Badge variant="outline">Aftermarket</Badge>
                <div>
                  <p className="text-2xl font-mono font-bold">{items.filter(i => !i.isTamiyaBrand).length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">Aftermarket Parts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-mono text-lg flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search parts, manufacturers, item numbers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 font-mono"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterBrand} onValueChange={setFilterBrand}>
              <SelectTrigger>
                <SelectValue placeholder="Brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                <SelectItem value="tamiya">Tamiya</SelectItem>
                <SelectItem value="aftermarket">Aftermarket</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setFilterCategory("all");
                setFilterBrand("all");
              }}
              className="font-mono"
            >
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Library className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 dark:text-gray-400 font-mono">
              {items.length === 0 
                ? "Your hop-up library is empty. Add parts to build your catalog!" 
                : "No parts match your search criteria."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <Card key={item.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="font-mono text-lg">{item.name}</CardTitle>
                    {item.itemNumber && (
                      <p className="text-sm text-gray-500 font-mono">#{item.itemNumber}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingItem(item); setDialogOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete this item from library?")) deleteItem.mutate(item.id); }}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {item.manufacturer && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{item.manufacturer}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{item.category}</Badge>
                  {item.isTamiyaBrand ? (
                    <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Tamiya</Badge>
                  ) : (
                    <Badge variant="outline">Aftermarket</Badge>
                  )}
                  {item.material && <Badge variant="outline">{item.material}</Badge>}
                  {item.color && <Badge variant="outline">{item.color}</Badge>}
                </div>
                {item.compatibility && item.compatibility.length > 0 && (
                  <div className="text-xs text-gray-500">
                    Compatible with: {item.compatibility.join(", ")}
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  {item.productUrl && (
                    <a href={item.productUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="font-mono text-xs">
                        <ExternalLink className="h-3 w-3 mr-1" />Product
                      </Button>
                    </a>
                  )}
                  {item.tamiyaBaseUrl && (
                    <a href={item.tamiyaBaseUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="font-mono text-xs">
                        <ExternalLink className="h-3 w-3 mr-1" />TamiyaBase
                      </Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <HopUpLibraryDialog key={editingItem?.id ?? 'new-item'} item={editingItem} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
