import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import HopUpCard from "./hop-up-card";
import HopUpPartDialog from "./hop-up-part-dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { HopUpPart, Model } from "@shared/schema";

type HopUpPartWithModel = HopUpPart & {
  model: Pick<Model, 'id' | 'name'>;
};

export default function HopUpPartsList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedModel, setSelectedModel] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all hop-up parts
  const { data: hopUpParts, isLoading: isLoadingParts } = useQuery<HopUpPartWithModel[]>({
    queryKey: ['/api/hop-up-parts'],
  });

  // Fetch models for filtering
  const { data: models, isLoading: isLoadingModels } = useQuery({
    queryKey: ['/api/models'],
  });

  // Delete mutation
  const deletePartMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/hop-up-parts/${id}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hop-up-parts'] });
      toast({ title: "Success", description: "Hop-up part deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete hop-up part", variant: "destructive" });
    },
  });

  // Filter parts based on search and filters
  const filteredParts = hopUpParts?.filter(part => {
    const matchesSearch = !searchQuery || 
      part.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.itemNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === "all" || part.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || part.installationStatus === statusFilter;
    const matchesModel = selectedModel === "all" || part.modelId.toString() === selectedModel;

    return matchesSearch && matchesCategory && matchesStatus && matchesModel;
  }) || [];

  // Get unique categories for filter
  const categories = [...new Set(hopUpParts?.map(part => part.category) || [])];

  if (isLoadingParts || isLoadingModels) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Mobile Search Bar */}
      <div className="mb-6 lg:hidden">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search hop-up parts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 font-mono text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          />
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-mono font-bold text-gray-900 dark:text-white">
            Hop-Up Parts
          </h1>
          <p className="text-gray-600 dark:text-gray-400 font-mono">
            Track your performance upgrades and modifications
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <HopUpPartDialog
            trigger={
              <Button className="bg-red-600 hover:bg-red-700 text-white font-mono">
                <Plus className="mr-2 h-4 w-4" />
                Add Part
              </Button>
            }
          />
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="font-mono text-lg flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="text-sm font-mono font-medium mb-2 block">Search</label>
              <div className="relative hidden lg:block">
                <Input
                  type="text"
                  placeholder="Search parts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 font-mono"
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-mono font-medium mb-2 block">Model</label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="font-mono">
                  <SelectValue placeholder="All models" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Models</SelectItem>
                  {models?.map((model: any) => (
                    <SelectItem key={model.id} value={model.id.toString()}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-mono font-medium mb-2 block">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="font-mono">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-mono font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="font-mono">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="installed">Installed</SelectItem>
                  <SelectItem value="removed">Removed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="text-2xl font-mono font-bold text-gray-900 dark:text-white">
                {hopUpParts?.length || 0}
              </div>
              <div className="ml-2 text-sm font-mono text-gray-500 dark:text-gray-400">
                Total Parts
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="text-2xl font-mono font-bold text-green-600 dark:text-green-400">
                {hopUpParts?.filter(p => p.installationStatus === 'installed').length || 0}
              </div>
              <div className="ml-2 text-sm font-mono text-gray-500 dark:text-gray-400">
                Installed
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400">
                {hopUpParts?.filter(p => p.installationStatus === 'planned').length || 0}
              </div>
              <div className="ml-2 text-sm font-mono text-gray-500 dark:text-gray-400">
                Planned
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Parts Grid */}
      {filteredParts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredParts.map(part => (
            <HopUpCard
              key={part.id}
              part={part}
              onEdit={(part) => {
                // Edit functionality will be handled by the dialog
              }}
              onDelete={(id) => deletePartMutation.mutate(id)}
            />
          ))}
        </div>
      ) : (
        <Card className="p-12">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-4">🔧</div>
            <h3 className="text-lg font-mono font-semibold mb-2">No hop-up parts found</h3>
            <p className="font-mono mb-4">
              {searchQuery || categoryFilter !== "all" || statusFilter !== "all" || selectedModel !== "all"
                ? "Try adjusting your filters or search terms"
                : "Start building your parts collection by adding your first hop-up part"
              }
            </p>
            {!hopUpParts?.length && (
              <HopUpPartDialog
                trigger={
                  <Button className="bg-red-600 hover:bg-red-700 text-white font-mono">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Part
                  </Button>
                }
              />
            )}
          </div>
        </Card>
      )}
    </div>
  );
}