import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Camera, Wrench, Cog, Edit, Trash2, X, Play, ExternalLink, Calendar, FileText, Plus } from "lucide-react";
import { ModelWithRelations, BuildLogEntryWithPhotos } from "@/types";
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
import BoxArtSelector from "@/components/photos/box-art-selector";
import HopUpPartsList from "@/components/hop-up-parts/hop-up-parts-list";
import HopUpPartDialog from "@/components/hop-up-parts/hop-up-part-dialog";
import BuildLogEntry from "@/components/build-log/build-log-entry";
import BuildLogEntryDialog from "@/components/build-log/build-log-entry-dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSlideshow } from "@/lib/slideshow-context";
import { useState, useEffect } from "react";

export default function ModelDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddPhotoOpen, setIsAddPhotoOpen] = useState(false);
  const [isSlideshowOpen, setIsSlideshowOpen] = useState(false);
  const [slideshowStartIndex, setSlideshowStartIndex] = useState(0);
  const [isBoxArtSelectorOpen, setIsBoxArtSelectorOpen] = useState(false);
  const [isAddHopUpOpen, setIsAddHopUpOpen] = useState(false);
  const [isAddBuildLogOpen, setIsAddBuildLogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { openSlideshow: openGlobalSlideshow } = useSlideshow();

  const { data: model, isLoading } = useQuery<ModelWithRelations>({
    queryKey: ["/api/models", id],
    enabled: !!id,
  });

  // Fetch build log entries for this model
  const { data: buildLogEntries, isLoading: isLoadingBuildLog } = useQuery<BuildLogEntryWithPhotos[]>({
    queryKey: [`/api/models/${id}/build-log-entries`],
    enabled: !!id,
  });

  // Calculate total investment including hop-up parts
  const totalInvestment = model 
    ? (parseFloat(model.totalCost || "0") + 
       (model.hopUpParts?.reduce((sum, part) => {
         const partCost = part.cost ? parseFloat(part.cost) : 0;
         return sum + (isNaN(partCost) ? 0 : partCost);
       }, 0) || 0))
    : 0;

  // Listen for header slideshow trigger - must be before any early returns
  useEffect(() => {
    const handleHeaderSlideshow = () => {
      if (model && model.photos.length > 0) {
        setSlideshowStartIndex(0);
        setIsSlideshowOpen(true);
      }
    };

    document.addEventListener('triggerModelSlideshow', handleHeaderSlideshow);
    return () => document.removeEventListener('triggerModelSlideshow', handleHeaderSlideshow);
  }, [model]);

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
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4 overflow-x-hidden">
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
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4 overflow-x-hidden">
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

  const boxArtPhoto = model?.photos?.find(p => p.isBoxArt) || model?.photos?.[0];
  const otherPhotos = model?.photos?.filter(p => !p.isBoxArt || p.id !== boxArtPhoto?.id) || [];
  
  // Prepare photos for slideshow with model data
  const slideshowPhotos = model?.photos?.map(photo => ({
    ...photo,
    isBoxArt: photo.isBoxArt || false,
    model: {
      id: model.id,
      name: model.name,
      chassisType: model.chassis,
      tags: model.tags || []
    }
  })) || [];

  const handlePhotoClick = (photoId: number) => {
    const photoIndex = model?.photos.findIndex(p => p.id === photoId) || 0;
    setSlideshowStartIndex(photoIndex);
    setIsSlideshowOpen(true);
  };

  return (
    <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4 overflow-x-hidden">
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
                {model.buildType === 'custom' && model.bodyName ? model.bodyName : model.name}
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
                {model.buildType === 'custom' && model.bodyName ? model.bodyName : model.name}
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
                  
                  {/* Box Art Badge */}
                  <div className="absolute top-4 left-4">
                    <Badge 
                      variant="secondary" 
                      className="font-mono text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 cursor-pointer hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsBoxArtSelectorOpen(true);
                      }}
                      title="Click to change box art"
                    >
                      Box Art - Click to Change
                    </Badge>
                  </div>
                  
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

          {/* Mobile Quick Actions - Show only on mobile, above tabs */}
          <Card className="lg:hidden mb-6">
            <CardContent className="p-3">
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 font-mono text-xs p-3 h-10 flex flex-col items-center justify-center"
                  onClick={() => setIsAddPhotoOpen(true)}
                >
                  <Camera className="h-4 w-4 mb-1" />
                  <span className="block text-xs">Photo</span>
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700 font-mono text-xs p-3 h-10 flex flex-col items-center justify-center"
                  onClick={() => setIsAddBuildLogOpen(true)}
                >
                  <Wrench className="h-4 w-4 mb-1" />
                  <span className="block text-xs">Log</span>
                </Button>
                <Button 
                  className="bg-orange-600 hover:bg-orange-700 font-mono text-xs p-3 h-10 flex flex-col items-center justify-center"
                  onClick={() => setIsAddHopUpOpen(true)}
                >
                  <Cog className="h-4 w-4 mb-1" />
                  <span className="block text-xs">Hop-Up</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabs for different sections */}
          <Tabs defaultValue="photos" className="w-full">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-3 font-mono">
              <TabsTrigger value="photos" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Photos ({model.photos.length})</span>
                <span className="sm:hidden">Photos</span>
              </TabsTrigger>
              <TabsTrigger value="builds" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Build Log ({buildLogEntries?.length || 0})</span>
                <span className="sm:hidden">Build</span>
              </TabsTrigger>
              <TabsTrigger value="parts" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Hop-Ups ({model.hopUpParts.length})</span>
                <span className="sm:hidden">Parts</span>
              </TabsTrigger>
              <TabsTrigger value="details" className="lg:hidden text-xs sm:text-sm">Details</TabsTrigger>
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
                      
                      {/* Delete button - always visible on mobile, hover on desktop */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePhotoMutation.mutate(photo.id);
                        }}
                        disabled={deletePhotoMutation.isPending}
                        className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 md:p-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity disabled:opacity-50 shadow-lg"
                        title="Delete photo"
                      >
                        <X className="h-4 w-4 md:h-3 md:w-3" />
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
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-mono font-semibold text-gray-900 dark:text-white">
                      Build Log
                    </h3>
                    <p className="text-sm font-mono text-gray-500 dark:text-gray-400">
                      {buildLogEntries?.length || 0} entries
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setIsAddBuildLogOpen(true)}
                      className="bg-red-600 hover:bg-red-700 text-white font-mono"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Entry #{(buildLogEntries?.length || 0) + 1}
                    </Button>
                    
                    <Button
                      onClick={() => setLocation(`/models/${model.id}/build-log`)}
                      variant="outline"
                      className="font-mono"
                    >
                      <Wrench className="h-4 w-4 mr-2" />
                      Full View
                    </Button>
                  </div>
                </div>

                {/* Build Log Entries */}
                {isLoadingBuildLog ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Card key={i}>
                        <CardContent className="p-6">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                            </div>
                            <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                            <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : buildLogEntries && buildLogEntries.length > 0 ? (
                  <div className="space-y-4">
                    {buildLogEntries.map((entry) => (
                      <BuildLogEntry
                        key={entry.id}
                        entry={entry}
                        onEdit={() => {
                          console.log("Edit entry", entry.id);
                        }}
                        onDelete={() => {
                          console.log("Delete entry", entry.id);
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="p-8">
                    <div className="text-center text-gray-400 dark:text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4" />
                      <h4 className="text-lg font-mono font-semibold text-gray-900 dark:text-white mb-2">
                        No Build Log Entries
                      </h4>
                      <p className="font-mono text-gray-500 dark:text-gray-400 mb-6">
                        Start documenting your build progress with photos and notes.
                      </p>
                      <Button
                        onClick={() => setIsAddBuildLogOpen(true)}
                        className="bg-red-600 hover:bg-red-700 text-white font-mono"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Entry
                      </Button>
                    </div>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="parts">
              <HopUpPartsList modelId={model.id} />
            </TabsContent>

            {/* Mobile-only Details Tab */}
            <TabsContent value="details" className="lg:hidden">
              <div className="space-y-6">
                {/* Model Details Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="font-mono text-lg">Model Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Build Type - Top Section */}
                    <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-mono text-gray-500 dark:text-gray-400">Build Type</p>
                        <Badge 
                          className={`font-mono text-xs ${
                            model.buildType === 'custom' 
                              ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200' 
                              : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                          }`}
                        >
                          {model.buildType === 'custom' ? 'Custom Build' : 'Kit Build'}
                        </Badge>
                      </div>
                    </div>

                    {/* 2-Column Layout for Model Details */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      {/* Left Column */}
                      <div>
                        <p className="text-sm font-mono text-gray-500 dark:text-gray-400">Chassis</p>
                        <p className="font-mono text-gray-900 dark:text-white text-sm">
                          {model.chassis || "Not specified"}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-mono text-gray-500 dark:text-gray-400">Release Year</p>
                        <p className="font-mono text-gray-900 dark:text-white text-sm">
                          {model.releaseYear || "Unknown"}
                        </p>
                      </div>

                      {model.scale && (
                        <div>
                          <p className="text-sm font-mono text-gray-500 dark:text-gray-400">Scale</p>
                          <p className="font-mono text-gray-900 dark:text-white text-sm">
                            {model.scale}
                          </p>
                        </div>
                      )}
                      
                      {model.driveType && (
                        <div>
                          <p className="text-sm font-mono text-gray-500 dark:text-gray-400">Drive Type</p>
                          <p className="font-mono text-gray-900 dark:text-white text-sm">
                            {model.driveType}
                          </p>
                        </div>
                      )}
                      
                      {model.chassisMaterial && (
                        <div>
                          <p className="text-sm font-mono text-gray-500 dark:text-gray-400">Chassis Material</p>
                          <p className="font-mono text-gray-900 dark:text-white text-sm">
                            {model.chassisMaterial}
                          </p>
                        </div>
                      )}
                      
                      {model.differentialType && (
                        <div>
                          <p className="text-sm font-mono text-gray-500 dark:text-gray-400">Differential</p>
                          <p className="font-mono text-gray-900 dark:text-white text-sm">
                            {model.differentialType}
                          </p>
                        </div>
                      )}
                      
                      {model.motorSize && (
                        <div>
                          <p className="text-sm font-mono text-gray-500 dark:text-gray-400">Motor</p>
                          <p className="font-mono text-gray-900 dark:text-white text-sm">
                            {model.motorSize}
                          </p>
                        </div>
                      )}
                      
                      {model.batteryType && (
                        <div>
                          <p className="text-sm font-mono text-gray-500 dark:text-gray-400">Battery</p>
                          <p className="font-mono text-gray-900 dark:text-white text-sm">
                            {model.batteryType}
                          </p>
                        </div>
                      )}
                      
                      {/* Custom Build Fields */}
                      {model.buildType === 'custom' && model.bodyName && (
                        <div>
                          <p className="text-sm font-mono text-gray-500 dark:text-gray-400">Body</p>
                          <p className="font-mono text-gray-900 dark:text-white text-sm">
                            {model.bodyName}
                          </p>
                        </div>
                      )}
                      
                      {model.buildType === 'custom' && model.bodyItemNumber && (
                        <div>
                          <p className="text-sm font-mono text-gray-500 dark:text-gray-400">Body Item #</p>
                          <p className="font-mono text-gray-900 dark:text-white text-sm">
                            {model.bodyItemNumber}
                          </p>
                        </div>
                      )}
                      
                      {model.buildType === 'custom' && model.bodyManufacturer && (
                        <div>
                          <p className="text-sm font-mono text-gray-500 dark:text-gray-400">Body Manufacturer</p>
                          <p className="font-mono text-gray-900 dark:text-white text-sm">
                            {model.bodyManufacturer}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Investment Section */}
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-mono text-gray-500 dark:text-gray-400 mb-1">Total Investment</p>
                      <p className="font-mono text-xl font-bold text-green-600 dark:text-green-400">
                        ${totalInvestment.toFixed(2)}
                      </p>
                    </div>

                    {/* Tags */}
                    {model.tags && model.tags.length > 0 && (
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-mono text-gray-500 dark:text-gray-400 mb-2">Tags</p>
                        <div className="flex flex-wrap gap-1">
                          {model.tags.map((tag, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="font-mono text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {model.notes && (
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-mono text-gray-500 dark:text-gray-400 mb-1">Notes</p>
                        <p className="font-mono text-gray-900 dark:text-white text-sm">
                          {model.notes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>


              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Desktop Sidebar - Hidden on Mobile */}
        <div className="hidden lg:block space-y-6">
          {/* Model Info */}
          <Card>
            <CardHeader>
              <CardTitle className="font-mono text-lg">Model Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Build Type - Top Section */}
              <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-mono text-gray-500 dark:text-gray-400">Build Type</p>
                  <Badge 
                    className={`font-mono text-xs ${
                      model.buildType === 'custom' 
                        ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200' 
                        : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                    }`}
                  >
                    {model.buildType === 'custom' ? 'Custom Build' : 'Kit Build'}
                  </Badge>
                </div>
              </div>

              {/* 2-Column Layout for Model Details */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                {/* Left Column */}
                <div>
                  <p className="text-sm font-mono text-gray-500 dark:text-gray-400">Chassis</p>
                  <p className="font-mono text-gray-900 dark:text-white text-sm">
                    {model.chassis || "Not specified"}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-mono text-gray-500 dark:text-gray-400">Release Year</p>
                  <p className="font-mono text-gray-900 dark:text-white text-sm">
                    {model.releaseYear || "Unknown"}
                  </p>
                </div>

                {model.scale && (
                  <div>
                    <p className="text-sm font-mono text-gray-500 dark:text-gray-400">Scale</p>
                    <p className="font-mono text-gray-900 dark:text-white text-sm">
                      {model.scale}
                    </p>
                  </div>
                )}
                
                {model.driveType && (
                  <div>
                    <p className="text-sm font-mono text-gray-500 dark:text-gray-400">Drive Type</p>
                    <p className="font-mono text-gray-900 dark:text-white text-sm">
                      {model.driveType}
                    </p>
                  </div>
                )}
                
                {model.chassisMaterial && (
                  <div>
                    <p className="text-sm font-mono text-gray-500 dark:text-gray-400">Chassis Material</p>
                    <p className="font-mono text-gray-900 dark:text-white text-sm">
                      {model.chassisMaterial}
                    </p>
                  </div>
                )}
                
                {model.differentialType && (
                  <div>
                    <p className="text-sm font-mono text-gray-500 dark:text-gray-400">Differential Type</p>
                    <p className="font-mono text-gray-900 dark:text-white text-sm">
                      {model.differentialType}
                    </p>
                  </div>
                )}
                
                {model.motorSize && (
                  <div>
                    <p className="text-sm font-mono text-gray-500 dark:text-gray-400">Motor Size</p>
                    <p className="font-mono text-gray-900 dark:text-white text-sm">
                      {model.motorSize}
                    </p>
                  </div>
                )}
                
                {model.batteryType && (
                  <div>
                    <p className="text-sm font-mono text-gray-500 dark:text-gray-400">Battery Type</p>
                    <p className="font-mono text-gray-900 dark:text-white text-sm">
                      {model.batteryType}
                    </p>
                  </div>
                )}
                
                <div className="col-span-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-mono text-gray-500 dark:text-gray-400">Total Investment</p>
                  <p className="font-mono text-gray-900 dark:text-white font-semibold text-green-600 dark:text-green-400">
                    ${totalInvestment.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Custom Build Body Details */}
              {model.buildType === 'custom' && (
                <div className="space-y-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-mono text-sm font-semibold text-green-800 dark:text-green-200">Body Details</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {model.bodyName && (
                      <div>
                        <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mb-1">Body Name</p>
                        <p className="font-mono text-gray-900 dark:text-white text-sm font-semibold">
                          {model.bodyName}
                        </p>
                      </div>
                    )}
                    
                    {model.bodyItemNumber && (
                      <div>
                        <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mb-1">Body Item Number</p>
                        <p className="font-mono text-gray-900 dark:text-white text-sm">
                          {model.bodyItemNumber}
                        </p>
                      </div>
                    )}
                    
                    {model.bodyManufacturer && (
                      <div>
                        <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mb-1">Body Manufacturer</p>
                        <p className="font-mono text-gray-900 dark:text-white text-sm">
                          {model.bodyManufacturer}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Reference Links and Tags - Side by Side */}
              {((model.tamiyaUrl || model.tamiyaBaseUrl) || (model.tags && model.tags.length > 0)) && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Reference Links */}
                    {(model.tamiyaUrl || model.tamiyaBaseUrl) && (
                      <div>
                        <p className="text-sm font-mono text-gray-500 dark:text-gray-400 mb-2">Reference Links</p>
                        <div className="flex items-center space-x-3">
                          {model.tamiyaUrl && (
                            <a 
                              href={model.tamiyaUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center space-x-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 transition-colors"
                              title="Official Tamiya Product Page"
                            >
                              <div className="w-6 h-6 bg-red-600 text-white rounded flex items-center justify-center text-xs font-bold">
                                T
                              </div>
                              <span className="font-mono text-xs">Tamiya</span>
                            </a>
                          )}
                          
                          {model.tamiyaBaseUrl && (
                            <a 
                              href={model.tamiyaBaseUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
                              title="TamiyaBase Database Entry"
                            >
                              <div className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center text-xs font-bold">
                                TB
                              </div>
                              <span className="font-mono text-xs">TamiyaBase</span>
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Tags */}
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
                  </div>
                </div>
              )}

              {/* Full-width sections */}
              {model.notes && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-mono text-gray-500 dark:text-gray-400 mb-1">Notes</p>
                  <p className="font-mono text-gray-900 dark:text-white text-sm">
                    {model.notes}
                  </p>
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
              <Button 
                className="w-full bg-green-600 hover:bg-green-700 font-mono"
                onClick={() => setLocation(`/models/${model.id}/build-log`)}
              >
                <Wrench className="mr-2 h-4 w-4" />
                Log Progress
              </Button>
              <Button 
                className="w-full bg-orange-600 hover:bg-orange-700 font-mono"
                onClick={() => setIsAddHopUpOpen(true)}
              >
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

      <BoxArtSelector
        modelId={model.id}
        photos={model.photos.map(photo => ({
          ...photo,
          isBoxArt: photo.isBoxArt || false
        }))}
        open={isBoxArtSelectorOpen}
        onOpenChange={setIsBoxArtSelectorOpen}
      />

      <HopUpPartDialog
        modelId={model.id}
        open={isAddHopUpOpen}
        onOpenChange={setIsAddHopUpOpen}
      />

      <BuildLogEntryDialog
        modelId={model.id}
        modelName={model.name}
        open={isAddBuildLogOpen}
        onOpenChange={setIsAddBuildLogOpen}
        nextEntryNumber={(buildLogEntries?.length || 0) + 1}
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
