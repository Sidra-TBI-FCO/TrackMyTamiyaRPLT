import { Card } from "@/components/ui/card";
import { Images, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function PhotoFrame() {
  const [, setLocation] = useLocation();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card className="p-12">
        <div className="text-center">
          <div className="text-gray-400 dark:text-gray-500 mb-6">
            <Images className="h-16 w-16 mx-auto mb-4" />
            <h2 className="text-xl font-mono font-semibold text-gray-900 dark:text-white mb-2">
              Photo Frame Mode
            </h2>
            <p className="font-mono text-gray-500 dark:text-gray-400 mb-6">
              Full-screen slideshow of your RC car photos. Perfect for tablets and displays.
            </p>
            <div className="space-y-4">
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white font-mono mr-4"
                disabled
              >
                <Play className="mr-2 h-4 w-4" />
                Start Slideshow (Coming Soon)
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation("/")}
                className="font-mono"
              >
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
