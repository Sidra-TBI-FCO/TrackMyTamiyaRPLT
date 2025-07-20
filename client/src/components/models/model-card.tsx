import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera } from "lucide-react";
import { Link } from "wouter";
import { ModelWithRelations } from "@/types";

interface ModelCardProps {
  model: ModelWithRelations;
  onAddPhoto: (modelId: number) => void;
}

export default function ModelCard({ model, onAddPhoto }: ModelCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "built":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "building":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "planning":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const boxArtPhoto = model.photos.find(p => p.isBoxArt) || model.photos[0];
  const photoCount = model.photos.length;
  const hopUpCount = model.hopUpParts.length;

  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
      {boxArtPhoto ? (
        <img
          src={boxArtPhoto.url}
          alt={model.name}
          className="w-full h-48 object-cover"
        />
      ) : (
        <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          <div className="text-gray-400 dark:text-gray-500 text-center">
            <Camera className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm font-mono">No photo</p>
          </div>
        </div>
      )}

      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-mono font-semibold text-gray-900 dark:text-white line-clamp-2">
            {model.name}
          </h3>
          <Badge className={`text-xs font-mono ${getStatusColor(model.buildStatus)}`}>
            {model.buildStatus.charAt(0).toUpperCase() + model.buildStatus.slice(1)}
          </Badge>
        </div>

        <p className="text-sm font-mono text-gray-500 dark:text-gray-400 mb-3">
          Item #{model.itemNumber}
        </p>

        <div className="flex items-center justify-between text-sm font-mono text-gray-600 dark:text-gray-400 mb-4">
          <span>{photoCount} photos</span>
          <span>{hopUpCount} hop-ups</span>
        </div>

        <div className="flex space-x-2">
          <Link href={`/models/${model.id}`} className="flex-1">
            <Button
              size="sm"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-mono"
            >
              View Details
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddPhoto(model.id)}
            className="p-2"
          >
            <Camera className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
