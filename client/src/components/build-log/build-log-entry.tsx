import { useState } from "react";
import { format } from "date-fns";
import { MoreHorizontal, Calendar, Camera, Edit, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BuildLogEntryWithPhotos } from "@shared/schema";

interface BuildLogEntryProps {
  entry: BuildLogEntryWithPhotos;
  onEdit: () => void;
  onDelete: () => void;
}

export default function BuildLogEntry({ entry, onEdit, onDelete }: BuildLogEntryProps) {
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const handlePhotoClick = (photoUrl: string) => {
    setSelectedPhoto(photoUrl);
    setShowPhotoModal(true);
  };

  return (
    <>
      <Card className="w-full">
        <CardContent className="p-6">
          {/* Header - Mobile & Desktop */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Badge 
                  variant="outline" 
                  className="font-mono bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
                >
                  #{entry.entryNumber}
                </Badge>
                <h3 className="text-lg font-mono font-semibold text-gray-900 dark:text-white">
                  {entry.title}
                </h3>
              </div>
              
              <div className="flex items-center text-sm font-mono text-gray-500 dark:text-gray-400">
                <Calendar className="h-4 w-4 mr-2" />
                {format(new Date(entry.entryDate), "MMM d, yyyy 'at' h:mm a")}
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden sm:flex sm:items-center sm:gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          {entry.content && (
            <div className="mb-4">
              <p className="font-mono text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {entry.content}
              </p>
            </div>
          )}

          {/* Photos Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="font-mono text-sm text-gray-500 dark:text-gray-400">
                {entry.photos && entry.photos.length > 0 
                  ? `${entry.photos.length} photo${entry.photos.length !== 1 ? 's' : ''}`
                  : 'No photos attached'
                }
              </span>
            </div>
            
            {/* Photo Grid - Only show if photos exist */}
            {entry.photos && entry.photos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {entry.photos.map((photoWrapper) => (
                  <div
                    key={photoWrapper.photo.id}
                    className="relative group cursor-pointer"
                    onClick={() => handlePhotoClick(photoWrapper.photo.url)}
                  >
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                      <img
                        src={photoWrapper.photo.url}
                        alt={photoWrapper.photo.caption || "Build photo"}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                    {photoWrapper.photo.caption && (
                      <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white p-2 text-xs font-mono rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        {photoWrapper.photo.caption}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="sm:hidden mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-end gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Photo Modal */}
      <Dialog open={showPhotoModal} onOpenChange={setShowPhotoModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="font-mono">Build Photo</DialogTitle>
          </DialogHeader>
          {selectedPhoto && (
            <div className="p-6 pt-0">
              <img
                src={selectedPhoto}
                alt="Build photo"
                className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}