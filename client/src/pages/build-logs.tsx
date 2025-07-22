import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench } from "lucide-react";

export default function BuildLogs() {
  return (
    <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4 overflow-x-hidden">
      <div className="lg:flex lg:gap-8">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block lg:w-80 lg:flex-shrink-0">
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-mono">Build Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="font-mono text-sm">Active Builds:</span>
                <span className="font-mono font-semibold text-yellow-600 dark:text-yellow-400">0</span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono text-sm">Completed:</span>
                <span className="font-mono text-green-600 dark:text-green-400">0</span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono text-sm">Total Logs:</span>
                <span className="font-mono font-semibold">0</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-mono">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="font-mono text-sm text-gray-600 dark:text-gray-400">
                Coming soon: Voice recording, photo documentation, and build progress tracking
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="mb-4">
            <h1 className="text-2xl font-mono font-bold text-gray-900 dark:text-white">
              Build Logs
            </h1>
          </div>

          <Card className="p-12">
            <div className="text-center">
              <div className="text-gray-400 dark:text-gray-500 mb-6">
                <Wrench className="h-16 w-16 mx-auto mb-4" />
                <h2 className="text-xl font-mono font-semibold text-gray-900 dark:text-white mb-2">
                  Build Documentation
                </h2>
                <p className="font-mono text-gray-500 dark:text-gray-400">
                  This feature is coming soon. Track your build progress with voice notes and photos.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
