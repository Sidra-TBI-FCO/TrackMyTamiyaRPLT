import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Camera, Mic, Edit, Trash2 } from "lucide-react";
import { BuildLogEntryWithPhotos } from "@/types";
import { format } from "date-fns";

interface BuildLogEntryProps {
  entry: BuildLogEntryWithPhotos;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function BuildLogEntry({ entry, onEdit, onDelete }: BuildLogEntryProps) {
  return (
    <Card className="bg-white dark:bg-gray-800">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-mono font-semibold text-gray-900 dark:text-white">
              {entry.title}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <Calendar className="h-3 w-3 text-gray-400" />
              <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                {format(new Date(entry.entryDate), "MMM dd, yyyy 'at' h:mm a")}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            {entry.voiceNoteUrl && (
              <Badge variant="secondary" className="text-xs font-mono">
                <Mic className="h-3 w-3 mr-1" />
                Voice
              </Badge>
            )}
            {entry.photos.length > 0 && (
              <Badge variant="secondary" className="text-xs font-mono">
                <Camera className="h-3 w-3 mr-1" />
                {entry.photos.length}
              </Badge>
            )}
          </div>
        </div>

        {entry.content && (
          <p className="font-mono text-sm text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-wrap">
            {entry.content}
          </p>
        )}

        {entry.transcription && entry.transcription !== entry.content && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
            <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mb-1">
              Voice transcription:
            </p>
            <p className="font-mono text-sm text-gray-700 dark:text-gray-300">
              {entry.transcription}
            </p>
          </div>
        )}

        {entry.photos.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            {entry.photos.slice(0, 4).map(({ photo }) => (
              <img
                key={photo.id}
                src={photo.url}
                alt={photo.caption || "Build progress photo"}
                className="w-full h-20 object-cover rounded border border-gray-200 dark:border-gray-600"
              />
            ))}
            {entry.photos.length > 4 && (
              <div className="w-full h-20 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 flex items-center justify-center">
                <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                  +{entry.photos.length - 4} more
                </span>
              </div>
            )}
          </div>
        )}

        {entry.voiceNoteUrl && (
          <div className="mb-4">
            <audio controls className="w-full h-8">
              <source src={entry.voiceNoteUrl} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        <div className="flex justify-end space-x-2">
          {onEdit && (
            <Button variant="ghost" size="sm" onClick={onEdit} className="font-mono">
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="sm" onClick={onDelete} className="font-mono text-red-600 hover:text-red-700">
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
