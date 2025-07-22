import { Search, Images, Moon, Sun, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useLocation } from "wouter";

interface HeaderProps {
  onToggleDarkMode: () => void;
  isDarkMode: boolean;
}

export default function Header({ onToggleDarkMode, isDarkMode }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();

  const handlePhotoFrameClick = () => {
    setLocation("/photo-frame");
  };

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-tamiya-red rounded-lg flex items-center justify-center">
                <div className="text-white text-lg font-bold">🏎️</div>
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
