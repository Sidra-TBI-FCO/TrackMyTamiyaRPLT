import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Smartphone, Monitor, Camera, Settings, Clock, Database } from "lucide-react";
import { Link } from "wouter";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-red-50 dark:to-blue-950/20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-4 bg-red-100 text-red-800 dark:bg-blue-900/20 dark:text-blue-300">
              RC Collection Management
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Track Your <span className="text-red-600 dark:text-blue-400">Tamiya</span>
              <br />
              <span className="text-gray-600 dark:text-gray-300">RC Collection</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              The ultimate companion for Tamiya RC enthusiasts. Manage your models, track builds, 
              organize photos, and monitor hop-up parts with precision and style.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth">
                <Button size="lg" className="bg-red-600 hover:bg-red-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/screenshots">
                <Button size="lg" variant="outline">
                  View Screenshots
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* App Preview Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              See TrackMyTamiya in Action
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Beautiful, intuitive interface designed for both desktop and mobile devices
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Desktop Preview */}
            <div className="order-2 lg:order-1">
              <div className="relative">
                <div className="bg-gray-900 rounded-t-lg p-3">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-b-lg p-6">
                  <div className="text-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-red-600 dark:text-blue-400">TrackMyTamiya Dashboard</h3>
                      <div className="flex gap-2">
                        <div className="w-8 h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="w-8 h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="bg-red-50 dark:bg-blue-950/50 p-3 rounded text-center">
                        <div className="font-bold text-2xl">7</div>
                        <div className="text-muted-foreground text-xs">Total Models</div>
                      </div>
                      <div className="bg-yellow-50 dark:bg-yellow-950/50 p-3 rounded text-center">
                        <div className="font-bold text-2xl">1</div>
                        <div className="text-muted-foreground text-xs">Active Builds</div>
                      </div>
                      <div className="bg-green-50 dark:bg-green-950/50 p-3 rounded text-center">
                        <div className="font-bold text-2xl">$450</div>
                        <div className="text-muted-foreground text-xs">Investment</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm">Tamiya TT-02 Rally Car</span>
                        <Badge className="ml-auto text-xs bg-yellow-100 text-yellow-800">Building</Badge>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Tamiya Sand Rover</span>
                        <Badge className="ml-auto text-xs bg-green-100 text-green-800">Built</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Desktop Features */}
            <div className="order-1 lg:order-2">
              <h3 className="text-2xl font-bold mb-4">
                <Monitor className="inline mr-2 h-6 w-6 text-red-600 dark:text-blue-400" />
                Desktop Experience
              </h3>
              <p className="text-muted-foreground mb-6">
                Full-featured desktop interface with comprehensive model management, 
                detailed analytics, and advanced photo organization tools.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-600 dark:bg-blue-400 rounded-full"></div>
                  <span>Advanced model cataloging with detailed specifications</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-600 dark:bg-blue-400 rounded-full"></div>
                  <span>Comprehensive build logging with timeline view</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-600 dark:bg-blue-400 rounded-full"></div>
                  <span>Detailed hop-up parts tracking and cost analysis</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center mt-20">
            {/* Mobile Features */}
            <div>
              <h3 className="text-2xl font-bold mb-4">
                <Smartphone className="inline mr-2 h-6 w-6 text-red-600 dark:text-blue-400" />
                Mobile Optimized
              </h3>
              <p className="text-muted-foreground mb-6">
                Touch-optimized mobile interface perfect for on-the-go collection 
                management, quick photo uploads, and build progress tracking.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-600 dark:bg-blue-400 rounded-full"></div>
                  <span>Quick photo capture and upload</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-600 dark:bg-blue-400 rounded-full"></div>
                  <span>Touch-friendly navigation and controls</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-600 dark:bg-blue-400 rounded-full"></div>
                  <span>Offline-capable for garage and field use</span>
                </li>
              </ul>
            </div>
            
            {/* Mobile Preview */}
            <div>
              <div className="max-w-xs mx-auto">
                <div className="bg-gray-900 rounded-t-3xl p-4">
                  <div className="bg-black rounded-2xl p-1">
                    <div className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden">
                      <div className="bg-gray-900 text-white p-2 text-center text-sm font-medium">
                        TrackMyTamiya
                      </div>
                      <div className="p-4">
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          <Button size="sm" className="text-xs h-8 bg-red-600 text-white">Models</Button>
                          <Button size="sm" variant="outline" className="text-xs h-8">Photos</Button>
                          <Button size="sm" variant="outline" className="text-xs h-8">Parts</Button>
                        </div>
                        <div className="space-y-2">
                          <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                            <div className="font-semibold text-sm">TT-02 Rally</div>
                            <div className="text-xs text-muted-foreground">Building progress: 75%</div>
                            <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                              <div className="bg-red-600 h-1 rounded-full w-3/4"></div>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-1">
                            <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                              <Camera className="h-4 w-4 text-gray-400" />
                            </div>
                            <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                              <Camera className="h-4 w-4 text-gray-400" />
                            </div>
                            <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-xs text-gray-500">
                              +5
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-16">
            <Link href="/screenshots">
              <Button size="lg" className="bg-red-600 hover:bg-red-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white">
                View All Screenshots
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Manage Your Collection
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From planning your next build to tracking every hop-up part, TrackMyTamiya 
              provides comprehensive tools for serious RC enthusiasts.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-red-200 dark:hover:border-blue-600 transition-colors">
              <CardHeader>
                <Database className="h-8 w-8 text-red-600 dark:text-blue-400 mb-2" />
                <CardTitle>Model Management</CardTitle>
                <CardDescription>
                  Catalog your entire Tamiya collection with detailed specifications, 
                  build status tracking, and automatic data import from TamiyaBase.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-red-200 dark:hover:border-blue-600 transition-colors">
              <CardHeader>
                <Camera className="h-8 w-8 text-red-600 dark:text-blue-400 mb-2" />
                <CardTitle>Photo Gallery</CardTitle>
                <CardDescription>
                  Organize build photos with captions, set box art images, 
                  and create stunning galleries of your completed models.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-red-200 dark:hover:border-blue-600 transition-colors">
              <CardHeader>
                <Clock className="h-8 w-8 text-red-600 dark:text-blue-400 mb-2" />
                <CardTitle>Build Logging</CardTitle>
                <CardDescription>
                  Document your build process with timeline entries, voice notes, 
                  and photo attachments to track every step of your journey.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-red-200 dark:hover:border-blue-600 transition-colors">
              <CardHeader>
                <Settings className="h-8 w-8 text-red-600 dark:text-blue-400 mb-2" />
                <CardTitle>Hop-Up Parts</CardTitle>
                <CardDescription>
                  Track performance upgrades, installation dates, costs, 
                  and compatibility across your entire collection.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-red-200 dark:hover:border-blue-600 transition-colors">
              <CardHeader>
                <Smartphone className="h-8 w-8 text-red-600 dark:text-blue-400 mb-2" />
                <CardTitle>Mobile Optimized</CardTitle>
                <CardDescription>
                  Responsive design with touch-friendly interfaces, 
                  perfect for managing your collection on the go.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-red-200 dark:hover:border-blue-600 transition-colors">
              <CardHeader>
                <Monitor className="h-8 w-8 text-red-600 dark:text-blue-400 mb-2" />
                <CardTitle>Cross Platform</CardTitle>
                <CardDescription>
                  Access your collection from any device - desktop, tablet, 
                  or mobile with seamless synchronization.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* App Download Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Get the Mobile App
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Take your collection management anywhere with our mobile applications. 
            Available for iOS and Android devices.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-sm text-muted-foreground">
              📱 Mobile apps coming soon
            </div>
            <div className="text-sm text-muted-foreground">
              or use the web app on any device
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-red-600 dark:bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Organize Your Collection?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Join RC enthusiasts who trust TrackMyTamiya to manage their collections. 
            Start tracking your builds today.
          </p>
          <Link href="/auth">
            <Button size="lg" variant="secondary" className="bg-white text-red-600 dark:text-blue-600 hover:bg-gray-100">
              Get Started Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}