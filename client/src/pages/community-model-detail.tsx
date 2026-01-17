import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Camera, Cog, Play, User, Calendar, ExternalLink, Wrench, MessageSquare, Send, Trash2 } from "lucide-react";
import { useState } from "react";
import { addStorageFallbackParam } from "@/lib/file-utils";
import PhotoSlideshow from "@/components/photos/photo-slideshow";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

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

interface BuildLogPhoto {
  photo: Photo;
}

interface BuildLogEntry {
  id: number;
  entryNumber: number;
  title: string;
  content: string | null;
  entryDate: string;
  photos: BuildLogPhoto[];
}

interface CommentUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

interface ModelComment {
  id: number;
  modelId: number;
  userId: string;
  content: string;
  createdAt: string;
  user: CommentUser;
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
  const [newComment, setNewComment] = useState("");
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: model, isLoading, error } = useQuery<SharedModel>({
    queryKey: ["/api/community/models", slug],
    enabled: !!slug,
  });

  const { data: hopUps } = useQuery<HopUp[]>({
    queryKey: [`/api/community/models/${slug}/hopups`],
    enabled: !!slug,
  });

  const { data: buildLogs, isLoading: isLoadingBuildLogs } = useQuery<BuildLogEntry[]>({
    queryKey: [`/api/community/models/${slug}/buildlogs`],
    enabled: !!slug,
  });

  const { data: comments, isLoading: isLoadingComments } = useQuery<ModelComment[]>({
    queryKey: [`/api/community/models/${slug}/comments`],
    enabled: !!slug,
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", `/api/community/models/${slug}/comments`, { content });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/community/models/${slug}/comments`] });
      setNewComment("");
      toast({ title: "Comment added", description: "Your comment has been posted." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to add comment", variant: "destructive" });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      await apiRequest("DELETE", `/api/community/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/community/models/${slug}/comments`] });
      toast({ title: "Comment deleted" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete comment", variant: "destructive" });
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

  const handlePhotoClick = (photoId: number) => {
    const index = model?.photos.findIndex(p => p.id === photoId) ?? 0;
    setSlideshowStartIndex(index);
    setIsSlideshowOpen(true);
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      addCommentMutation.mutate(newComment.trim());
    }
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

  const sortedBuildLogs = buildLogs ? [...buildLogs].sort((a, b) => 
    new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()
  ) : [];

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
        {/* LEFT COLUMN: Box art, Build Log, Comments, Photos */}
        <div className="lg:col-span-2 space-y-6">
          {/* Box Art Photo */}
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

          {/* Build Log */}
          {isLoadingBuildLogs ? (
            <Card>
              <CardHeader>
                <CardTitle className="font-mono text-lg flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Build Log
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-4">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/4" />
                        <Skeleton className="h-16 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : sortedBuildLogs.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="font-mono text-lg flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Build Log ({sortedBuildLogs.length} entries)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {sortedBuildLogs.map((entry, index) => (
                    <div key={entry.id} className="relative">
                      {index < sortedBuildLogs.length - 1 && (
                        <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
                      )}
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-mono text-sm font-bold" style={{ backgroundColor: 'var(--theme-primary)' }}>
                          {entry.entryNumber}
                        </div>
                        <div className="flex-1 pb-6">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-mono font-semibold text-gray-900 dark:text-white">
                              {entry.title}
                            </h4>
                          </div>
                          <p className="text-xs font-mono text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-2">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(entry.entryDate), 'MMM d, yyyy')}
                          </p>
                          {entry.content && (
                            <p className="font-mono text-sm text-gray-700 dark:text-gray-300 mb-3 whitespace-pre-wrap">
                              {entry.content}
                            </p>
                          )}
                          {entry.photos && entry.photos.length > 0 && (
                            <div className="grid grid-cols-3 gap-2">
                              {entry.photos.map((photoLink) => (
                                <div key={photoLink.photo.id} className="aspect-square overflow-hidden rounded">
                                  <img
                                    src={addStorageFallbackParam(photoLink.photo.url)}
                                    alt={photoLink.photo.caption || "Build log photo"}
                                    className="w-full h-full object-cover cursor-pointer hover:opacity-90"
                                    onClick={() => handlePhotoClick(photoLink.photo.id)}
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="font-mono text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Comments ({isLoadingComments ? "..." : comments?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isAuthenticated ? (
                <form onSubmit={handleSubmitComment} className="mb-6">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your thoughts about this build..."
                    className="font-mono mb-2"
                    rows={3}
                    data-testid="input-comment"
                  />
                  <Button 
                    type="submit" 
                    disabled={!newComment.trim() || addCommentMutation.isPending}
                    className="font-mono"
                    style={{ backgroundColor: 'var(--theme-primary)' }}
                    data-testid="button-submit-comment"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {addCommentMutation.isPending ? "Posting..." : "Post Comment"}
                  </Button>
                </form>
              ) : (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg text-center">
                  <p className="font-mono text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Log in to leave a comment
                  </p>
                  <Link href="/auth">
                    <Button variant="outline" className="font-mono">
                      Log In
                    </Button>
                  </Link>
                </div>
              )}

              <div className="space-y-4">
                {comments && comments.length > 0 ? (
                  comments.map((comment) => (
                    <div key={comment.id} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <span className="font-mono text-sm">
                              {comment.user.firstName?.[0] || '?'}
                            </span>
                          </div>
                          <div>
                            <p className="font-mono font-medium text-sm text-gray-900 dark:text-white">
                              {comment.user.firstName} {comment.user.lastName}
                            </p>
                            <p className="text-xs font-mono text-gray-500">
                              {format(new Date(comment.createdAt), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        {user?.id === comment.userId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteCommentMutation.mutate(comment.id)}
                            disabled={deleteCommentMutation.isPending}
                            data-testid={`button-delete-comment-${comment.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                      <p className="font-mono text-sm text-gray-700 dark:text-gray-300 mt-3 whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="font-mono text-sm text-gray-500 text-center py-4">
                    No comments yet. Be the first to share your thoughts!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Photos Section - moved below comments */}
          {otherPhotos.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="font-mono text-lg flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Photos ({model.photos.length})
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setIsSlideshowOpen(true)} className="font-mono">
                    <Play className="h-4 w-4 mr-2" />
                    Slideshow
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                  {otherPhotos.map((photo) => (
                    <div key={photo.id} className="aspect-square overflow-hidden rounded cursor-pointer group">
                      <img
                        src={addStorageFallbackParam(photo.url)}
                        alt={photo.caption || "Model photo"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onClick={() => handlePhotoClick(photo.id)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT COLUMN: Model Details, Installed Parts, Shared By */}
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
                        className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span className="font-mono text-xs">Official</span>
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

          {/* Installed Parts - in right column under Model Details */}
          {hopUps && hopUps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="font-mono text-lg flex items-center gap-2">
                  <Cog className="h-5 w-5" />
                  Installed Parts ({hopUps.filter(p => p.isInstalled).length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {hopUps.filter(p => p.isInstalled).map((part) => (
                    <div key={part.id} className="p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
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
                  ))}
                  {hopUps.filter(p => !p.isInstalled).length > 0 && (
                    <>
                      <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs font-mono text-gray-500 mb-2">Planned ({hopUps.filter(p => !p.isInstalled).length})</p>
                      </div>
                      {hopUps.filter(p => !p.isInstalled).map((part) => (
                        <div key={part.id} className="p-2 bg-gray-50 dark:bg-gray-900 rounded-lg opacity-60">
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
                      ))}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

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
