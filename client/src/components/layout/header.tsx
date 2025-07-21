import { Search, Images, Moon, Sun, Settings, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useLocation } from "wouter";
import { useSlideshow } from "@/lib/slideshow-context";
import { useQuery } from "@tanstack/react-query";
import { ModelWithRelations } from "@/types";

interface HeaderProps {
  onToggleDarkMode: () => void;
  isDarkMode: boolean;
}

export default function Header({ onToggleDarkMode, isDarkMode }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useLocation();
  const { openSlideshow } = useSlideshow();

  // Get all models for global slideshow
  const { data: models } = useQuery<ModelWithRelations[]>({
    queryKey: ["/api/models"],
  });

  const handlePhotoFrameClick = () => {
    // Check if we're on a model detail page
    const modelMatch = location.match(/^\/models\/(\d+)$/);
    if (modelMatch && models) {
      const modelId = parseInt(modelMatch[1]);
      const currentModel = models.find(m => m.id === modelId);
      if (currentModel && currentModel.photos.length > 0) {
        // Trigger slideshow for current model's photos
        // This will need to be handled by the model detail page itself
        const event = new CustomEvent('triggerModelSlideshow');
        document.dispatchEvent(event);
        return;
      }
    }
    
    // Default: open global slideshow
    openSlideshow();
  };

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-tamiya-red dark:bg-tamiya-blue rounded-lg flex items-center justify-center">
                <Star className="h-5 w-5 text-white fill-white" />
              </div>
              <div>
                <h1 className="text-xl font-mono font-bold text-gray-900 dark:text-white">
                  TrackMyTamiya
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                  RC Collection Manager
                </p>
              </div>
            </div>
          </div>

          {/* Search Bar - Desktop Only */}
          <div className="flex-1 max-w-md mx-8 hidden lg:block">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search models, parts, builds..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 font-mono text-sm"
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Navigation Actions */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePhotoFrameClick}
              className="text-gray-600 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400"
            >
              <Images className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleDarkMode}
              className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/settings")}
              className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
