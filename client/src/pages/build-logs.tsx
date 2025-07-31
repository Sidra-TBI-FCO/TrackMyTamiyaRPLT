import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Wrench, ArrowLeft, Calendar, Camera, Edit, Trash2, ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import BuildLogList from "@/components/build-log/build-log-list";
import { ModelWithRelations, BuildLogEntryWithPhotos } from "@/types";
import { format } from "date-fns";
import { useState } from "react";
import { exportBuildLogsToPDF } from "@/lib/export-utils";
import { toast } from "@/hooks/use-toast";

export default function BuildLogs() {
  const params = useParams();
  const modelId = params.modelId ? parseInt(params.modelId) : null;
  const [searchTerm, setSearchTerm] = useState("");

  const { data: model, isLoading: modelLoading } = useQuery<ModelWithRelations>({
    queryKey: ["/api/models", modelId?.toString()],
    enabled: !!modelId,
  });

  const { data: allEntries, isLoading: entriesLoading } = useQuery<(BuildLogEntryWithPhotos & { model: { id: number; name: string } })[]>({
    queryKey: ["/api/build-log-entries"],
    enabled: !modelId, // Only fetch when not viewing a specific model
  });

  // Filter entries by search term
  const filteredEntries = allEntries?.filter(entry =>
    entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.model.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleExportPDF = () => {
    if (!filteredEntries || filteredEntries.length === 0) {
      toast({
        title: "No data to export",
        description: "You don't have any build log entries to export yet.",
        variant: "destructive",
      });
      return;
    }
    
    exportBuildLogsToPDF(filteredEntries);
    toast({
      title: "Export completed",
      description: "Build logs have been exported to PDF file.",
    });
  };

  if (modelId && model) {
    // Show specific model's build log
    return (
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4 overflow-x-hidden">
        {/* Mobile Back Button */}
        <div className="mb-4 lg:hidden">
          <Link href="/models">
            <Button variant="ghost" className="font-mono">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Models
            </Button>
          </Link>
        </div>

        {/* Desktop Breadcrumb */}
        <div className="hidden lg:block mb-6">
          <nav className="flex items-center space-x-2 text-sm font-mono">
            <Link href="/models" className="text-red-600 hover:text-red-700">
              Models
            </Link>
            <span className="text-gray-400">/</span>
            <Link href={`/models/${model.id}`} className="text-red-600 hover:text-red-700">
              {model.name}
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-600 dark:text-gray-400">Build Log</span>
          </nav>
        </div>

        <BuildLogList modelId={modelId} modelName={model.name} />
      </div>
    );
  }

  // Show all build log entries across models
  return (
    <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4 overflow-x-hidden">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="text-white p-3 rounded-lg" style={{backgroundColor: 'var(--theme-primary)'}}>
              <Wrench className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-mono font-bold text-gray-900 dark:text-white">
                All Build Logs
              </h1>
              <p className="text-gray-500 dark:text-gray-400 font-mono">
                View build progress across all your models
              </p>
            </div>
          </div>
          <Button 
            onClick={handleExportPDF}
            variant="outline" 
            className="font-mono"
          >
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>

        {/* Search */}
        <div className="w-full max-w-md">
          <Input
            placeholder="Search build logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="font-mono"
          />
        </div>

        {/* Loading state */}
        {entriesLoading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!entriesLoading && (!allEntries || allEntries.length === 0) && (
          <Card className="p-12">
            <div className="text-center">
              <div className="text-white p-3 rounded-lg mx-auto w-fit mb-4" style={{backgroundColor: 'var(--theme-primary)'}}>
                <Wrench className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-mono font-semibold text-gray-900 dark:text-white mb-2">
                No Build Log Entries
              </h2>
              <p className="font-mono text-gray-500 dark:text-gray-400 mb-6">
                Start documenting your builds by adding entries to your model collections.
              </p>
              <Link href="/models">
                <Button style={{backgroundColor: 'var(--theme-primary)'}} className="text-white font-mono">
                  Browse Models
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Filtered Empty State */}
        {!entriesLoading && allEntries && allEntries.length > 0 && filteredEntries.length === 0 && (
          <Card className="p-12">
            <div className="text-center">
              <div className="text-white p-3 rounded-lg mx-auto w-fit mb-4" style={{backgroundColor: 'var(--theme-primary)'}}>
                <Wrench className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-mono font-semibold text-gray-900 dark:text-white mb-2">
                No Matching Entries
              </h2>
              <p className="font-mono text-gray-500 dark:text-gray-400 mb-6">
                No build log entries match your search criteria.
              </p>
            </div>
          </Card>
        )}

        {/* Build Log Entries */}
        {!entriesLoading && filteredEntries.length > 0 && (
          <div className="space-y-4">
            {filteredEntries.map((entry) => (
              <Card key={entry.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="p-4 sm:p-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="font-mono text-xs">
                            Entry #{entry.entryNumber}
                          </Badge>
                          <Link href={`/models/${entry.model.id}`}>
                            <Badge 
                              variant="secondary" 
                              className="font-mono text-xs hover:bg-red-100 hover:text-red-700 cursor-pointer"
                            >
                              {entry.model.name}
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </Badge>
                          </Link>
                        </div>
                        <h3 className="text-lg font-mono font-semibold text-gray-900 dark:text-white">
                          {entry.title}
                        </h3>
                        {entry.content && (
                          <p className="text-gray-600 dark:text-gray-400 font-mono text-sm mt-2 line-clamp-3">
                            {entry.content}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-sm font-mono text-gray-500 dark:text-gray-400">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(entry.entryDate), "MMM d, yyyy")}
                      </div>
                    </div>

                    {/* Photos */}
                    {entry.photos && entry.photos.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Camera className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
                            {entry.photos.length} photo{entry.photos.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {entry.photos.slice(0, 4).map((photoLink, index) => (
                            <div key={`${index}`} className="flex-shrink-0">
                              <img
                                src={photoLink.photo.url}
                                alt={photoLink.photo.caption || 'Build log photo'}
                                className="w-16 h-16 object-cover rounded border"
                              />
                            </div>
                          ))}
                          {entry.photos.length > 4 && (
                            <div className="flex-shrink-0 w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded border flex items-center justify-center">
                              <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                                +{entry.photos.length - 4}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end">
                      <Link href={`/models/${entry.model.id}/build-log`}>
                        <Button variant="ghost" size="sm" className="font-mono">
                          View Model Log
                          <ExternalLink className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Filtered Empty State */}
        {!entriesLoading && allEntries && allEntries.length > 0 && filteredEntries.length === 0 && (
          <Card className="p-8">
            <div className="text-center">
              <p className="font-mono text-gray-500 dark:text-gray-400">
                No build log entries match your search.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
