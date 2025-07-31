import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Camera, Database, Clock, Settings, Smartphone, Monitor, Search, BarChart3, FileText, Cloud } from "lucide-react";
import { Link } from "wouter";

export default function Features() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="text-white py-16" style={{background: `linear-gradient(to right, var(--theme-primary), var(--theme-secondary))`}}>
        <div className="container mx-auto px-4">
          <Link href="/">
            <Button variant="ghost" className="mb-4 text-white hover:bg-white/20">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Comprehensive Features
          </h1>
          <p className="text-xl opacity-90 max-w-3xl">
            Discover all the powerful tools and features that make TrackMyRC 
            the ultimate RC collection management platform.
          </p>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">Core Features</h2>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <div className="flex items-center mb-4">
                <Database className="h-8 w-8 mr-3" style={{color: 'var(--theme-primary)'}} />
                <h3 className="text-2xl font-bold">Model Management</h3>
              </div>
              <p className="text-lg text-muted-foreground mb-6">
                Keep track of your entire Tamiya collection with comprehensive model profiles. 
                Each model includes detailed specifications, build status, costs, and metadata.
              </p>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-center">
                  <span className="w-2 h-2 rounded-full mr-3" style={{backgroundColor: 'var(--theme-primary)'}}></span>
                  Automatic data import from TamiyaBase
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 rounded-full mr-3" style={{backgroundColor: 'var(--theme-primary)'}}></span>
                  Build status tracking (Planning, Building, Built, Maintenance)
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 rounded-full mr-3" style={{backgroundColor: 'var(--theme-primary)'}}></span>
                  Custom tags and organization
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 rounded-full mr-3" style={{backgroundColor: 'var(--theme-primary)'}}></span>
                  Cost tracking and investment analysis
                </li>
              </ul>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
              <img 
                src="/screenshots/model-details.jpg" 
                alt="Model Details - Comprehensive specifications and investment tracking"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <div className="order-2 lg:order-1">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                <img 
                  src="/screenshots/photo-frame.jpg" 
                  alt="Photo Frame Slideshow - Lancia Delta HF Integrale"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="flex items-center mb-4">
                <Camera className="h-8 w-8 mr-3" style={{color: 'var(--theme-primary)'}} />
                <h3 className="text-2xl font-bold">Photo Gallery</h3>
              </div>
              <p className="text-lg text-muted-foreground mb-6">
                Organize and showcase your RC models with a powerful photo management system. 
                Upload, caption, and organize images with ease.
              </p>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-center">
                  <span className="w-2 h-2 rounded-full mr-3" style={{backgroundColor: 'var(--theme-primary)'}}></span>
                  Drag-and-drop multi-file uploads
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 rounded-full mr-3" style={{backgroundColor: 'var(--theme-primary)'}}></span>
                  Box art designation and management
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 rounded-full mr-3" style={{backgroundColor: 'var(--theme-primary)'}}></span>
                  Photo captions and metadata
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 rounded-full mr-3" style={{backgroundColor: 'var(--theme-primary)'}}></span>
                  Lightbox gallery viewing
                </li>
              </ul>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center mb-4">
                <Clock className="h-8 w-8 mr-3" style={{color: 'var(--theme-primary)'}} />
                <h3 className="text-2xl font-bold">Build Logging</h3>
              </div>
              <p className="text-lg text-muted-foreground mb-6">
                Document every step of your build process with detailed timeline entries. 
                Capture progress with text, photos, and voice recordings.
              </p>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-center">
                  <span className="w-2 h-2 rounded-full mr-3" style={{backgroundColor: 'var(--theme-primary)'}}></span>
                  Chronological build timeline
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 rounded-full mr-3" style={{backgroundColor: 'var(--theme-primary)'}}></span>
                  Voice recording with transcription
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 rounded-full mr-3" style={{backgroundColor: 'var(--theme-primary)'}}></span>
                  Photo attachments per entry
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 rounded-full mr-3" style={{backgroundColor: 'var(--theme-primary)'}}></span>
                  Cross-model build history
                </li>
              </ul>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
              <img 
                src="/screenshots/build-log-entry.jpg" 
                alt="Build Log Entry - Add Build Log Entry #2 with voice input and photo attachments"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">Additional Features</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="overflow-hidden">
              <CardHeader>
                <Settings className="h-8 w-8 mb-2" style={{color: 'var(--theme-primary)'}} />
                <CardTitle>Hop-Up Parts Tracking</CardTitle>
                <CardDescription>
                  Monitor performance upgrades, installation status, costs, and compatibility 
                  across your entire collection with detailed parts management.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <img 
                  src="/screenshots/hop-up-parts.jpg" 
                  alt="Hop-Up Parts Detail - Aluminum Main Drive Shaft"
                  className="w-full h-auto object-cover"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Search className="h-8 w-8 mb-2" style={{color: 'var(--theme-primary)'}} />
                <CardTitle>Advanced Search</CardTitle>
                <CardDescription>
                  Find models, parts, and build entries quickly with powerful search 
                  and filtering capabilities across all your data.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="h-8 w-8 mb-2" style={{color: 'var(--theme-primary)'}} />
                <CardTitle>Analytics & Reports</CardTitle>
                <CardDescription>
                  Track collection growth, investment analysis, and build progress 
                  with comprehensive statistics and visual reports.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <FileText className="h-8 w-8 mb-2" style={{color: 'var(--theme-primary)'}} />
                <CardTitle>Data Export</CardTitle>
                <CardDescription>
                  Export your collection data in various formats for backup, 
                  sharing, or integration with other tools and platforms.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Cloud className="h-8 w-8 mb-2" style={{color: 'var(--theme-primary)'}} />
                <CardTitle>Cloud Sync</CardTitle>
                <CardDescription>
                  Access your collection from anywhere with secure cloud storage 
                  and automatic synchronization across all your devices.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader>
                <Smartphone className="h-8 w-8 mb-2" style={{color: 'var(--theme-primary)'}} />
                <CardTitle>Dark Mode & Theming</CardTitle>
                <CardDescription>
                  Beautiful dark mode with dynamic color theming. Choose between military 
                  green/orange or classic red/blue themes that adapt to light and dark modes.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <img 
                  src="/screenshots/dark-mode-collection.jpg" 
                  alt="Dark Mode Collection View - My Collection with 7 models"
                  className="w-full h-auto object-cover"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Experience All Features Today
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Start managing your Tamiya collection with all these powerful features. 
            No setup required - get started in seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth">
              <Button size="lg" className="text-white" style={{backgroundColor: 'var(--theme-primary)'}}>
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