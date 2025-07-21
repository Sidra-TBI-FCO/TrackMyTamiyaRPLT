import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getSlideshowSettings } from "@/lib/settings";
import ImageFallback from "@/components/ui/image-fallback";

interface Photo {
  id: number;
  url: string;
  caption?: string | null;
  isBoxArt: boolean;
  modelId: number;
}

interface Model {
  id: number;
  name: string;
  chassisType?: string | null;
  tags: string[];
}

interface PhotoWithModel extends Photo {
  model: Model;
}

interface PhotoSlideshowProps {
  photos: PhotoWithModel[];
  isOpen: boolean;
  onClose: () => void;
  initialIndex?: number;
}

export default function PhotoSlideshow({ 
  photos, 
  isOpen, 
  onClose, 
  initialIndex = 0 
}: PhotoSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [settings] = useState(() => getSlideshowSettings());

  const currentPhoto = photos[currentIndex];

  // Auto-start slideshow when opened if enabled
  useEffect(() => {
    if (isOpen && settings.autoStart && photos.length > 0) {
      setIsPlaying(true);
    }
  }, [isOpen, settings.autoStart, photos.length]);

  // Auto-advance slideshow
  useEffect(() => {
    if (!isPlaying || photos.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % photos.length);
    }, settings.duration * 1000); // Use settings duration in milliseconds

    return () => clearInterval(interval);
  }, [isPlaying, photos.length, settings.duration]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case ' ':
          e.preventDefault();
          togglePlayPause();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  const togglePlayPause = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  // Reset when photos change or slideshow opens
  useEffect(() => {
    setCurrentIndex(initialIndex);
    if (!isOpen) {
      setIsPlaying(false);
    }
  }, [photos, initialIndex, isOpen]);

  // Hide mobile navigation and ensure full screen on mobile
  useEffect(() => {
    if (isOpen) {
      // Hide mobile bottom navigation
      const mobileNav = document.querySelector('[class*="pb-16"]') as HTMLElement;
      if (mobileNav) {
        mobileNav.style.paddingBottom = '0';
      }
      
      // Prevent scrolling on body
      document.body.style.overflow = 'hidden';
      
      // Hide mobile browser UI by scrolling to top
      window.scrollTo(0, 0);
      
      // Request fullscreen on mobile if supported
      if (document.documentElement.requestFullscreen && /Mobi|Android/i.test(navigator.userAgent)) {
        document.documentElement.requestFullscreen().catch(() => {
          // Fullscreen request failed, continue without it
        });
      }
    } else {
      // Restore mobile navigation
      const mobileNav = document.querySelector('[class*="pb-16"]') as HTMLElement;
      if (mobileNav) {
        mobileNav.style.paddingBottom = '';
      }
      
      // Restore scrolling
      document.body.style.overflow = '';
      
      // Exit fullscreen if it was activated
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {
          // Exit fullscreen failed, continue without it
        });
      }
    }
    
    return () => {
      // Cleanup on unmount
      document.body.style.overflow = '';
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;
  
  // If no photos, show empty state
  if (photos.length === 0) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black" onClick={onClose} />
        <div className="relative text-center text-white">
          <h2 className="text-2xl font-mono mb-4">No Photos Available</h2>
          <Button onClick={onClose} variant="outline" className="text-white border-white">
            Close
          </Button>
        </div>
      </div>
    );
  }
  
  if (!currentPhoto) return null;

  return (
    <div className="fixed inset-0 bg-black z-[9999] flex items-center justify-center">
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black" onClick={onClose} />

      {/* Content */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Main Image - Full screen on mobile */}
        <ImageFallback
          src={currentPhoto.url}
          alt={currentPhoto.caption || `${currentPhoto.model.name} photo`}
          className="w-full h-full object-contain md:max-w-full md:max-h-full"
          fallbackText="Photo not available in this environment"
        />

        {/* Navigation Controls */}
        {photos.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-colors"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-colors"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        {/* Top Controls */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {photos.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePlayPause}
                className="bg-black/50 hover:bg-black/70 text-white border-0"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
            )}
            <span className="text-white font-mono text-sm bg-black/50 px-2 py-1 rounded">
              {currentIndex + 1} / {photos.length}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="bg-black/50 hover:bg-black/70 text-white border-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Photo Information Overlay - Bottom left on mobile */}
        <div className="absolute bottom-0 left-0 right-0 md:right-auto bg-gradient-to-t md:bg-gradient-to-r from-black/90 to-transparent p-4 md:p-6 md:max-w-md">
          <div className="space-y-2 md:space-y-3">
            {/* Model Name and Chassis */}
            <div>
              <h2 className="text-lg md:text-2xl font-mono font-bold text-white">
                {currentPhoto.model.name}
              </h2>
              {currentPhoto.model.chassisType && (
                <p className="text-sm md:text-lg font-mono text-gray-300">
                  {currentPhoto.model.chassisType}
                </p>
              )}
            </div>

            {/* Photo Caption */}
            {settings.showCaptions && currentPhoto.caption && (
              <p className="text-white font-mono text-sm md:text-lg">
                {currentPhoto.caption}
              </p>
            )}

            {/* Tags and Box Art Badge */}
            <div className="flex items-center space-x-2 flex-wrap">
              {currentPhoto.isBoxArt && (
                <Badge className="bg-red-600 text-white font-mono text-xs md:text-sm">
                  Box Art
                </Badge>
              )}
              {settings.showTags && currentPhoto.model.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="font-mono text-xs md:text-sm">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Thumbnail Strip (for multiple photos) */}
        {photos.length > 1 && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2">
            <div className="flex space-x-2 bg-black/50 p-2 rounded-lg max-w-md overflow-x-auto">
              {photos.map((photo, index) => (
                <button
                  key={photo.id}
                  onClick={() => setCurrentIndex(index)}
                  className={`flex-shrink-0 w-12 h-12 rounded overflow-hidden border-2 transition-colors ${
                    index === currentIndex
                      ? 'border-white'
                      : 'border-transparent hover:border-gray-400'
                  }`}
                >
                  <img
                    src={photo.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}