import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Smartphone, Monitor, Star } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface Screenshot {
  id: number;
  title: string;
  description: string | null;
  category: string;
  imageUrl: string;
  route: string | null;
  sortOrder: number;
  isActive: boolean;
}

export default function Screenshots() {
  const [selectedCategory, setSelectedCategory] = useState<"all" | "mobile" | "desktop" | "admin">("all");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const { data: screenshots = [], isLoading } = useQuery<Screenshot[]>({
    queryKey: ["/api/screenshots"],
  });

  const activeScreenshots = screenshots.filter(s => s.isActive);
  const filteredScreenshots = selectedCategory === "all" 
    ? activeScreenshots 
    : activeScreenshots.filter(s => s.category === selectedCategory);

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
          {isLoading ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">Loading screenshots...</p>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredScreenshots.map((screenshot) => (
                  <div key={screenshot.id} className="group" data-testid={`screenshot-${screenshot.id}`}>
                    <div 
                      className="relative overflow-hidden rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-[var(--theme-primary)] dark:hover:border-[var(--theme-secondary)] transition-colors cursor-pointer"
                      onClick={() => setSelectedImage(screenshot.imageUrl)}
                    >
                      <div className="aspect-[4/3] bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
                        <img 
                          src={screenshot.imageUrl} 
                          alt={screenshot.title}
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                      </div>
                      <Badge 
                        className={`absolute top-3 right-3 ${
                          screenshot.category === "mobile" 
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
                            : screenshot.category === "admin"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300"
                            : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                        }`}
                      >
                        {screenshot.category === "mobile" ? (
                          <>
                            <Smartphone className="w-3 h-3 mr-1" />
                            Mobile
                          </>
                        ) : screenshot.category === "admin" ? (
                          "Admin"
                        ) : (
                          <>
                            <Monitor className="w-3 h-3 mr-1" />
                            Desktop
                          </>
                        )}
                      </Badge>
                    </div>
                    <div className="mt-4">
                      <h3 className="font-semibold text-lg mb-2">{screenshot.title}</h3>
                      {screenshot.description && (
                        <p className="text-sm text-muted-foreground">{screenshot.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {filteredScreenshots.length === 0 && !isLoading && (
                <div className="text-center py-16">
                  <p className="text-muted-foreground">
                    {selectedCategory === "all" 
                      ? "No screenshots available yet." 
                      : "No screenshots found for the selected category."}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Lightbox */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img 
            src={selectedImage} 
            alt="Screenshot"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}

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
              <Button size="lg" className="text-white" style={{backgroundColor: 'var(--theme-primary)'}}>
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/download">
              <Button size="lg" variant="outline">
                Get Mobile App
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