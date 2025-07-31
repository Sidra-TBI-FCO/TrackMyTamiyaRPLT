import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Download, Smartphone, QrCode, Globe, Monitor } from "lucide-react";
import { Link } from "wouter";

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="text-white py-16" style={{background: `linear-gradient(to right, var(--theme-primary), var(--theme-secondary))`}}>
        <div className="container mx-auto px-4">
          <Link href="/screenshots">
            <Button variant="ghost" className="mb-4 text-white hover:bg-white/20">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Screenshots
            </Button>
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Download TrackMyRC
          </h1>
          <p className="text-xl opacity-90 max-w-3xl">
            Access your RC collection from any device. Choose the best option 
            for your platform and start managing your RC models today.
          </p>
        </div>
      </section>

      {/* Web App Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                Available Now
              </Badge>
              <h2 className="text-3xl font-bold mb-4">Web Application</h2>
              <p className="text-xl text-muted-foreground">
                Access TrackMyRC directly in your browser. No installation required, 
                works on all devices with internet connection.
              </p>
            </div>

            <Card className="border-2 border-green-200 dark:border-green-800">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <Globe className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle>Web App - Ready to Use</CardTitle>
                <CardDescription>
                  Full-featured application accessible from any modern web browser
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div>
                    <Monitor className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <h4 className="font-semibold">Desktop</h4>
                    <p className="text-sm text-muted-foreground">Full desktop experience</p>
                  </div>
                  <div>
                    <Smartphone className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <h4 className="font-semibold">Mobile</h4>
                    <p className="text-sm text-muted-foreground">Touch-optimized interface</p>
                  </div>
                  <div>
                    <span className="text-2xl mx-auto mb-2 block">💾</span>
                    <h4 className="font-semibold">No Installation</h4>
                    <p className="text-sm text-muted-foreground">Works directly in browser</p>
                  </div>
                </div>
                <Link href="/auth">
                  <Button size="lg" className="text-white" style={{backgroundColor: 'var(--theme-primary)'}}>
                    Launch Web App
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Mobile Apps Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                Coming Soon
              </Badge>
              <h2 className="text-3xl font-bold mb-4">Native Mobile Apps</h2>
              <p className="text-xl text-muted-foreground">
                Get the full native experience with dedicated iOS and Android applications. 
                Enhanced performance and offline capabilities.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <Card className="opacity-75">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🍎</span>
                  </div>
                  <CardTitle>iOS App</CardTitle>
                  <CardDescription>Available on the App Store</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="space-y-2 text-sm text-muted-foreground mb-6">
                    <p>• Native iOS experience</p>
                    <p>• iCloud synchronization</p>
                    <p>• Apple Watch support</p>
                    <p>• Siri shortcuts</p>
                  </div>
                  <Button disabled className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>

              <Card className="opacity-75">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🤖</span>
                  </div>
                  <CardTitle>Android App</CardTitle>
                  <CardDescription>Available on Google Play</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="space-y-2 text-sm text-muted-foreground mb-6">
                    <p>• Material Design 3</p>
                    <p>• Google Drive backup</p>
                    <p>• Widget support</p>
                    <p>• Quick settings tiles</p>
                  </div>
                  <Button disabled className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Want to be notified when mobile apps are available?
              </p>
              <Button variant="outline" disabled>
                Notify Me When Ready
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* QR Code Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Quick Mobile Access</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Scan this QR code with your mobile device to quickly access 
              the web application on your phone or tablet.
            </p>
            
            <Card className="inline-block p-8">
              <div className="w-48 h-48 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mx-auto">
                <div className="text-center">
                  <QrCode className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">QR Code for</p>
                  <p className="text-sm font-mono">trackmytamiya.app</p>
                </div>
              </div>
            </Card>
            
            <p className="text-sm text-muted-foreground mt-4">
              Or manually visit the web app at your current URL
            </p>
          </div>
        </div>
      </section>

      {/* System Requirements */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">System Requirements</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Globe className="mr-2 h-5 w-5" />
                    Web Application
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm">Supported Browsers</h4>
                      <p className="text-sm text-muted-foreground">Chrome 90+, Firefox 88+, Safari 14+, Edge 90+</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Internet Connection</h4>
                      <p className="text-sm text-muted-foreground">Required for all features</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Storage</h4>
                      <p className="text-sm text-muted-foreground">Minimal local cache (&lt; 50MB)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="opacity-75">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Smartphone className="mr-2 h-5 w-5" />
                    Mobile Apps (Coming Soon)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm">iOS Requirements</h4>
                      <p className="text-sm text-muted-foreground">iOS 15.0 or later, 100MB storage</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Android Requirements</h4>
                      <p className="text-sm text-muted-foreground">Android 8.0 (API 26)+, 100MB storage</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Offline Features</h4>
                      <p className="text-sm text-muted-foreground">Basic viewing, sync when online</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Start Managing Your Collection
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Choose your preferred platform and begin organizing your Tamiya RC collection 
            with powerful, intuitive tools designed for enthusiasts.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/api/login">
              <Button size="lg" className="text-white" style={{backgroundColor: 'var(--theme-primary)'}}>
                Launch Web App
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/">
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}