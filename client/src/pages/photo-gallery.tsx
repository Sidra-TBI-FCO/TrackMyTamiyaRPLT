import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Camera, Search, Filter, Eye, Download, Trash2, Image } from "lucide-react";
import { ModelWithRelations } from "@/types";
import { format } from "date-fns";
import { useLocation } from "wouter";

interface PhotoWithModel {
  id: number;
  filename: string;
  originalName: string;
  url: string;
  caption?: string;
  isBoxArt: boolean;
  uploadedAt: string;
  fileSize?: string;
  model: {
    id: number;
    name: string;
    itemNumber: string;
  };
}

export default function PhotoGallery() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterModel, setFilterModel] = useState("all");
  const [filterType, setFilterType] = useState("all");

  const { data: models = [], isLoading } = useQuery<ModelWithRelations[]>({
    queryKey: ["/api/models"],
  });

  // Flatten all photos from all models with model information
  const allPhotos: PhotoWithModel[] = models.flatMap(model => 
    (model.photos || []).map(photo => ({
      ...photo,
      model: {
        id: model.id,
        name: model.name,
        itemNumber: model.itemNumber || ""
      }
    }))
  );

  // Calculate stats
  const totalPhotos = allPhotos.length;
  const boxArtPhotos = allPhotos.filter(photo => photo.isBoxArt).length;
  const regularPhotos = totalPhotos - boxArtPhotos;

  // Get unique model names for filter
  const modelNames = Array.from(new Set(allPhotos.map(photo => photo.model.name)));

  // Filter photos
  const filteredPhotos = allPhotos.filter(photo => {
    const matchesSearch = photo.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         photo.caption?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         photo.model.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModel = filterModel === "all" || photo.model.name === filterModel;
    const matchesType = filterType === "all" || 
                       (filterType === "box-art" && photo.isBoxArt) ||
                       (filterType === "regular" && !photo.isBoxArt);
    
    return matchesSearch && matchesModel && matchesType;
  });

  // Format file size
  const formatFileSize = (sizeStr?: string) => {
    if (!sizeStr) return "Unknown";
    const size = parseInt(sizeStr);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-mono font-bold text-gray-900 dark:text-white mb-2">
          Photo Gallery
        </h1>
        <p className="text-gray-600 dark:text-gray-400 font-mono">
          Master collection of all your model photos
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-mono text-gray-500 dark:text-gray-400">Total Photos</p>
                <p className="text-2xl font-mono font-bold text-gray-900 dark:text-white">{totalPhotos}</p>
              </div>
              <Camera className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-mono text-gray-500 dark:text-gray-400">Box Art</p>
                <p className="text-2xl font-mono font-bold text-gray-900 dark:text-white">{boxArtPhotos}</p>
              </div>
              <Image className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-mono text-gray-500 dark:text-gray-400">Regular Photos</p>
                <p className="text-2xl font-mono font-bold text-gray-900 dark:text-white">{regularPhotos}</p>
              </div>
              <Camera className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search photos, captions, or models..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 font-mono"
                />
              </div>
            </div>
            
            <Select value={filterModel} onValueChange={setFilterModel}>
              <SelectTrigger className="w-full sm:w-48 font-mono">
                <SelectValue placeholder="Filter by model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Models</SelectItem>
                {modelNames.map(name => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-48 font-mono">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Photos</SelectItem>
                <SelectItem value="box-art">Box Art Only</SelectItem>
                <SelectItem value="regular">Regular Photos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Photo Table */}
      <Card>
        <CardHeader>
          <CardTitle className="font-mono">
            Photos ({filteredPhotos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPhotos.length === 0 ? (
            <div className="text-center py-12">
              <Camera className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 font-mono">
                {totalPhotos === 0 ? "No photos found" : "No photos match your filters"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Desktop Table */}
              <div className="hidden lg:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left p-3 font-mono text-sm text-gray-500 dark:text-gray-400">Preview</th>
                      <th className="text-left p-3 font-mono text-sm text-gray-500 dark:text-gray-400">Filename</th>
                      <th className="text-left p-3 font-mono text-sm text-gray-500 dark:text-gray-400">Model</th>
                      <th className="text-left p-3 font-mono text-sm text-gray-500 dark:text-gray-400">Type</th>
                      <th className="text-left p-3 font-mono text-sm text-gray-500 dark:text-gray-400">Size</th>
                      <th className="text-left p-3 font-mono text-sm text-gray-500 dark:text-gray-400">Uploaded</th>
                      <th className="text-left p-3 font-mono text-sm text-gray-500 dark:text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPhotos.map((photo) => (
                      <tr key={photo.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="p-3">
                          <img
                            src={photo.url}
                            alt={photo.originalName}
                            className="w-16 h-16 object-cover rounded-lg cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => window.open(photo.url, '_blank')}
                          />
                        </td>
                        <td className="p-3">
                          <div>
                            <p className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                              {photo.originalName}
                            </p>
                            {photo.caption && (
                              <p className="font-mono text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {photo.caption}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <Button
                            variant="link"
                            onClick={() => setLocation(`/models/${photo.model.id}`)}
                            className="font-mono text-sm p-0 h-auto text-blue-600 hover:text-blue-700"
                          >
                            {photo.model.name}
                          </Button>
                          <p className="font-mono text-xs text-gray-500 dark:text-gray-400">
                            #{photo.model.itemNumber}
                          </p>
                        </td>
                        <td className="p-3">
                          {photo.isBoxArt ? (
                            <Badge variant="secondary" className="font-mono text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                              Box Art
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="font-mono text-xs">
                              Photo
                            </Badge>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
                            {formatFileSize(photo.fileSize)}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
                            {format(new Date(photo.uploadedAt), 'MMM d, yyyy')}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(photo.url, '_blank')}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setLocation(`/models/${photo.model.id}`)}
                              className="h-8 w-8 p-0"
                            >
                              <Filter className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-4">
                {filteredPhotos.map((photo) => (
                  <Card key={photo.id} className="p-4">
                    <div className="flex space-x-4">
                      <img
                        src={photo.url}
                        alt={photo.originalName}
                        className="w-20 h-20 object-cover rounded-lg cursor-pointer flex-shrink-0"
                        onClick={() => window.open(photo.url, '_blank')}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-mono text-sm font-medium text-gray-900 dark:text-white truncate">
                            {photo.originalName}
                          </p>
                          {photo.isBoxArt && (
                            <Badge variant="secondary" className="font-mono text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 ml-2 flex-shrink-0">
                              Box Art
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="link"
                          onClick={() => setLocation(`/models/${photo.model.id}`)}
                          className="font-mono text-sm p-0 h-auto text-blue-600 hover:text-blue-700"
                        >
                          {photo.model.name} #{photo.model.itemNumber}
                        </Button>
                        <div className="flex items-center justify-between mt-2">
                          <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                            {formatFileSize(photo.fileSize)} • {format(new Date(photo.uploadedAt), 'MMM d')}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(photo.url, '_blank')}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                        {photo.caption && (
                          <p className="font-mono text-xs text-gray-600 dark:text-gray-400 mt-2">
                            {photo.caption}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}