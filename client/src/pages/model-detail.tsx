import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Camera, Wrench, Cog, Edit, Trash2, X, Play } from "lucide-react";
import { ModelWithRelations } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import EditModelDialog from "@/components/models/edit-model-dialog";
import AddPhotoDialog from "@/components/photos/add-photo-dialog";
import PhotoSlideshow from "@/components/photos/photo-slideshow";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function ModelDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddPhotoOpen, setIsAddPhotoOpen] = useState(false);
  const [isSlideshowOpen, setIsSlideshowOpen] = useState(false);
  const [slideshowStartIndex, setSlideshowStartIndex] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: model, isLoading } = useQuery<ModelWithRelations>({
    queryKey: ["/api/models", id],
    enabled: !!id,
  });

  const deleteModelMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/models/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/models"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Model deleted",
        description: `${model?.name} has been removed from your collection.`,
      });
      setLocation("/models");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete model",
        variant: "destructive",
      });
    },
  });

  const deletePhotoMutation = useMutation({
    mutationFn: async (photoId: number) => {
      await apiRequest("DELETE", `/api/photos/${photoId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/models", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/models"] });
      toast({
        title: "Photo deleted",
        description: "Photo has been removed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete photo",
        variant: "destructive",
      });
    },
  });

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

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center space-x-4">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-8 w-64" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <Skeleton className="h-64 w-full" />
            </Card>
            <Card>
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!model) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="p-12">
          <div className="text-center">
            <h2 className="text-xl font-mono font-semibold text-gray-900 dark:text-white mb-2">
              Model Not Found
            </h2>
            <p className="font-mono text-gray-500 dark:text-gray-400 mb-4">
              The model you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button onClick={() => setLocation("/models")} className="font-mono">
              Back to Collection
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const boxArtPhoto = model.photos.find(p => p.isBoxArt) || model.photos[0];
  const otherPhotos = model.photos.filter(p => !p.isBoxArt || p.id !== boxArtPhoto?.id);
  
  // Prepare photos for slideshow with model data
  const slideshowPhotos = model.photos.map(photo => ({
    ...photo,
    model: {
      id: model.id,
      name: model.name,
      chassisType: model.chassisType,
      tags: model.tags
    }
  }));

  const handlePhotoClick = (photoId: number) => {
    const photoIndex = model.photos.findIndex(p => p.id === photoId);
    setSlideshowStartIndex(photoIndex);
    setIsSlideshowOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        {/* Mobile Layout */}
        <div className="lg:hidden">
          {/* Top row with back button and actions */}
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="ghost"
              onClick={() => setLocation("/models")}
              className="flex items-center space-x-1 font-mono p-2"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="font-mono px-2"
                onClick={() => setIsEditMode(true)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 font-mono px-2"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Model info row */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 mr-3">
              <h1 className="text-xl font-mono font-bold text-gray-900 dark:text-white leading-tight">
                {model.name}
              </h1>
              <p className="text-sm font-mono text-gray-500 dark:text-gray-400 mt-1">
                Item #{model.itemNumber}
              </p>
            </div>
            <Badge className={`font-mono text-xs ${getStatusColor(model.buildStatus)} flex-shrink-0`}>
              {model.buildStatus.charAt(0).toUpperCase() + model.buildStatus.slice(1)}
            </Badge>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:flex lg:items-center lg:justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => setLocation("/models")}
              className="flex items-center space-x-2 font-mono"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            <div>
              <h1 className="text-2xl font-mono font-bold text-gray-900 dark:text-white">
                {model.name}
              </h1>
              <p className="text-sm font-mono text-gray-500 dark:text-gray-400">
                Item #{model.itemNumber}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge className={`font-mono ${getStatusColor(model.buildStatus)}`}>
              {model.buildStatus.charAt(0).toUpperCase() + model.buildStatus.slice(1)}
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              className="font-mono"
              onClick={() => setIsEditMode(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 font-mono"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Main Photo */}
          <Card className="mb-6">
            <CardContent className="p-0 relative group">
              {boxArtPhoto ? (
                <>
                  <img
                    src={boxArtPhoto.url}
                    alt={model.name}
                    className="w-full h-64 lg:h-96 object-cover rounded-lg cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => handlePhotoClick(boxArtPhoto.id)}
                  />
                  
                  {/* Delete button for main photo */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePhotoMutation.mutate(boxArtPhoto.id);
                    }}
                    disabled={deletePhotoMutation.isPending}
                    className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                    title="Delete photo"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <div className="w-full h-64 lg:h-96 bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded-lg">
                  <div className="text-center text-gray-400 dark:text-gray-500">
                    <Camera className="h-12 w-12 mx-auto mb-2" />
                    <p className="font-mono">No photos yet</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabs for different sections */}
          <Tabs defaultValue="photos" className="w-full">
            <TabsList className="grid w-full grid-cols-3 font-mono">
              <TabsTrigger value="photos">Photos ({model.photos.length})</TabsTrigger>
              <TabsTrigger value="builds">Build Log ({model.buildLogEntries.length})</TabsTrigger>
              <TabsTrigger value="parts">Hop-Ups ({model.hopUpParts.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="photos" className="space-y-4">
              {/* Slideshow button */}
              {model.photos.length > 0 && (
                <div className="mb-4">
                  <Button 
                    variant="outline"
                    onClick={() => setIsSlideshowOpen(true)} 
                    className="font-mono"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Slideshow ({model.photos.length} photos)
                  </Button>
                </div>
              )}

              {otherPhotos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {otherPhotos.map((photo) => (
                    <Card key={photo.id} className="overflow-hidden relative group cursor-pointer">
                      <img
                        src={photo.url}
                        alt={photo.caption || "Model photo"}
                        className="w-full h-32 object-cover hover:scale-105 transition-transform"
                        onClick={() => handlePhotoClick(photo.id)}
                      />
                      
                      {/* Delete button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePhotoMutation.mutate(photo.id);
                        }}
                        disabled={deletePhotoMutation.isPending}
                        className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                        title="Delete photo"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      {photo.caption && (
                        <CardContent className="p-2">
                          <p className="text-xs font-mono text-gray-600 dark:text-gray-400 truncate">
                            {photo.caption}
                          </p>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-8">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <Camera className="h-8 w-8 mx-auto mb-2" />
                    <p className="font-mono">No additional photos</p>
                  </div>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="builds">
              <Card className="p-8">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <Wrench className="h-8 w-8 mx-auto mb-2" />
                  <p className="font-mono">Build logs coming soon</p>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="parts">
              <Card className="p-8">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <Cog className="h-8 w-8 mx-auto mb-2" />
                  <p className="font-mono">Hop-up parts coming soon</p>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Model Info */}
          <Card>
            <CardHeader>
              <CardTitle className="font-mono text-lg">Model Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-mono text-gray-500 dark:text-gray-400">Chassis</p>
                <p className="font-mono text-gray-900 dark:text-white">
                  {model.chassis || "Not specified"}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-mono text-gray-500 dark:text-gray-400">Release Year</p>
                <p className="font-mono text-gray-900 dark:text-white">
                  {model.releaseYear || "Unknown"}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-mono text-gray-500 dark:text-gray-400">Total Investment</p>
                <p className="font-mono text-gray-900 dark:text-white">
                  ${parseFloat(model.totalCost || "0").toFixed(2)}
                </p>
              </div>
              
              {model.notes && (
                <div>
                  <p className="text-sm font-mono text-gray-500 dark:text-gray-400 mb-1">Notes</p>
                  <p className="font-mono text-gray-900 dark:text-white text-sm">
                    {model.notes}
                  </p>
                </div>
              )}

              {model.tags && model.tags.length > 0 && (
                <div>
                  <p className="text-sm font-mono text-gray-500 dark:text-gray-400 mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {model.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="font-mono text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="font-mono text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 font-mono"
                onClick={() => setIsAddPhotoOpen(true)}
              >
                <Camera className="mr-2 h-4 w-4" />
                Add Photo
              </Button>
              <Button className="w-full bg-green-600 hover:bg-green-700 font-mono" disabled>
                <Wrench className="mr-2 h-4 w-4" />
                Log Progress
              </Button>
              <Button className="w-full bg-orange-600 hover:bg-orange-700 font-mono" disabled>
                <Cog className="mr-2 h-4 w-4" />
                Add Hop-Up
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <EditModelDialog
        model={model}
        open={isEditMode}
        onOpenChange={setIsEditMode}
      />

      <AddPhotoDialog
        modelId={model.id}
        open={isAddPhotoOpen}
        onOpenChange={setIsAddPhotoOpen}
      />

      <PhotoSlideshow
        photos={slideshowPhotos}
        isOpen={isSlideshowOpen}
        onClose={() => setIsSlideshowOpen(false)}
        initialIndex={slideshowStartIndex}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Model</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{model.name}"? This action cannot be undone.
              All photos, build logs, and hop-up parts associated with this model will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteModelMutation.mutate()}
              disabled={deleteModelMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteModelMutation.isPending ? "Deleting..." : "Delete Model"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
