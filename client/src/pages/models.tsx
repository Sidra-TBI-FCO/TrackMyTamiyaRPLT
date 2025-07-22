import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { LayoutGrid, List, Filter, Tag, Search, Play } from "lucide-react";
import { ModelWithRelations } from "@/types";
import ModelCard from "@/components/models/model-card";
import AddModelDialog from "@/components/models/add-model-dialog";
import AddModelDialogDesktop from "@/components/models/add-model-dialog-desktop";
import PhotoSlideshow from "@/components/photos/photo-slideshow";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  const [filterTag, setFilterTag] = useState<string>("all");
  const [isAddModelOpen, setIsAddModelOpen] = useState(false);
  const [isSlideshowOpen, setIsSlideshowOpen] = useState(false);

  const { data: models, isLoading } = useQuery<ModelWithRelations[]>({
    queryKey: ["/api/models"],
  });

  const handleAddPhoto = (modelId: number) => {
    console.log(`Adding photo to model ${modelId}`);
  };

  // Get all unique tags from models for filtering
  const allTags = Array.from(
    new Set(
      models?.flatMap(model => model.tags || []) || []
    )
  ).sort();

  const filteredModels = models?.filter((model) => {
    const statusMatch = filterStatus === "all" || model.buildStatus === filterStatus;
    const tagMatch = filterTag === "all" || (model.tags && model.tags.includes(filterTag));
    return statusMatch && tagMatch;
  }) || [];

  if (isLoading) {
    return (
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4 overflow-x-hidden">
        <div className="lg:flex lg:gap-8">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block lg:w-80 lg:flex-shrink-0">
            <Card className="mb-4">
              <CardContent className="p-4">
                <Skeleton className="h-6 w-24 mb-3" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-4">
              <Skeleton className="h-8 w-32" />
              <div className="flex items-center space-x-4">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-20" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
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
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4 overflow-x-hidden">
      {/* Mobile Search Bar */}
      <div className="mb-6 lg:hidden">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search models, parts, builds..."
            className="w-full pl-10 pr-4 py-3 font-mono text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          />
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
        </div>
      </div>

      <div className="lg:flex lg:gap-8">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block lg:w-80 lg:flex-shrink-0">
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-mono">Collection Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="font-mono text-sm">Total Models:</span>
                <span className="font-mono font-semibold">{models?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono text-sm">Planning:</span>
                <span className="font-mono text-blue-600 dark:text-blue-400">
                  {models?.filter(m => m.buildStatus === 'planning').length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono text-sm">Building:</span>
                <span className="font-mono text-yellow-600 dark:text-yellow-400">
                  {models?.filter(m => m.buildStatus === 'building').length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono text-sm">Built:</span>
                <span className="font-mono text-green-600 dark:text-green-400">
                  {models?.filter(m => m.buildStatus === 'built').length || 0}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-mono">Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="font-mono text-sm font-medium mb-2 block">Status</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="building">Building</SelectItem>
                    <SelectItem value="built">Built</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="font-mono text-sm font-medium mb-2 block">Tags</label>
                <Select value={filterTag} onValueChange={setFilterTag}>
                  <SelectTrigger className="font-mono">
                    <SelectValue placeholder="All Tags" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tags</SelectItem>
                    {allTags.map((tag) => (
                      <SelectItem key={tag} value={tag}>
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="font-mono text-sm font-medium mb-2 block">View Mode</label>
                <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="rounded-r-none flex-1"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="rounded-l-none flex-1"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Mobile Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 lg:hidden">
            <h1 className="text-2xl font-mono font-bold text-gray-900 dark:text-white mb-4 sm:mb-0">
              My Collection ({filteredModels.length})
            </h1>
            
            <div className="flex flex-wrap items-center gap-4">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40 font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="building">Building</SelectItem>
                  <SelectItem value="built">Built</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterTag} onValueChange={setFilterTag}>
                <SelectTrigger className="w-40 font-mono">
                  <Tag className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Tags" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tags</SelectItem>
                  {allTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
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

          {/* Desktop Header */}
          <div className="hidden lg:flex lg:items-center lg:justify-between mb-4">
            <h1 className="text-2xl font-mono font-bold text-gray-900 dark:text-white">
              My Collection ({filteredModels.length})
            </h1>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setIsSlideshowOpen(true)}
                variant="outline"
                size="sm"
                className="font-mono"
              >
                <Play className="h-4 w-4 mr-2" />
                Slideshow
              </Button>
              <AddModelDialogDesktop />
            </div>
          </div>

          {/* Active Filters Display */}
          {(filterStatus !== "all" || filterTag !== "all") && (
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="text-sm font-mono text-gray-600 dark:text-gray-400">Active filters:</span>
              {filterStatus !== "all" && (
                <Badge variant="secondary" className="font-mono">
                  Status: {filterStatus}
                  <button
                    onClick={() => setFilterStatus("all")}
                    className="ml-1 hover:text-red-600"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {filterTag !== "all" && (
                <Badge variant="secondary" className="font-mono">
                  Tag: {filterTag}
                  <button
                    onClick={() => setFilterTag("all")}
                    className="ml-1 hover:text-red-600"
                  >
                    ×
                  </button>
                </Badge>
              )}
              <button
                onClick={() => {
                  setFilterStatus("all");
                  setFilterTag("all");
                }}
                className="text-sm font-mono text-red-600 hover:text-red-700"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Get all photos from all filtered models for slideshow */}
          {(() => {
            const allPhotos = filteredModels.flatMap(model => 
              model.photos.map(photo => ({
                ...photo,
                isBoxArt: photo.isBoxArt || false,
                model: {
                  id: model.id,
                  name: model.name,
                  chassisType: model.chassis,
                  tags: model.tags || []
                }
              }))
            );

            return (
              <>
                {/* Add slideshow button if there are photos */}
                {allPhotos.length > 0 && (
                  <div className="mb-4">
                    <Button 
                      variant="outline"
                      onClick={() => setIsSlideshowOpen(true)} 
                      className="font-mono"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Photo Slideshow ({allPhotos.length} photos)
                    </Button>
                  </div>
                )}

                {/* Models Grid/List */}
                {filteredModels.length > 0 ? (
                  <div className={`grid gap-4 ${
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
                    
                    {/* Add New Model Card - Mobile Only */}
                    <Card className="lg:hidden bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors">
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
                      {filterStatus === "all" && (
                        <>
                          <div className="lg:hidden">
                            <AddModelDialog />
                          </div>
                          <div className="hidden lg:block">
                            <AddModelDialogDesktop />
                          </div>
                        </>
                      )}
                    </div>
                  </Card>
                )}

                {/* Photo Slideshow */}
                <PhotoSlideshow
                  photos={allPhotos}
                  isOpen={isSlideshowOpen}
                  onClose={() => setIsSlideshowOpen(false)}
                />
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
