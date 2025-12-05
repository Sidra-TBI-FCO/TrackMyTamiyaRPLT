import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import HopUpPartDialog from "./hop-up-part-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, ExternalLink, CheckCircle2, Clock, X, Filter, Edit, Trash2 } from "lucide-react";
import { SiTamiya, SiAmazon, SiEbay } from "react-icons/si";
import type { HopUpPartWithPhoto } from "@shared/schema";

interface HopUpPartsListProps {
  modelId: number;
}

export default function HopUpPartsList({ modelId }: HopUpPartsListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<HopUpPartWithPhoto | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterBrand, setFilterBrand] = useState("all");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: parts = [], isLoading } = useQuery({
    queryKey: ["/api/models", modelId, "hop-up-parts"],
    queryFn: async (): Promise<HopUpPartWithPhoto[]> => {
      const response = await fetch(`/api/models/${modelId}/hop-up-parts`);
      if (!response.ok) throw new Error("Failed to fetch hop-up-parts");
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (partId: number) => apiRequest("DELETE", `/api/hop-up-parts/${partId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/models", modelId, "hop-up-parts"] });
      toast({ title: "Part deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete part", variant: "destructive" });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ partId, newStatus }: { partId: number; newStatus: string }) => 
      apiRequest("PUT", `/api/hop-up-parts/${partId}`, { 
        installationStatus: newStatus,
        installationDate: newStatus === "installed" ? new Date().toISOString() : null
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/models", modelId, "hop-up-parts"] });
      toast({ title: "Installation status updated" });
    },
    onError: () => {
      toast({ title: "Failed to update status", variant: "destructive" });
    },
  });

  // Filter parts based on search and filters
  const filteredParts = parts.filter(part => {
    const matchesSearch = part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         part.itemNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         part.supplier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         part.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || part.category === filterCategory;
    const matchesStatus = filterStatus === "all" || part.installationStatus === filterStatus;
    const matchesBrand = filterBrand === "all" || 
                        (filterBrand === "tamiya" && part.isTamiyaBrand) ||
                        (filterBrand === "aftermarket" && !part.isTamiyaBrand);
    
    return matchesSearch && matchesCategory && matchesStatus && matchesBrand;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "installed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "planned":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "removed":
        return <X className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "installed":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "planned":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "removed":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const categories = Array.from(new Set(parts.map(p => p.category)));
  const totalInvestment = parts.reduce((sum, part) => 
    sum + (part.installationStatus === "installed" ? parseFloat(part.cost || "0") : 0), 0
  );

  if (isLoading) {
    return <div className="p-6">Loading hop-up parts...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Hop-Up Parts ({filteredParts.length})</h3>
          <p className="text-sm text-muted-foreground">
            Total Investment: ${totalInvestment.toFixed(2)} | 
            Installed: {parts.filter(p => p.installationStatus === "installed").length} | 
            Planned: {parts.filter(p => p.installationStatus === "planned").length}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => {
            setEditingPart(null);
            setDialogOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Part
          </Button>
          

        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search parts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={filterBrand} onValueChange={setFilterBrand}>
          <SelectTrigger className="sm:w-32">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            <SelectItem value="tamiya">Tamiya</SelectItem>
            <SelectItem value="aftermarket">Aftermarket</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="sm:w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="sm:w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="planned">Planned</SelectItem>
            <SelectItem value="installed">Installed</SelectItem>
            <SelectItem value="removed">Removed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Parts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredParts.map((part) => (
          <Card key={part.id} className="relative h-full">
            <CardContent className="p-4">
              <div className="flex gap-3">
                {/* Left side - Details */}
                <div className="flex-1 min-w-0 flex flex-col">
                  {/* Header */}
                  <CardTitle className="text-sm leading-tight mb-1">
                    {part.name}
                  </CardTitle>
                  {part.itemNumber && (
                    <CardDescription className="text-xs mb-2">#{part.itemNumber}</CardDescription>
                  )}

                  {/* Details */}
                  <div className="flex-1 space-y-2">
                    <div className="space-y-1">
                      <div className="text-sm font-medium">{part.category}</div>
                      {part.manufacturer && (
                        <div className="text-sm text-muted-foreground">by {part.manufacturer}</div>
                      )}
                      {part.supplier && (
                        <div className="text-xs text-muted-foreground">from {part.supplier}</div>
                      )}
                      {part.cost && (
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-green-600">
                            ${parseFloat(part.cost).toFixed(2)} each
                            {part.quantity && part.quantity > 1 && (
                              <span className="text-xs ml-1">× {part.quantity}</span>
                            )}
                          </div>
                          {part.quantity && part.quantity > 1 && (
                            <div className="text-sm font-semibold text-green-700">
                              Total: ${(parseFloat(part.cost) * part.quantity).toFixed(2)}
                            </div>
                          )}
                        </div>
                      )}
                      {part.material && (
                        <div className="text-xs text-muted-foreground">Material: {part.material}</div>
                      )}
                      {part.color && (
                        <div className="text-xs text-muted-foreground">Color: {part.color}</div>
                      )}
                    </div>

                    {part.compatibility && part.compatibility.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {part.compatibility.map((chassis) => (
                          <Badge key={chassis} variant="secondary" className="text-xs">
                            {chassis}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {part.installationDate && (
                      <div className="text-xs text-muted-foreground">
                        Installed: {new Date(part.installationDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side - Badges and Photo */}
                <div className="flex-shrink-0 flex flex-col items-end gap-2">
                  {/* Badges at top */}
                  <div className="flex flex-col items-end gap-1">
                    <Badge className={`${getStatusColor(part.installationStatus)} flex items-center gap-1 text-xs`}>
                      {getStatusIcon(part.installationStatus)}
                      {part.installationStatus}
                    </Badge>
                    {part.isTamiyaBrand && (
                      <Badge variant="outline" className="text-xs text-red-600 dark:text-red-400 bg-white dark:bg-gray-800 border-red-600 dark:border-red-400">
                        TAMIYA
                      </Badge>
                    )}
                  </div>

                  {/* Photo below badges */}
                  {part.photo ? (
                    <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                      <img
                        src={part.photo.url}
                        alt={part.name}
                        className="w-full h-full object-contain p-1"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                      <span className="text-gray-400 dark:text-gray-600 text-xs">No image</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Button row - always at bottom */}
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-1 h-8">
                      {/* Only show Mark Installed for planned parts */}
                      {part.installationStatus === "planned" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleStatusMutation.mutate({ partId: part.id, newStatus: "installed" });
                          }}
                          disabled={toggleStatusMutation.isPending}
                          className="h-8 w-8 p-0 flex items-center justify-center"
                          title="Mark as Installed"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setEditingPart(part);
                          setDialogOpen(true);
                        }}
                        className="h-8 w-8 p-0 flex items-center justify-center"
                        title="Edit Part"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          deleteMutation.mutate(part.id);
                        }}
                        disabled={deleteMutation.isPending}
                        className="h-8 w-8 p-0 flex items-center justify-center text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Delete Part"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Store links with logos */}
                    <div className="flex items-center gap-1 h-8">
                      {part.tamiyaBaseUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (part.tamiyaBaseUrl) window.open(part.tamiyaBaseUrl, '_blank');
                          }}
                          className="h-8 w-8 p-0 flex items-center justify-center"
                          title="View on TamiyaBase"
                        >
                          <SiTamiya className="h-4 w-4" />
                        </Button>
                      )}
                      {part.productUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (part.productUrl) window.open(part.productUrl, '_blank');
                          }}
                          className="h-8 w-8 p-0 flex items-center justify-center"
                          title="View on Store"
                        >
                          {part.productUrl && part.productUrl.includes('amazon') ? (
                            <SiAmazon className="h-4 w-4" />
                          ) : part.productUrl && part.productUrl.includes('ebay') ? (
                            <SiEbay className="h-4 w-4" />
                          ) : (
                            <ExternalLink className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredParts.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground">No hop-up parts found</div>
          <Button
            onClick={() => {
              setEditingPart(null);
              setDialogOpen(true);
            }}
            className="mt-4"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Part
          </Button>
        </div>
      )}

      <HopUpPartDialog
        modelId={modelId}
        part={editingPart}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}