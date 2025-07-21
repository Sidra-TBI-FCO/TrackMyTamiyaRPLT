import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Edit2, Trash2, Star } from "lucide-react";
import { Photo } from "@/types";
import ImageFallback from "@/components/ui/image-fallback";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PhotoGalleryProps {
  photos: Photo[];
  onUpdatePhoto?: (id: number, updates: Partial<Photo>) => void;
  onDeletePhoto?: (id: number) => void;
  columns?: number;
}

export default function PhotoGallery({ 
  photos, 
  onUpdatePhoto, 
  onDeletePhoto,
  columns = 4 
}: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [editingCaption, setEditingCaption] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);

  const handleEditPhoto = (photo: Photo) => {
    setSelectedPhoto(photo);
    setEditingCaption(photo.caption || "");
    setIsEditing(true);
  };

  const handleSaveCaption = () => {
    if (selectedPhoto && onUpdatePhoto) {
      onUpdatePhoto(selectedPhoto.id, { caption: editingCaption });
      setSelectedPhoto(null);
      setIsEditing(false);
    }
  };

  const gridCols: Record<number, string> = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
    5: "grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
  };

  return (
    <>
      <div className={`grid ${gridCols[columns]} gap-4`}>
        {photos.map((photo) => (
          <Card key={photo.id} className="overflow-hidden group relative">
            <div onClick={() => setSelectedPhoto(photo)}>
              <ImageFallback
                src={photo.url}
                alt={photo.caption || "RC model photo"}
                className="w-full aspect-square object-cover cursor-pointer"
                fallbackText="Photo not available in this environment"
              />
            </div>
            
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 opacity-0 group-hover:opacity-100">
              {/* Action buttons positioned on the right side vertically for better mobile landscape view */}
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex flex-col space-y-2">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 shadow-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditPhoto(photo);
                  }}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
                {onDeletePhoto && (
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-8 w-8 shadow-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePhoto(photo.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            {photo.isBoxArt && (
              <div className="absolute top-2 right-2">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
              </div>
            )}
            
            {photo.caption && (
              <div className="p-2 bg-white dark:bg-gray-800">
                <p className="text-xs font-mono text-gray-600 dark:text-gray-400 truncate">
                  {photo.caption}
                </p>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Photo Detail Dialog */}
      <Dialog open={!!selectedPhoto && !isEditing} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl">
          {selectedPhoto && (
            <>
              <DialogHeader>
                <DialogTitle className="font-mono">Photo Detail</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.caption || "RC model photo"}
                  className="w-full max-h-96 object-contain rounded"
                />
                {selectedPhoto.caption && (
                  <p className="font-mono text-sm text-gray-600 dark:text-gray-400">
                    {selectedPhoto.caption}
                  </p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Caption Dialog */}
      <Dialog open={isEditing} onOpenChange={() => setIsEditing(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-mono">Edit Photo Caption</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={editingCaption}
              onChange={(e) => setEditingCaption(e.target.value)}
              placeholder="Add a caption for this photo..."
              className="font-mono"
              rows={3}
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveCaption} className="bg-blue-600 hover:bg-blue-700">
                Save Caption
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
