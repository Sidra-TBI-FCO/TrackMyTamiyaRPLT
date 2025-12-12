import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Camera, Cog, ArrowRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { addStorageFallbackParam } from "@/lib/file-utils";

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
  publicSlug: string | null;
  photos: Array<{ id: number; url: string; isBoxArt: boolean | null }>;
  hopUpCount: number;
  owner: SharedModelOwner;
}

export default function CommunityPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: models, isLoading, error } = useQuery<SharedModel[]>({
    queryKey: ["/api/community/models"],
  });

  const filteredModels = models?.filter(model => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      model.name.toLowerCase().includes(search) ||
      model.itemNumber.toLowerCase().includes(search) ||
      model.chassis?.toLowerCase().includes(search) ||
      `${model.owner.firstName} ${model.owner.lastName}`.toLowerCase().includes(search)
    );
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

  const getBoxArtUrl = (model: SharedModel) => {
    const boxArt = model.photos.find(p => p.isBoxArt);
    return boxArt?.url || model.photos[0]?.url;
  };

  return (
    <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="text-white p-3 rounded-lg" style={{ backgroundColor: 'var(--theme-primary)' }}>
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-mono font-bold text-gray-900 dark:text-white">
              Community Gallery
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-mono">
              Explore RC models shared by the TrackMyRC community
            </p>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search models, owners, chassis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 font-mono"
            data-testid="input-community-search"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i}>
              <Skeleton className="h-48 w-full" />
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="p-12">
          <div className="text-center">
            <h2 className="text-xl font-mono font-semibold text-gray-900 dark:text-white mb-2">
              Unable to Load Community Models
            </h2>
            <p className="font-mono text-gray-500 dark:text-gray-400">
              Please try again later.
            </p>
          </div>
        </Card>
      ) : filteredModels && filteredModels.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredModels.map((model) => (
            <Link 
              key={model.id} 
              href={`/community/models/${model.publicSlug}`}
              className="block group"
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full" data-testid={`card-community-model-${model.id}`}>
                {getBoxArtUrl(model) ? (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={addStorageFallbackParam(getBoxArtUrl(model)!)}
                      alt={model.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3">
                      <Badge className={`font-mono text-xs ${getStatusColor(model.buildStatus)}`}>
                        {model.buildStatus.charAt(0).toUpperCase() + model.buildStatus.slice(1)}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <Camera className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                  </div>
                )}
                
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-mono font-semibold text-gray-900 dark:text-white line-clamp-1 group-hover:text-[var(--theme-primary)] transition-colors">
                      {model.name}
                    </h3>
                    <p className="text-sm font-mono text-gray-500 dark:text-gray-400">
                      Item #{model.itemNumber}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <Camera className="h-3.5 w-3.5" />
                      <span className="font-mono">{model.photos.length}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <Cog className="h-3.5 w-3.5" />
                      <span className="font-mono">{model.hopUpCount}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-mono">
                        {model.owner.firstName?.[0] || '?'}
                      </div>
                      <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
                        {model.owner.firstName} {model.owner.lastName?.[0]}.
                      </span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-[var(--theme-primary)] group-hover:translate-x-1 transition-all" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="p-12">
          <div className="text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-mono font-semibold text-gray-900 dark:text-white mb-2">
              {searchQuery ? "No Models Found" : "No Shared Models Yet"}
            </h2>
            <p className="font-mono text-gray-500 dark:text-gray-400 mb-4">
              {searchQuery 
                ? "Try adjusting your search terms."
                : "Be the first to share your RC models with the community!"
              }
            </p>
            {!searchQuery && (
              <p className="text-sm font-mono text-gray-400 dark:text-gray-500">
                Go to any model in your collection and enable sharing to show it here.
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
