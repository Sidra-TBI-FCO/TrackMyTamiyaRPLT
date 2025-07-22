import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cog } from "lucide-react";

export default function HopUpParts() {
  return (
    <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4 overflow-x-hidden">
      <div className="lg:flex lg:gap-8">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block lg:w-80 lg:flex-shrink-0">
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-mono">Parts Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="font-mono text-sm">Total Parts:</span>
                <span className="font-mono font-semibold">0</span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono text-sm">Installed:</span>
                <span className="font-mono text-green-600 dark:text-green-400">0</span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono text-sm">Planned:</span>
                <span className="font-mono text-blue-600 dark:text-blue-400">0</span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono text-sm">Investment:</span>
                <span className="font-mono font-semibold">$0.00</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-mono">Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="font-mono text-sm text-gray-600 dark:text-gray-400">
                Coming soon: Engine tuning, suspension, drivetrain, electronics
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="mb-4">
            <h1 className="text-2xl font-mono font-bold text-gray-900 dark:text-white">
              Hop-Up Parts
            </h1>
          </div>

          <Card className="p-12">
            <div className="text-center">
              <div className="text-gray-400 dark:text-gray-500 mb-6">
                <Cog className="h-16 w-16 mx-auto mb-4" />
                <h2 className="text-xl font-mono font-semibold text-gray-900 dark:text-white mb-2">
                  Performance Upgrades
                </h2>
                <p className="font-mono text-gray-500 dark:text-gray-400">
                  This feature is coming soon. Track your performance upgrades and modifications.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
