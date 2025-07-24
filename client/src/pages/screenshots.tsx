import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Download, Smartphone, Monitor } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

export default function Screenshots() {
  const [selectedCategory, setSelectedCategory] = useState<"all" | "mobile" | "desktop">("all");

  const screenshots = [
    {
      title: "Dashboard Overview",
      description: "Main dashboard showing collection statistics and recent activity",
      category: "desktop",
      url: "/screenshots/dashboard.png"
    },
    {
      title: "Model Management",
      description: "Comprehensive model catalog with filtering and search",
      category: "desktop", 
      url: "/screenshots/models.png"
    },
    {
      title: "Photo Gallery",
      description: "Organized photo galleries with lightbox viewing",
      category: "mobile",
      url: "/screenshots/gallery.png"
    },
    {
      title: "Build Logging",
      description: "Timeline-based build documentation with voice notes",
      category: "mobile",
      url: "/screenshots/build-log.png"
    },
    {
      title: "Hop-Up Parts",
      description: "Performance parts tracking and cost analysis",
      category: "desktop",
      url: "/screenshots/hop-up.png"
    },
    {
      title: "Mobile Experience",
      description: "Touch-optimized interface for on-the-go management",
      category: "mobile",
      url: "/screenshots/mobile.png"
    }
  ];

  const filteredScreenshots = selectedCategory === "all" 
    ? screenshots 
    : screenshots.filter(s => s.category === selectedCategory);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-r from-red-600 to-red-700 text-white py-16">
        <div className="container mx-auto px-4">
          <Link href="/features">
            <Button variant="ghost" className="mb-4 text-white hover:bg-white/20">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Features
            </Button>
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            App Screenshots
          </h1>
          <p className="text-xl opacity-90 max-w-3xl">
            See TrackMyTamiya in action across desktop and mobile devices. 
            Explore the intuitive interface and powerful features.
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => setSelectedCategory("all")}
            >
              All Screenshots
            </Button>
            <Button
              variant={selectedCategory === "desktop" ? "default" : "outline"}
              onClick={() => setSelectedCategory("desktop")}
            >
              <Monitor className="mr-2 h-4 w-4" />
              Desktop
            </Button>
            <Button
              variant={selectedCategory === "mobile" ? "default" : "outline"}
              onClick={() => setSelectedCategory("mobile")}
            >
              <Smartphone className="mr-2 h-4 w-4" />
              Mobile
            </Button>
          </div>
        </div>
      </section>

      {/* Screenshots Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredScreenshots.map((screenshot, index) => (
              <div key={index} className="group">
                <div className="relative overflow-hidden rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-blue-600 transition-colors">
                  <div className="aspect-[4/3] bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <div className="text-center p-8">
                      <div className="text-muted-foreground text-sm mb-2">
                        {screenshot.category === "mobile" ? "📱" : "💻"} {screenshot.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Screenshot coming soon
                      </div>
                    </div>
                  </div>
                  <Badge 
                    className={`absolute top-3 right-3 ${
                      screenshot.category === "mobile" 
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
                        : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                    }`}
                  >
                    {screenshot.category === "mobile" ? "Mobile" : "Desktop"}
                  </Badge>
                </div>
                <div className="mt-4">
                  <h3 className="font-semibold text-lg mb-2">{screenshot.title}</h3>
                  <p className="text-sm text-muted-foreground">{screenshot.description}</p>
                </div>
              </div>
            ))}
          </div>

          {filteredScreenshots.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No screenshots found for the selected category.</p>
            </div>
          )}
        </div>
      </section>

      {/* Features Highlight */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Key Interface Features
          </h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            TrackMyTamiya is designed with user experience in mind, featuring intuitive 
            navigation and responsive design principles.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-red-100 dark:bg-blue-900/20 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Smartphone className="h-6 w-6 text-red-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold mb-2">Mobile First</h3>
              <p className="text-sm text-muted-foreground">
                Optimized for touch devices with responsive layouts
              </p>
            </div>
            <div className="text-center">
              <div className="bg-red-100 dark:bg-blue-900/20 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Monitor className="h-6 w-6 text-red-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold mb-2">Desktop Power</h3>
              <p className="text-sm text-muted-foreground">
                Full-featured desktop experience for detailed management
              </p>
            </div>
            <div className="text-center">
              <div className="bg-red-100 dark:bg-blue-900/20 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-red-600 dark:text-blue-400 font-bold">🌙</span>
              </div>
              <h3 className="font-semibold mb-2">Dark Mode</h3>
              <p className="text-sm text-muted-foreground">
                Eye-friendly dark theme for comfortable viewing
              </p>
            </div>
            <div className="text-center">
              <div className="bg-red-100 dark:bg-blue-900/20 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-red-600 dark:text-blue-400 font-bold">⚡</span>
              </div>
              <h3 className="font-semibold mb-2">Fast & Smooth</h3>
              <p className="text-sm text-muted-foreground">
                Optimized performance with instant loading
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Experience the interface yourself. Start managing your Tamiya collection 
            with our intuitive and powerful tools.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/api/login">
              <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white">
                Access Web App
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/download">
              <Button size="lg" variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Get Mobile App
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}