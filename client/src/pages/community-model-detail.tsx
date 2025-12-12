import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Camera, Cog, Play, User, Calendar, ExternalLink } from "lucide-react";
import { useState } from "react";
import { addStorageFallbackParam } from "@/lib/file-utils";
import PhotoSlideshow from "@/components/photos/photo-slideshow";

interface Photo {
  id: number;
  url: string;
  caption: string | null;
  isBoxArt: boolean | null;
}

interface HopUp {
  id: number;
  name: string;
  category: string | null;
  brand: string | null;
  partNumber: string | null;
  isInstalled: boolean | null;
}

interface SharedModelOwner {
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

interface SharedModel {
  id: number;
  name: string;
  itemNumber: string;
  chassis: string | null;
  buildStatus: string;
  scale: string | null;
  releaseYear: number | null;
  driveType: string | null;
  chassisMaterial: string | null;
  differentialType: string | null;
  motorSize: string | null;
  batteryType: string | null;
  tags: string[] | null;
  notes: string | null;
  tamiyaUrl: string | null;
  tamiyaBaseUrl: string | null;
  buildType: string | null;
  bodyName: string | null;
  publicSlug: string | null;
  photos: Photo[];
  hopUpCount: number;
  owner: SharedModelOwner;
}

export default function CommunityModelDetailPage() {
  const { slug } = useParams();
  const [isSlideshowOpen, setIsSlideshowOpen] = useState(false);
  const [slideshowStartIndex, setSlideshowStartIndex] = useState(0);

  const { data: model, isLoading, error } = useQuery<SharedModel>({
    queryKey: ["/api/community/models", slug],
    enabled: !!slug,
  });

  const { data: hopUps } = useQuery<HopUp[]>({
    queryKey: [`/api/community/models/${slug}/hopups`],
    enabled: !!slug,
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

  const handlePhotoClick = (photoId: number) => {
    const index = model?.photos.findIndex(p => p.id === photoId) ?? 0;
    setSlideshowStartIndex(index);
    setIsSlideshowOpen(true);
  };

  if (isLoading) {
    return (
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="mb-6 flex items-center space-x-4">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Skeleton className="h-64 lg:h-96 w-full rounded-lg" />
          </div>
          <div>
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !model) {
    return (
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Card className="p-12">
          <div className="text-center">
            <h2 className="text-xl font-mono font-semibold text-gray-900 dark:text-white mb-2">
              Model Not Found
            </h2>
            <p className="font-mono text-gray-500 dark:text-gray-400 mb-4">
              This model may have been removed or is no longer shared.
            </p>
            <Link href="/community">
              <Button className="font-mono">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Community
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const boxArtPhoto = model.photos.find(p => p.isBoxArt) || model.photos[0];
  const otherPhotos = model.photos.filter(p => p.id !== boxArtPhoto?.id);

  const slideshowPhotos = model.photos.map(photo => ({
    ...photo,
    modelId: model.id,
    isBoxArt: photo.isBoxArt || false,
    model: {
      id: model.id,
      name: model.name,
      chassisType: model.chassis,
      tags: model.tags || []
    }
  }));

  return (
    <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link href="/community">
            <Button variant="ghost" className="flex items-center space-x-2 font-mono">
              <ArrowLeft className="h-4 w-4" />
              <span>Community</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-mono font-bold text-gray-900 dark:text-white">
              {model.buildType === 'custom' && model.bodyName ? model.bodyName : model.name}
            </h1>
            <p className="text-sm font-mono text-gray-500 dark:text-gray-400">
              Item #{model.itemNumber}
            </p>
          </div>
        </div>
        <Badge className={`font-mono ${getStatusColor(model.buildStatus)}`}>
          {model.buildStatus.charAt(0).toUpperCase() + model.buildStatus.slice(1)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-0 relative">
              {boxArtPhoto ? (
                <img
                  src={addStorageFallbackParam(boxArtPhoto.url)}
                  alt={model.name}
                  className="w-full h-64 lg:h-96 object-cover rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
                  onClick={() => handlePhotoClick(boxArtPhoto.id)}
                />
              ) : (
                <div className="w-full h-64 lg:h-96 bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded-lg">
                  <Camera className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </CardContent>
          </Card>

          {model.photos.length > 1 && (
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-mono font-semibold text-gray-900 dark:text-white">
                Photos ({model.photos.length})
              </h3>
              <Button variant="outline" onClick={() => setIsSlideshowOpen(true)} className="font-mono">
                <Play className="h-4 w-4 mr-2" />
                Slideshow
              </Button>
            </div>
          )}

          {otherPhotos.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {otherPhotos.map((photo) => (
                <Card key={photo.id} className="overflow-hidden cursor-pointer group">
                  <img
                    src={addStorageFallbackParam(photo.url)}
                    alt={photo.caption || "Model photo"}
                    className="w-full h-32 object-cover group-hover:scale-105 transition-transform"
                    onClick={() => handlePhotoClick(photo.id)}
                  />
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
          )}

          {hopUps && hopUps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="font-mono text-lg flex items-center gap-2">
                  <Cog className="h-5 w-5" />
                  Hop-Up Parts ({hopUps.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {hopUps.map((part) => (
                    <div key={part.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <div>
                        <p className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                          {part.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {part.brand && (
                            <span className="text-xs font-mono text-gray-500">{part.brand}</span>
                          )}
                          {part.category && (
                            <Badge variant="outline" className="text-xs font-mono">
                              {part.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {part.isInstalled && (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 font-mono text-xs">
                          Installed
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-mono text-lg">Model Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {model.buildType && (
                <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-mono text-gray-500">Build Type</p>
                  <Badge className={`font-mono text-xs ${
                    model.buildType === 'custom' 
                      ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200' 
                      : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                  }`}>
                    {model.buildType === 'custom' ? 'Custom Build' : 'Kit Build'}
                  </Badge>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {model.chassis && (
                  <div>
                    <p className="text-sm font-mono text-gray-500">Chassis</p>
                    <p className="font-mono text-gray-900 dark:text-white text-sm">{model.chassis}</p>
                  </div>
                )}
                {model.releaseYear && (
                  <div>
                    <p className="text-sm font-mono text-gray-500">Release Year</p>
                    <p className="font-mono text-gray-900 dark:text-white text-sm">{model.releaseYear}</p>
                  </div>
                )}
                {model.scale && (
                  <div>
                    <p className="text-sm font-mono text-gray-500">Scale</p>
                    <p className="font-mono text-gray-900 dark:text-white text-sm">{model.scale}</p>
                  </div>
                )}
                {model.driveType && (
                  <div>
                    <p className="text-sm font-mono text-gray-500">Drive Type</p>
                    <p className="font-mono text-gray-900 dark:text-white text-sm">{model.driveType}</p>
                  </div>
                )}
                {model.chassisMaterial && (
                  <div>
                    <p className="text-sm font-mono text-gray-500">Chassis Material</p>
                    <p className="font-mono text-gray-900 dark:text-white text-sm">{model.chassisMaterial}</p>
                  </div>
                )}
                {model.differentialType && (
                  <div>
                    <p className="text-sm font-mono text-gray-500">Differential</p>
                    <p className="font-mono text-gray-900 dark:text-white text-sm">{model.differentialType}</p>
                  </div>
                )}
                {model.motorSize && (
                  <div>
                    <p className="text-sm font-mono text-gray-500">Motor</p>
                    <p className="font-mono text-gray-900 dark:text-white text-sm">{model.motorSize}</p>
                  </div>
                )}
                {model.batteryType && (
                  <div>
                    <p className="text-sm font-mono text-gray-500">Battery</p>
                    <p className="font-mono text-gray-900 dark:text-white text-sm">{model.batteryType}</p>
                  </div>
                )}
              </div>

              {(model.tamiyaUrl || model.tamiyaBaseUrl) && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-mono text-gray-500 mb-2">Reference Links</p>
                  <div className="flex items-center space-x-3">
                    {model.tamiyaUrl && (
                      <a 
                        href={model.tamiyaUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 text-red-600 dark:text-red-400 hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span className="font-mono text-xs">Tamiya</span>
                      </a>
                    )}
                    {model.tamiyaBaseUrl && (
                      <a 
                        href={model.tamiyaBaseUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span className="font-mono text-xs">TamiyaBase</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {model.tags && model.tags.length > 0 && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-mono text-gray-500 mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {model.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="font-mono text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {model.notes && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-mono text-gray-500 mb-1">Notes</p>
                  <p className="font-mono text-gray-900 dark:text-white text-sm">{model.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-mono text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Shared By
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <span className="font-mono text-lg">
                    {model.owner.firstName?.[0] || '?'}
                  </span>
                </div>
                <div>
                  <p className="font-mono font-medium text-gray-900 dark:text-white">
                    {model.owner.firstName} {model.owner.lastName}
                  </p>
                  <p className="text-xs font-mono text-gray-500 dark:text-gray-400">
                    TrackMyRC Member
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {slideshowPhotos.length > 0 && (
        <PhotoSlideshow
          photos={slideshowPhotos}
          isOpen={isSlideshowOpen}
          onClose={() => setIsSlideshowOpen(false)}
          initialIndex={slideshowStartIndex}
        />
      )}
    </div>
  );
}
