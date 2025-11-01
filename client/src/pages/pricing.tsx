import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Check, 
  Heart, 
  TrendingUp, 
  Users, 
  Coffee, 
  Star,
  Sparkles,
  Lock,
  ArrowLeft
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface PricingTier {
  id: number;
  name: string;
  description: string | null;
  price: number;
  modelLimit: number | null;
  features: string[];
  isPopular: boolean;
  isActive: boolean;
  sortOrder: number;
}

export default function PricingPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [loadingTierId, setLoadingTierId] = useState<number | null>(null);

  const { data: tiers = [], isLoading } = useQuery<PricingTier[]>({
    queryKey: ["/api/pricing-tiers"],
  });

  const activeTiers = tiers.filter(t => t.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  const freeTier = activeTiers.find(t => t.price === 0);
  const paidTiers = activeTiers.filter(t => t.price > 0);

  const handleSelectPlan = async (tier: PricingTier) => {
    if (tier.price === 0) {
      navigate("/auth");
      return;
    }

    setLoadingTierId(tier.id);
    
    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tierId: tier.id }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error: any) {
      toast({
        title: "Checkout Error",
        description: error.message || "Failed to start checkout",
        variant: "destructive",
      });
      setLoadingTierId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-primary-dark)] text-white py-16">
        <div className="container mx-auto px-4">
          <Link href="/">
            <Button variant="ghost" className="mb-4 text-white hover:bg-white/20" data-testid="button-back">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl opacity-90">
              Choose the plan that fits your RC collection size. No subscriptions, just one-time purchases.
            </p>
          </div>
        </div>
      </section>

      {/* Hobby Project Notice */}
      <section className="py-12 bg-gradient-to-b from-amber-50 to-background dark:from-amber-950/20 dark:to-background border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Alert className="bg-white dark:bg-gray-900 border-amber-300 dark:border-amber-800">
              <Heart className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="ml-2">
                <div className="space-y-3">
                  <p className="font-semibold text-lg flex items-center gap-2">
                    <Coffee className="h-5 w-5" />
                    Built by an RC enthusiast, for RC enthusiasts
                  </p>
                  <p className="text-muted-foreground">
                    TrackMyRC is a passion project created by a solo developer who loves RC cars. 
                    This isn't a venture-backed startup – it's a tool built by someone who wanted 
                    a better way to track their own collection and decided to share it with the community.
                  </p>
                  <p className="text-sm text-muted-foreground italic">
                    Revenue from purchases helps cover server costs and keeps the lights on. 
                    Any support is genuinely appreciated and goes directly toward maintaining and improving the app.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">Loading pricing options...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {/* Free Tier */}
              {freeTier && (
                <Card className="relative border-2" data-testid={`tier-card-${freeTier.id}`}>
                  <CardHeader>
                    <CardTitle className="text-2xl">{freeTier.name}</CardTitle>
                    {freeTier.description && (
                      <CardDescription>{freeTier.description}</CardDescription>
                    )}
                    <div className="mt-4">
                      <span className="text-4xl font-bold">Free</span>
                      <span className="text-muted-foreground ml-2">forever</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {freeTier.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => handleSelectPlan(freeTier)}
                      data-testid={`button-select-tier-${freeTier.id}`}
                    >
                      Get Started Free
                    </Button>
                  </CardFooter>
                </Card>
              )}

              {/* Paid Tiers */}
              {paidTiers.map((tier) => (
                <Card 
                  key={tier.id}
                  className={`relative border-2 ${
                    tier.isPopular 
                      ? "border-[var(--theme-primary)] shadow-xl scale-105" 
                      : ""
                  }`}
                  data-testid={`tier-card-${tier.id}`}
                >
                  {tier.isPopular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--theme-primary)] text-white">
                      <Star className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  )}
                  <CardHeader>
                    <CardTitle className="text-2xl">{tier.name}</CardTitle>
                    {tier.description && (
                      <CardDescription>{tier.description}</CardDescription>
                    )}
                    <div className="mt-4">
                      <span className="text-4xl font-bold">${tier.price}</span>
                      <span className="text-muted-foreground ml-2">one-time</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {tier.modelLimit && (
                      <div className="bg-gradient-to-r from-[var(--theme-primary)]/10 to-[var(--theme-secondary)]/10 p-3 rounded-lg">
                        <p className="text-sm font-semibold">
                          <Sparkles className="inline h-4 w-4 mr-1" />
                          Up to {tier.modelLimit} models
                        </p>
                      </div>
                    )}
                    <div className="space-y-3">
                      {tier.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-dark)] text-white"
                      onClick={() => handleSelectPlan(tier)}
                      disabled={loadingTierId === tier.id}
                      data-testid={`button-select-tier-${tier.id}`}
                    >
                      {loadingTierId === tier.id ? (
                        "Loading..."
                      ) : (
                        <>
                          <Lock className="w-4 h-4 mr-2" />
                          Purchase {tier.name}
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Revenue Transparency */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 flex items-center justify-center gap-2">
                <TrendingUp className="h-8 w-8 text-[var(--theme-primary)]" />
                Revenue Transparency
              </h2>
              <p className="text-xl text-muted-foreground">
                Because you deserve to know where your money goes
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Coffee className="h-5 w-5 text-[var(--theme-primary)]" />
                    Where Revenue Goes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Server hosting & storage</span>
                    <Badge variant="outline">~40%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Payment processing fees</span>
                    <Badge variant="outline">~5%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Development & maintenance</span>
                    <Badge variant="outline">~55%</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground pt-4 border-t">
                    These are approximate breakdowns. Actual costs vary month to month.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-[var(--theme-primary)]" />
                    Community First
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <p className="text-sm">
                      <Check className="inline h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                      No subscriptions or recurring charges
                    </p>
                    <p className="text-sm">
                      <Check className="inline h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                      Free tier stays free forever
                    </p>
                    <p className="text-sm">
                      <Check className="inline h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                      Pay once, use forever
                    </p>
                    <p className="text-sm">
                      <Check className="inline h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                      No ads or data selling
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Alert className="mt-8">
              <Heart className="h-5 w-5 text-red-500" />
              <AlertDescription className="ml-2">
                <p className="font-semibold mb-2">A Note from the Developer</p>
                <p className="text-sm text-muted-foreground">
                  I built TrackMyRC because I wanted a better way to track my own RC collection. 
                  If this tool helps you enjoy your hobby even more, that makes it all worthwhile. 
                  Your support – whether through a purchase or just using the app – means the world. 
                  Thank you! 🙏
                </p>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 border-t">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Is this really a one-time purchase?</h3>
                <p className="text-muted-foreground text-sm">
                  Yes! Pay once and use the tier you purchased forever. No recurring subscriptions, 
                  no hidden fees.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Can I upgrade later?</h3>
                <p className="text-muted-foreground text-sm">
                  Absolutely. You can upgrade from a smaller pack to a larger one at any time. 
                  You'll only pay the difference.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">What happens if I hit my model limit?</h3>
                <p className="text-muted-foreground text-sm">
                  You can continue using all existing features, but you'll need to upgrade to add 
                  more models. Your data is never deleted.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Is my data safe?</h3>
                <p className="text-muted-foreground text-sm">
                  Yes. All data is securely stored in the cloud with regular backups. Your photos 
                  and information are encrypted and protected.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Do you offer refunds?</h3>
                <p className="text-muted-foreground text-sm">
                  Yes, within 30 days of purchase if you're not satisfied. Just contact support 
                  and we'll process a full refund, no questions asked.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-primary-dark)] text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to organize your RC collection?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join the growing community of RC enthusiasts who trust TrackMyRC
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/auth">
              <Button size="lg" variant="secondary" data-testid="button-cta-signup">
                <Users className="mr-2 h-5 w-5" />
                Start Free
              </Button>
            </Link>
            <Link href="/features">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/20" data-testid="button-cta-features">
                View All Features
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
