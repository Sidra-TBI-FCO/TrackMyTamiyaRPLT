import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Calendar, Camera, FileText, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import BuildLogEntryDialog from "./build-log-entry-dialog";
import BuildLogEntry from "./build-log-entry";
import { BuildLogEntryWithPhotos } from "@shared/schema";
import { format } from "date-fns";
import { exportBuildLogsToPDF } from "@/lib/export-utils";
import { toast } from "@/hooks/use-toast";

interface BuildLogListProps {
  modelId: number;
  modelName: string;
}

export default function BuildLogList({ modelId, modelName }: BuildLogListProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: entries, isLoading } = useQuery<BuildLogEntryWithPhotos[]>({
    queryKey: [`/api/models/${modelId}/build-log-entries`],
  });

  const nextEntryNumber = (entries?.length || 0) + 1;

  const filteredEntries = entries?.filter(entry =>
    entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.content?.toLowerCase().includes(searchTerm.toLowerCase())
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
    
    // Transform entries to match the expected format for export
    const entriesWithModel = filteredEntries.map(entry => ({
      ...entry,
      model: { id: modelId, name: modelName }
    }));
    
    exportBuildLogsToPDF(entriesWithModel);
    toast({
      title: "Export completed",
      description: `Build logs for ${modelName} have been exported to PDF file.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header - Mobile & Desktop */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-mono font-bold text-gray-900 dark:text-white">
            Build Log
          </h1>
          <p className="text-sm font-mono text-gray-500 dark:text-gray-400 mt-1">
            {modelName} • {entries?.length || 0} entries
          </p>
        </div>
        
        {/* Desktop Buttons */}
        <div className="hidden sm:flex gap-2">
          <Button
            onClick={handleExportPDF}
            variant="outline"
            className="font-mono"
          >
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button
            onClick={() => setShowAddDialog(true)}
            style={{backgroundColor: 'var(--theme-primary)'}}
            className="hover:opacity-90 text-white font-mono"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Entry #{nextEntryNumber}
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Input
          type="text"
          placeholder="Search build log entries..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 font-mono"
        />
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
      </div>

      {/* Mobile Buttons */}
      <div className="sm:hidden flex gap-2">
        <Button
          onClick={handleExportPDF}
          variant="outline"
          className="flex-1 font-mono"
        >
          <FileText className="h-4 w-4 mr-2" />
          Export PDF
        </Button>
        <Button
          onClick={() => setShowAddDialog(true)}
          style={{backgroundColor: 'var(--theme-primary)'}}
          className="flex-1 hover:opacity-90 text-white font-mono"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Entry #{nextEntryNumber}
        </Button>
      </div>

      {/* Build Log Entries */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex space-x-2">
                    <Skeleton className="h-16 w-16 rounded" />
                    <Skeleton className="h-16 w-16 rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredEntries.length > 0 ? (
        <div className="space-y-4">
          {filteredEntries.map((entry) => (
            <BuildLogEntry
              key={entry.id}
              entry={entry}
              onEdit={() => {
                // TODO: Implement edit functionality
                console.log("Edit entry", entry.id);
              }}
              onDelete={() => {
                // TODO: Implement delete functionality
                console.log("Delete entry", entry.id);
              }}
            />
          ))}
        </div>
      ) : entries?.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <div className="text-gray-400 dark:text-gray-500 mb-6">
              <FileText className="h-16 w-16 mx-auto mb-4" />
              <h2 className="text-xl font-mono font-semibold text-gray-900 dark:text-white mb-2">
                No Build Log Entries
              </h2>
              <p className="font-mono text-gray-500 dark:text-gray-400 mb-6">
                Start documenting your build progress with photos and notes.
              </p>
              <Button
                onClick={() => setShowAddDialog(true)}
                className="bg-red-600 hover:bg-red-700 text-white font-mono"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Entry
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-8">
          <div className="text-center">
            <div className="text-gray-400 dark:text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-3" />
              <p className="font-mono text-gray-500 dark:text-gray-400">
                No entries found matching "{searchTerm}"
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Add Entry Dialog */}
      <BuildLogEntryDialog
        modelId={modelId}
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        nextEntryNumber={nextEntryNumber}
      />
    </div>
  );
}