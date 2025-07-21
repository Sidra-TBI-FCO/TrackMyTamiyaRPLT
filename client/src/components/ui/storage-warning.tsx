import { AlertTriangle, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export default function StorageWarning() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed this warning
    const dismissed = localStorage.getItem('storage-warning-dismissed');
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  const dismissWarning = () => {
    setIsVisible(false);
    localStorage.setItem('storage-warning-dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <Alert className="mb-4 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <div className="flex items-start justify-between">
        <AlertDescription className="text-amber-800 dark:text-amber-200 pr-4">
          <strong>File Storage Notice:</strong> Photos uploaded in one environment may not be visible in another due to separate file storage systems. The database is shared but files are stored locally in each environment.
        </AlertDescription>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={dismissWarning}
          className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
}