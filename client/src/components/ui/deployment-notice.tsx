import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default function DeploymentNotice() {
  // Only show in production deployments
  if (import.meta.env.DEV) return null;

  return (
    <Alert className="mb-6 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
      <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
      <AlertDescription className="text-orange-800 dark:text-orange-200 font-mono text-sm">
        <strong>Deployment Demo Notice:</strong> Photos are stored temporarily in this demo environment. 
        They will reset when the app restarts. In a production setup, persistent cloud storage 
        (AWS S3, Cloudinary, Supabase) would be configured to maintain uploaded files permanently.
      </AlertDescription>
    </Alert>
  );
}