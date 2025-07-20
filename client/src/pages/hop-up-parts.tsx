import { Card } from "@/components/ui/card";
import { Cog } from "lucide-react";

export default function HopUpParts() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card className="p-12">
        <div className="text-center">
          <div className="text-gray-400 dark:text-gray-500 mb-6">
            <Cog className="h-16 w-16 mx-auto mb-4" />
            <h2 className="text-xl font-mono font-semibold text-gray-900 dark:text-white mb-2">
              Hop-Up Parts
            </h2>
            <p className="font-mono text-gray-500 dark:text-gray-400">
              This feature is coming soon. Track your performance upgrades and modifications.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
