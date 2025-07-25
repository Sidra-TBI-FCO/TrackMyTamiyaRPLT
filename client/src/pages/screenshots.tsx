import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Download, Smartphone, Monitor, Calendar, Camera, Settings, BarChart3, Wrench, Star } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

// Preview Components
function DashboardPreview() {
  return (
    <div className="bg-background p-4 rounded-lg border text-xs">
      <div className="mb-4">
        <h3 className="font-bold text-red-600 dark:text-blue-400 mb-2">TrackMyTamiya Dashboard</h3>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-red-50 dark:bg-blue-950/50 p-2 rounded text-center">
            <div className="font-bold text-lg">7</div>
            <div className="text-muted-foreground text-xs">Total Models</div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-950/50 p-2 rounded text-center">
            <div className="font-bold text-lg">1</div>
            <div className="text-muted-foreground text-xs">Active Builds</div>
          </div>
          <div className="bg-green-50 dark:bg-green-950/50 p-2 rounded text-center">
            <div className="font-bold text-lg">$450</div>
            <div className="text-muted-foreground text-xs">Investment</div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
            <Star className="h-3 w-3 text-yellow-500" />
            <span className="text-xs">Tamiya TT-02 Rally Car</span>
            <Badge className="ml-auto text-xs bg-yellow-100 text-yellow-800">Building</Badge>
          </div>
          <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
            <Star className="h-3 w-3 text-green-500" />
            <span className="text-xs">Tamiya Sand Rover</span>
            <Badge className="ml-auto text-xs bg-green-100 text-green-800">Built</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModelsPreview() {
  return (
    <div className="bg-background p-4 rounded-lg border text-xs">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-red-600 dark:text-blue-400">My Models</h3>
        <Button size="sm" className="text-xs h-6">Add Model</Button>
      </div>
      <div className="space-y-2">
        <Card className="p-2">
          <div className="flex justify-between items-start">
            <div>
              <div className="font-semibold text-xs">TT-02 Rally Car</div>
              <div className="text-muted-foreground text-xs">Item #58587</div>
              <Badge className="mt-1 text-xs bg-yellow-100 text-yellow-800">Building</Badge>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold">$89.99</div>
              <div className="text-xs text-muted-foreground">4 photos</div>
            </div>
          </div>
        </Card>
        <Card className="p-2">
          <div className="flex justify-between items-start">
            <div>
              <div className="font-semibold text-xs">Sand Rover</div>
              <div className="text-muted-foreground text-xs">Item #58470</div>
              <Badge className="mt-1 text-xs bg-green-100 text-green-800">Built</Badge>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold">$65.99</div>
              <div className="text-xs text-muted-foreground">8 photos</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function PhotoGalleryPreview() {
  return (
    <div className="bg-background p-3 rounded-lg border text-xs max-w-xs mx-auto">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-red-600 dark:text-blue-400">Photo Gallery</h3>
        <Camera className="h-4 w-4" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
          <Camera className="h-6 w-6 text-gray-400" />
        </div>
        <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
          <Camera className="h-6 w-6 text-gray-400" />
        </div>
        <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
          <Camera className="h-6 w-6 text-gray-400" />
        </div>
        <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-xs text-gray-500">
          +5 more
        </div>
      </div>
      <div className="mt-2 text-xs text-muted-foreground">12 photos total</div>
    </div>
  );
}

function BuildLogPreview() {
  return (
    <div className="bg-background p-3 rounded-lg border text-xs max-w-xs mx-auto">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-red-600 dark:text-blue-400">Build Log</h3>
        <Calendar className="h-4 w-4" />
      </div>
      <div className="space-y-2">
        <div className="flex gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
          <div className="w-2 h-2 bg-red-500 rounded-full mt-1 flex-shrink-0"></div>
          <div>
            <div className="font-semibold text-xs">Chassis Assembly</div>
            <div className="text-xs text-muted-foreground">Started motor mount installation</div>
            <div className="text-xs text-muted-foreground">Jan 15, 2025</div>
          </div>
        </div>
        <div className="flex gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
          <div className="w-2 h-2 bg-green-500 rounded-full mt-1 flex-shrink-0"></div>
          <div>
            <div className="font-semibold text-xs">Body Painting</div>
            <div className="text-xs text-muted-foreground">Applied base coat</div>
            <div className="text-xs text-muted-foreground">Jan 12, 2025</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HopUpPartsPreview() {
  return (
    <div className="bg-background p-4 rounded-lg border text-xs">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-red-600 dark:text-blue-400">Hop-Up Parts</h3>
        <Wrench className="h-4 w-4" />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
          <div>
            <div className="font-semibold text-xs">Ball Bearings Set</div>
            <div className="text-muted-foreground text-xs">Metal bearings for smoother operation</div>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold">$24.99</div>
            <Badge className="text-xs bg-green-100 text-green-800">Installed</Badge>
          </div>
        </div>
        <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
          <div>
            <div className="font-semibold text-xs">Aluminum Shock Towers</div>
            <div className="text-muted-foreground text-xs">Lightweight aluminum upgrade</div>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold">$39.99</div>
            <Badge className="text-xs bg-yellow-100 text-yellow-800">Planned</Badge>
          </div>
        </div>
      </div>
      <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950/50 rounded">
        <div className="text-xs font-semibold">Total Investment: $180.45</div>
      </div>
    </div>
  );
}

function MobileExperiencePreview() {
  return (
    <div className="bg-background p-3 rounded-lg border text-xs max-w-xs mx-auto">
      <div className="bg-gray-900 text-white p-2 rounded-t text-center text-xs">TrackMyTamiya</div>
      <div className="border-x border-b p-3">
        <div className="grid grid-cols-3 gap-2 mb-3">
          <Button size="sm" className="text-xs h-8 bg-red-600 text-white">Models</Button>
          <Button size="sm" variant="outline" className="text-xs h-8">Photos</Button>
          <Button size="sm" variant="outline" className="text-xs h-8">Parts</Button>
        </div>
        <div className="space-y-2">
          <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
            <div className="font-semibold text-xs">TT-02 Rally</div>
            <div className="text-xs text-muted-foreground">Building progress: 75%</div>
          </div>
          <div className="text-center text-xs text-muted-foreground mt-3">
            Optimized for mobile use
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Screenshots() {
  const [selectedCategory, setSelectedCategory] = useState<"all" | "mobile" | "desktop">("all");

  const screenshots = [
    {
      title: "Dashboard Overview",
      description: "Main dashboard showing collection statistics and recent activity",
      category: "desktop",
      component: "DashboardPreview"
    },
    {
      title: "Model Management",
      description: "Comprehensive model catalog with filtering and search",
      category: "desktop", 
      component: "ModelsPreview"
    },
    {
      title: "Photo Gallery",
      description: "Organized photo galleries with lightbox viewing",
      category: "mobile",
      component: "PhotoGalleryPreview"
    },
    {
      title: "Build Logging",
      description: "Timeline-based build documentation with voice notes",
      category: "mobile",
      component: "BuildLogPreview"
    },
    {
      title: "Hop-Up Parts",
      description: "Performance parts tracking and cost analysis",
      category: "desktop",
      component: "HopUpPartsPreview"
    },
    {
      title: "Mobile Experience",
      description: "Touch-optimized interface for on-the-go management",
      category: "mobile",
      component: "MobileExperiencePreview"
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
            {filteredScreenshots.map((screenshot, index) => {
              const PreviewComponent = {
                DashboardPreview,
                ModelsPreview,
                PhotoGalleryPreview,
                BuildLogPreview,
                HopUpPartsPreview,
                MobileExperiencePreview
              }[screenshot.component];

              return (
                <div key={index} className="group">
                  <div className="relative overflow-hidden rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-blue-600 transition-colors">
                    <div className="aspect-[4/3] bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
                      {PreviewComponent && <PreviewComponent />}
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
              );
            })}
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
            <Link href="/auth">
              <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white">
                Get Started
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