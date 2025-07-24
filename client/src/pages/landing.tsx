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
              <Link href="/api/login">
                <Button size="lg" className="bg-red-600 hover:bg-red-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white">
                  Quick Login (Replit)
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/auth">
                <Button size="lg" variant="outline" className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-600">
                  Create Account
                </Button>
              </Link>
              <Link href="/features">
                <Button size="lg" variant="ghost">
                  Explore Features
                </Button>
              </Link>
            </div>
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
          <Link href="/api/login">
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