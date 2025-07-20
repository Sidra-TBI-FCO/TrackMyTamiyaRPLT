import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Calendar, DollarSign, Package } from "lucide-react";
import { HopUpPart } from "@/types";
import { format } from "date-fns";

interface HopUpCardProps {
  part: HopUpPart;
  onEdit?: (part: HopUpPart) => void;
  onDelete?: (id: number) => void;
  onImageClick?: (part: HopUpPart) => void;
}

export default function HopUpCard({ part, onEdit, onDelete, onImageClick }: HopUpCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "installed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "planned":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "removed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "motor":
      case "electronics":
        return "⚡";
      case "suspension":
        return "🔧";
      case "tires":
      case "wheels":
        return "🛞";
      case "body":
        return "🎨";
      case "chassis":
        return "🏗️";
      default:
        return "🔩";
    }
  };

  const formatCurrency = (amount: string | null) => {
    if (!amount) return null;
    const num = parseFloat(amount);
    return isNaN(num) ? null : `$${num.toFixed(2)}`;
  };

  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-2 flex-1">
            <div className="text-2xl">{getCategoryIcon(part.category)}</div>
            <div className="flex-1 min-w-0">
              <h3 className="font-mono font-semibold text-gray-900 dark:text-white line-clamp-2">
                {part.name}
              </h3>
              {part.itemNumber && (
                <p className="text-sm font-mono text-gray-500 dark:text-gray-400">
                  Item #{part.itemNumber}
                </p>
              )}
            </div>
          </div>
          
          <Badge className={`text-xs font-mono ${getStatusColor(part.installationStatus)}`}>
            {part.installationStatus.charAt(0).toUpperCase() + part.installationStatus.slice(1)}
          </Badge>
        </div>

        {/* Category and Supplier */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center space-x-4 text-sm font-mono text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <Package className="h-3 w-3" />
              <span className="capitalize">{part.category}</span>
            </div>
            {part.supplier && (
              <span>• {part.supplier}</span>
            )}
          </div>

          {/* Cost and Installation Date */}
          <div className="flex items-center justify-between text-sm font-mono text-gray-600 dark:text-gray-400">
            {formatCurrency(part.cost) && (
              <div className="flex items-center space-x-1">
                <DollarSign className="h-3 w-3" />
                <span>{formatCurrency(part.cost)}</span>
              </div>
            )}
            
            {part.installationDate && part.installationStatus === "installed" && (
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{format(new Date(part.installationDate), "MMM dd, yyyy")}</span>
              </div>
            )}
          </div>
        </div>

        {/* Photo */}
        {part.photoId && (
          <div className="mb-4">
            <div 
              className="w-full h-24 bg-gray-200 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 cursor-pointer hover:opacity-75 transition-opacity flex items-center justify-center"
              onClick={() => onImageClick?.(part)}
            >
              <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                📷 Part Photo
              </span>
            </div>
          </div>
        )}

        {/* Notes */}
        {part.notes && (
          <div className="mb-4">
            <p className="text-sm font-mono text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded p-2 line-clamp-3">
              {part.notes}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(part)}
              className="font-mono text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(part.id)}
              className="font-mono text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
