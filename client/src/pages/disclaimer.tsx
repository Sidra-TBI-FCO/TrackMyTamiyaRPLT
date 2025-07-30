import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-8">
            <Link href="/">
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Disclaimer</h1>
          </div>

          {/* Disclaimer Content */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">TrackMyRC Disclaimer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-muted-foreground leading-relaxed">
              <p>
                This app, <strong className="text-foreground">TrackMyRC</strong>, is an independent creation and is not affiliated with, endorsed by, sponsored by, or in any way officially connected with any RC car manufacturer, including but not limited to Traxxas, Tamiya, Arrma, Axial, Losi, or Associated Electrics.
              </p>

              <p>
                All product names, logos, brands, trademarks, and registered trademarks are the property of their respective owners. The use of these names, trademarks, and brands in this app is for identification purposes only and does not imply endorsement.
              </p>

              <p>
                <strong className="text-foreground">TrackMyRC</strong> is designed to help RC car enthusiasts organize their personal collection of RC car information, including models, hop-ups, manuals, setup sheets, and photos. It is not intended to replace official manufacturer resources or support. For official product information, support, and manuals, please refer directly to the respective RC car manufacturer's website and documentation.
              </p>

              <p>
                The developer of this app is not responsible for any inaccuracies, omissions, or misinterpretations of information found within the app, which is provided for general informational purposes only. Users are encouraged to always consult official manufacturer documentation for precise and up-to-date information.
              </p>

              <p>
                <strong className="text-foreground">By using this app, you acknowledge and agree to this disclaimer.</strong>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}