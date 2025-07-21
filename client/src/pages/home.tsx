import { useQuery } from "@tanstack/react-query";
import { Plus, Camera, Mic, Play, Search } from "lucide-react";
import { useLocation } from "wouter";
import { ModelWithRelations } from "@/types";
import CollectionStats from "@/components/stats/collection-stats";
import ModelCard from "@/components/models/model-card";
import AddModelDialog from "@/components/models/add-model-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import PhotoSlideshow from "@/components/photos/photo-slideshow";
import { useSlideshow } from "@/lib/slideshow-context";

export default function Home() {
  const [, setLocation] = useLocation();
  const [selectedPhotos] = useState<string[]>([]);
  const { isOpen: isSlideshowOpen, closeSlideshow } = useSlideshow();

  const { data: models, isLoading } = useQuery<ModelWithRelations[]>({
    queryKey: ["/api/models"],
  });

  const handleQuickPhoto = () => {
    // This would open camera interface
    console.log("Opening camera for quick photo");
  };

  const handleVoiceNote = () => {
    // This would open voice recording interface
    console.log("Starting voice recording");
  };



  const handleAddPhoto = (modelId: number) => {
    // This would open photo upload for specific model
    console.log(`Adding photo to model ${modelId}`);
  };

  const recentModels = models?.slice(0, 3) || [];
  const allPhotos = models?.flatMap(m => m.photos).slice(0, 8) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-x-hidden">
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
      {/* Quick Actions - Hidden on mobile, shown on desktop */}
      <div className="mb-8 hidden lg:block">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AddModelDialog
            trigger={
              <button className="bg-red-600 text-white p-4 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-3 w-full">
                <Plus className="text-xl" />
                <div className="text-left">
                  <div className="font-mono font-semibold">Add New Model</div>
                  <div className="text-sm opacity-90">Enter Tamiya item number</div>
                </div>
              </button>
            }
          />

          <Button
            onClick={handleQuickPhoto}
            className="bg-blue-600 text-white p-4 h-auto hover:bg-blue-700 transition-colors flex items-center space-x-3 justify-start"
          >
            <Camera className="text-xl" />
            <div className="text-left">
              <div className="font-mono font-semibold">Quick Photo</div>
              <div className="text-sm opacity-90">Capture progress shot</div>
            </div>
          </Button>

          <Button
            onClick={handleVoiceNote}
            className="bg-green-600 text-white p-4 h-auto hover:bg-green-700 transition-colors flex items-center space-x-3 justify-start"
          >
            <Mic className="text-xl" />
            <div className="text-left">
              <div className="font-mono font-semibold">Voice Note</div>
              <div className="text-sm opacity-90">Record build progress</div>
            </div>
          </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Stats */}
        <div className="lg:col-span-1">
          <h2 className="text-lg font-mono font-bold text-gray-900 dark:text-white mb-4">
            Collection Stats
          </h2>
          <CollectionStats />
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-mono font-bold text-gray-900 dark:text-white">
              Recent Activity
            </h2>
            <Button
              variant="ghost"
              className="text-sm font-mono text-red-600 hover:text-red-700"
            >
              View All
            </Button>
          </div>

          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="divide-y divide-gray-200 dark:divide-gray-700 p-0">
              {isLoading ? (
                <div className="space-y-4 p-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start space-x-4">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400 font-mono">
                  No recent activity to display
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Models */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h2 className="text-xl font-mono font-bold text-gray-900 dark:text-white mb-4 sm:mb-0">
            Recent Models
          </h2>
          <Button
            variant="ghost"
            className="text-red-600 hover:text-red-700 font-mono"
            onClick={() => setLocation("/models")}
          >
            View All Models
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
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
        ) : recentModels.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentModels.map((model) => (
              <ModelCard
                key={model.id}
                model={model}
                onAddPhoto={handleAddPhoto}
              />
            ))}
          </div>
        ) : (
          <Card className="p-8">
            <div className="text-center">
              <div className="text-gray-400 dark:text-gray-500 mb-4">
                <Plus className="h-12 w-12 mx-auto mb-2" />
                <h3 className="font-mono font-semibold text-gray-900 dark:text-white">
                  No models yet
                </h3>
                <p className="text-sm font-mono text-gray-500 dark:text-gray-400 mt-2">
                  Add your first Tamiya model to get started
                </p>
              </div>
              <AddModelDialog />
            </div>
          </Card>
        )}
      </div>


      
      {/* Photo Slideshow */}
      <PhotoSlideshow
        photos={models?.flatMap(model => 
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
        ) || []}
        isOpen={isSlideshowOpen}
        onClose={closeSlideshow}
      />
    </div>
  );
}
