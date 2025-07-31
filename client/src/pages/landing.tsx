import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Smartphone, Monitor, Camera, Settings, Clock, Database } from "lucide-react";
import { Link } from "wouter";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-4" style={{backgroundColor: 'var(--theme-primary)', color: 'white', opacity: 0.9}}>
              RC Collection Management
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Track Your <span style={{color: 'var(--theme-primary)'}}>RC</span>
              <br />
              <span className="text-gray-600 dark:text-gray-300">Collection</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              The ultimate companion for RC enthusiasts. Manage your models, track builds, 
              organize photos, and monitor hop-up parts with precision and style.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth">
                <Button size="lg" className="text-white" style={{backgroundColor: 'var(--theme-primary)'}}>
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/features">
                <Button size="lg" variant="outline" className="border-primary/20 hover:bg-primary/5" style={{color: 'var(--theme-primary)'}}>
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
              From planning your next build to tracking every hop-up part, TrackMyRC 
              provides comprehensive tools for serious RC enthusiasts.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-primary/30 transition-colors">
              <CardHeader>
                <Database className="h-8 w-8 mb-2" style={{color: 'var(--theme-primary)'}} />
                <CardTitle>Model Management</CardTitle>
                <CardDescription>
                  Catalog your entire RC collection with detailed specifications, 
                  build status tracking, and comprehensive model management.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/30 transition-colors">
              <CardHeader>
                <Camera className="h-8 w-8 mb-2" style={{color: 'var(--theme-primary)'}} />
                <CardTitle>Photo Gallery</CardTitle>
                <CardDescription>
                  Organize build photos with captions, set box art images, 
                  and create stunning galleries of your completed models.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/30 transition-colors">
              <CardHeader>
                <Clock className="h-8 w-8 mb-2" style={{color: 'var(--theme-primary)'}} />
                <CardTitle>Build Logging</CardTitle>
                <CardDescription>
                  Document your build process with timeline entries, voice notes, 
                  and photo attachments to track every step of your journey.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/30 transition-colors">
              <CardHeader>
                <Settings className="h-8 w-8 mb-2" style={{color: 'var(--theme-primary)'}} />
                <CardTitle>Hop-Up Parts</CardTitle>
                <CardDescription>
                  Track performance upgrades, installation dates, costs, 
                  and compatibility across your entire collection.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/30 transition-colors">
              <CardHeader>
                <Smartphone className="h-8 w-8 mb-2" style={{color: 'var(--theme-primary)'}} />
                <CardTitle>Mobile Optimized</CardTitle>
                <CardDescription>
                  Responsive design with touch-friendly interfaces, 
                  perfect for managing your collection on the go.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/30 transition-colors">
              <CardHeader>
                <Monitor className="h-8 w-8 mb-2" style={{color: 'var(--theme-primary)'}} />
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
      <section className="py-20 text-white" style={{background: `linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))`}}>
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Organize Your Collection?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Join RC enthusiasts who trust TrackMyRC to manage their collections. 
            Start tracking your builds today.
          </p>
          <Link href="/auth">
            <Button size="lg" variant="secondary" className="bg-white hover:bg-gray-100" style={{color: 'var(--theme-primary)'}}>
              Get Started Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-50 dark:bg-gray-900 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground">
            <div className="mb-4 sm:mb-0">
              © 2025 TrackMyRC. All rights reserved.
            </div>
            <div className="flex space-x-6">
              <Link href="/disclaimer" className="hover:text-foreground transition-colors">
                Disclaimer
              </Link>
              <Link href="/features" className="hover:text-foreground transition-colors">
                Features
              </Link>
              <Link href="/screenshots" className="hover:text-foreground transition-colors">
                Screenshots
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}