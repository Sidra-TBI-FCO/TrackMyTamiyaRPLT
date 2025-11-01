import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Edit, Trash2, ExternalLink, ImageIcon } from "lucide-react";
import { HopUpPartWithPhoto } from "@shared/schema";
import { SiAmazon, SiEbay } from "react-icons/si";
import { Globe } from "lucide-react";
import { useState } from "react";
import { addStorageFallbackParam } from "@/lib/file-utils";

interface HopUpCardProps {
  part: HopUpPartWithPhoto;
  onEdit?: (part: HopUpPartWithPhoto) => void;
  onDelete?: (id: number) => void;
  onImageClick?: (part: HopUpPartWithPhoto) => void;
}

export default function HopUpCard({ part, onEdit, onDelete, onImageClick }: HopUpCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  console.log('🔧 HopUpCard render:', { 
    partName: part.name, 
    photoId: part.photoId, 
    hasPhoto: !!part.photo,
    photoUrl: part.photo?.url 
  });
  
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

  const getStoreLogo = (storeName: string) => {
    const name = storeName.toLowerCase();
    if (name.includes('amazon')) return <SiAmazon className="h-4 w-4 text-orange-600" />;
    if (name.includes('ebay')) return <SiEbay className="h-4 w-4 text-blue-600" />;
    if (name.includes('tamiya')) return <span className="text-red-600 font-bold text-xs">田</span>;
    if (name.includes('tamiyabase')) return <span className="text-blue-600 font-bold text-xs">TB</span>;
    return <Globe className="h-4 w-4 text-gray-600" />;
  };

  const renderStoreLinks = () => {
    const storeUrls = part.storeUrls || {};
    const links = [];
    
    // Add legacy productUrl and tamiyaBaseUrl if they exist
    if (part.productUrl) {
      links.push({ name: part.supplier || 'Store', url: part.productUrl });
    }
    if (part.tamiyaBaseUrl) {
      links.push({ name: 'TamiyaBase', url: part.tamiyaBaseUrl });
    }
    
    // Add new storeUrls
    Object.entries(storeUrls).forEach(([storeName, url]) => {
      if (url && typeof url === 'string') {
        links.push({ name: storeName, url });
      }
    });

    return (
      <div className="flex items-center gap-1">
        {links.map(({ name, url }, index) => (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            asChild
            className="p-1 h-6 hover:bg-gray-100 dark:hover:bg-gray-700"
            title={`View on ${name}`}
          >
            <a href={url} target="_blank" rel="noopener noreferrer">
              {getStoreLogo(name)}
            </a>
          </Button>
        ))}
      </div>
    );
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(part.id);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          {/* Product Photo */}
          {part.photo && (
            <div 
              className="mb-4 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => onImageClick?.(part)}
            >
              <img
                src={addStorageFallbackParam(part.photo.url)}
                alt={part.name}
                className="w-full h-48 object-contain p-2"
                loading="lazy"
              />
            </div>
          )}
          
          {/* Mobile: Full detailed layout */}
          <div className="block lg:hidden">
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

          {/* Category and Details */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center space-x-4 text-sm font-mono text-gray-600 dark:text-gray-400">
              <span className="capitalize">{part.category}</span>
              {part.manufacturer && <span>• {part.manufacturer}</span>}
              {part.supplier && <span>• {part.supplier}</span>}
            </div>

            {/* Cost and additional info */}
            <div className="flex items-center justify-between text-sm font-mono text-gray-600 dark:text-gray-400">
              {formatCurrency(part.cost) && (
                <span className="text-green-600 dark:text-green-400 font-semibold">{formatCurrency(part.cost)}</span>
              )}
              {(part.color || part.material) && (
                <span>{[part.material, part.color].filter(Boolean).join(" / ")}</span>
              )}
            </div>
          </div>

          {/* Notes */}
          {part.notes && (
            <div className="mb-4">
              <p className="text-sm font-mono text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded p-2 line-clamp-3">
                {part.notes}
              </p>
            </div>
          )}

          {/* Store links and Actions */}
          <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
            {renderStoreLinks()}
            <div className="flex items-center gap-2">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(part)}
                  className="font-mono text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="font-mono text-red-600 hover:text-red-700 dark:text-red-400"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Desktop: Compact layout */}
        <div className="hidden lg:block">
          {/* Compact Header Row */}
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="text-lg flex-shrink-0">{getCategoryIcon(part.category)}</div>
              <div className="flex-1 min-w-0">
                <h3 className="font-mono font-medium text-sm text-gray-900 dark:text-white truncate">
                  {part.name}
                </h3>
                <div className="flex items-center gap-2 text-xs font-mono text-gray-500 dark:text-gray-400">
                  {part.itemNumber && <span>#{part.itemNumber}</span>}
                  {part.manufacturer && <span>• {part.manufacturer}</span>}
                  {formatCurrency(part.cost) && <span className="text-green-600 dark:text-green-400">• {formatCurrency(part.cost)}</span>}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge className={`text-xs font-mono px-2 py-0 ${getStatusColor(part.installationStatus)}`}>
                {part.installationStatus === "installed" ? "✓" : part.installationStatus === "planned" ? "○" : "◦"}
              </Badge>
              {renderStoreLinks()}
            </div>
          </div>

          {/* Compact Details Row */}
          <div className="flex items-center justify-between text-xs font-mono text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-3">
              <span className="capitalize">{part.category}</span>
              {part.color && <span>• {part.color}</span>}
              {part.material && <span>• {part.material}</span>}
            </div>
            
            {/* Action buttons - much smaller */}
            <div className="flex items-center gap-1">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(part)}
                  className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  title="Edit part"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700 dark:text-red-400"
                  title="Delete part"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Optional Notes - Only if they exist and are short */}
          {part.notes && part.notes.length < 100 && (
            <p className="text-xs font-mono text-gray-600 dark:text-gray-400 mt-2 line-clamp-1">
              {part.notes}
            </p>
          )}
        </div>
      </CardContent>
    </Card>

      {/* Single Delete Confirmation Dialog */}
      {onDelete && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Hop-Up Part</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{part.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                Delete Part
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
