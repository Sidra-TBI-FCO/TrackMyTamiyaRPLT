import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { LayoutGrid, List, Filter } from "lucide-react";
import { ModelWithRelations } from "@/types";
import ModelCard from "@/components/models/model-card";
import AddModelDialog from "@/components/models/add-model-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export default function Models() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: models, isLoading } = useQuery<ModelWithRelations[]>({
    queryKey: ["/api/models"],
  });

  const handleAddPhoto = (modelId: number) => {
    console.log(`Adding photo to model ${modelId}`);
  };

  const filteredModels = models?.filter((model) => {
    if (filterStatus === "all") return true;
    return model.buildStatus === filterStatus;
  }) || [];

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-32" />
          <div className="flex items-center space-x-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-mono font-bold text-gray-900 dark:text-white mb-4 sm:mb-0">
          My Collection ({filteredModels.length})
        </h1>
        
        <div className="flex items-center space-x-4">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40 font-mono">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Models</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="building">Building</SelectItem>
              <SelectItem value="built">Built</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-r-none"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Models Grid/List */}
      {filteredModels.length > 0 ? (
        <div className={`grid gap-6 ${
          viewMode === "grid" 
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
            : "grid-cols-1"
        }`}>
          {filteredModels.map((model) => (
            <ModelCard
              key={model.id}
              model={model}
              onAddPhoto={handleAddPhoto}
            />
          ))}
          
          {/* Add New Model Card */}
          <Card className="bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors">
            <CardContent className="flex items-center justify-center h-80 p-6">
              <AddModelDialog
                trigger={
                  <div className="text-center cursor-pointer">
                    <div className="text-4xl mb-4 text-gray-400 dark:text-gray-500">➕</div>
                    <p className="font-mono font-semibold text-gray-600 dark:text-gray-300">
                      Add New Model
                    </p>
                    <p className="text-sm font-mono text-gray-500 dark:text-gray-400 mt-1">
                      Enter Tamiya item number
                    </p>
                  </div>
                }
              />
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="p-12">
          <div className="text-center">
            <div className="text-gray-400 dark:text-gray-500 mb-6">
              <Filter className="h-16 w-16 mx-auto mb-4" />
              <h2 className="text-xl font-mono font-semibold text-gray-900 dark:text-white mb-2">
                {filterStatus === "all" ? "No models yet" : `No ${filterStatus} models`}
              </h2>
              <p className="font-mono text-gray-500 dark:text-gray-400">
                {filterStatus === "all" 
                  ? "Add your first Tamiya model to get started" 
                  : `You don't have any models with status: ${filterStatus}`
                }
              </p>
            </div>
            {filterStatus === "all" && <AddModelDialog />}
          </div>
        </Card>
      )}
    </div>
  );
}
