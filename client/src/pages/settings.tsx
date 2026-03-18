import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Settings, Camera, Clock, Tags, Type, LogOut, User, AlertTriangle, Palette, Download, FileSpreadsheet, Database, CheckCircle2, XCircle, Loader2, Package, ShoppingCart, Share2, Globe, Users, Lock, Printer, AtSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { addStorageFallbackParam } from "@/lib/file-utils";
import { toast } from "@/hooks/use-toast";
import { getSlideshowSettings, saveSlideshowSettings, SlideshowSettings, ColorScheme, getAppSettings, saveAppSettings } from "@/lib/settings";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/lib/theme-context";
import { exportModelsToCSV, exportHopUpsToCSV } from "@/lib/export-utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ModelWithRelations, HopUpPart } from "@/types";
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripeCheckoutForm from "@/components/checkout/StripeCheckoutForm";
import { apiRequest } from "@/lib/queryClient";

// Initialize Stripe (blueprint:javascript_stripe)
// Make Stripe optional - only initialize if key is available
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

// Storage Status Component
interface StorageStatusResponse {
  status: 'ok' | 'error';
  provider: string;
  bucket: string;
  message: string;
  error?: string;
}

function StorageStatus() {
  const { data: status, isLoading, error } = useQuery<StorageStatusResponse>({
    queryKey: ['/api/storage/status'],
    refetchInterval: 30000, // Check every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
        <div>
          <p className="text-sm font-mono font-medium">Checking storage...</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">Verifying connection to Google Cloud Storage</p>
        </div>
      </div>
    );
  }

  if (error || !status || status.status === 'error') {
    const errorMessage = status?.message || (error as any)?.message || 'Unable to connect to storage';
    return (
      <div className="space-y-3">
        <div className="flex items-center space-x-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-mono font-medium text-red-900 dark:text-red-100">Storage Error</p>
            <p className="text-xs text-red-700 dark:text-red-300 font-mono mt-1">{errorMessage}</p>
          </div>
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400 font-mono space-y-1 pl-4">
          <p>• Check that GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON is configured</p>
          <p>• Verify the service account has access to bucket: trackmyrc-bucket</p>
          <p>• Ensure the bucket exists in Google Cloud Storage</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-mono font-medium text-green-900 dark:text-green-100">Storage Connected</p>
          <p className="text-xs text-green-700 dark:text-green-300 font-mono mt-1">{status.message}</p>
        </div>
      </div>
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-gray-600 dark:text-gray-400">Provider:</span>
          <span className="text-xs font-mono font-medium">{status.provider}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-gray-600 dark:text-gray-400">Bucket:</span>
          <span className="text-xs font-mono font-medium">{status.bucket}</span>
        </div>
      </div>
    </div>
  );
}

interface PricingTier {
  id: number;
  modelCount: number;
  basePrice: string;
  discountPercent: number;
  finalPrice: string;
}

const DEFAULT_CARD_PREFS = {
  showRcBrand: true,
  showCarMake: true,
  showChassis: true,
  showScale: true,
  showItemNumber: true,
  showReleaseYear: false,
};

const PREVIEW_MOCK = {
  name: "Lancia Delta HF Integrale",
  chassis: "TT-01E",
  scale: "1/10",
  itemNumber: "58422",
  releaseYear: "1993",
};

function ModelCardPreview({ prefs }: { prefs: typeof DEFAULT_CARD_PREFS }) {
  return (
    <div className="flex flex-col items-center gap-1 my-4">
      <div
        className="relative bg-white rounded overflow-hidden"
        style={{ width: 270, height: 180, border: "1px solid #ddd", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
      >
        {/* Crop mark corners */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-gray-300" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-gray-300" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-gray-300" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-gray-300" />

        {/* Tamiya stamp — top-left */}
        {prefs.showRcBrand && (
          <img
            src="/brand_logos/Tamiya.png"
            alt="Tamiya"
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
            style={{ position: "absolute", top: 9, left: 9, width: 117, height: 63, objectFit: "contain", objectPosition: "left center" }}
          />
        )}

        {/* Car make logo — top-right */}
        {prefs.showCarMake && (
          <img
            src="/brand_logos/Lancia.png"
            alt="Brand"
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
            style={{ position: "absolute", top: 9, right: 9, width: 117, height: 63, objectFit: "contain", objectPosition: "right center" }}
          />
        )}

        {/* Model name + chassis — vertically centered */}
        <div style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", left: 12, right: 12, textAlign: "center" }}>
          <p style={{ fontFamily: "Helvetica, Arial, sans-serif", fontWeight: "bold", fontSize: 13, color: "#1e1e1e", margin: 0, lineHeight: 1.35 }}>
            {PREVIEW_MOCK.name}
          </p>
          {prefs.showChassis && (
            <p style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: 10, color: "#5a5a5a", margin: "3px 0 0 0" }}>
              {PREVIEW_MOCK.chassis}
            </p>
          )}
        </div>

        {/* Bottom row — scale / year / item number */}
        <div style={{ position: "absolute", bottom: 8, left: 9, right: 9, display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "Courier New, monospace", fontSize: 8, color: "#3c3c3c" }}>
            {prefs.showScale ? PREVIEW_MOCK.scale : ""}
          </span>
          <span style={{ fontFamily: "Courier New, monospace", fontSize: 8, color: "#3c3c3c" }}>
            {prefs.showReleaseYear ? PREVIEW_MOCK.releaseYear : ""}
          </span>
          <span style={{ fontFamily: "Courier New, monospace", fontSize: 8, color: "#3c3c3c" }}>
            {prefs.showItemNumber ? PREVIEW_MOCK.itemNumber : ""}
          </span>
        </div>

        {/* "preview" label */}
        <div style={{
          position: "absolute", top: 3, left: "50%", transform: "translateX(-50%)",
          background: "#f3f4f6", color: "#9ca3af", fontSize: 8, fontFamily: "monospace",
          padding: "1px 5px", borderRadius: 3, pointerEvents: "none", userSelect: "none", whiteSpace: "nowrap"
        }}>
          preview
        </div>
      </div>
      <p style={{ fontSize: 11, color: "#9ca3af", fontFamily: "monospace", margin: 0 }}>
        Sample card — 90 × 60 mm
      </p>
    </div>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SlideshowSettings>(getSlideshowSettings());
  const [appSettings, setAppSettings] = useState(getAppSettings());
  const [cardPrintPrefs, setCardPrintPrefs] = useState<Partial<typeof DEFAULT_CARD_PREFS>>({});
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [selectedTier, setSelectedTier] = useState<PricingTier | null>(null);
  const [clientSecret, setClientSecret] = useState<string>("");
  const [showCheckout, setShowCheckout] = useState(false);
  const { user } = useAuth();
  const { colorScheme, darkMode, setColorScheme, toggleDarkMode } = useTheme();
  const queryClient = useQueryClient();

  // Profile state
  const [usernameInput, setUsernameInput] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [showRealNameLocal, setShowRealNameLocal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [localProfileImageUrl, setLocalProfileImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setUsernameInput((user as any).username || "");
      setShowRealNameLocal((user as any).showRealName ?? false);
      setLocalProfileImageUrl((user as any).profileImageUrl || null);
    }
  }, [user]);

  useEffect(() => {
    const currentUsername = (user as any)?.username || "";
    if (!usernameInput || usernameInput === currentUsername) {
      setUsernameAvailable(null);
      setUsernameChecking(false);
      return;
    }
    if (!/^[a-z0-9_]{3,30}$/.test(usernameInput.toLowerCase())) {
      setUsernameAvailable(false);
      setUsernameChecking(false);
      return;
    }
    setUsernameChecking(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/user/check-username/${encodeURIComponent(usernameInput)}`);
        const data = await res.json();
        setUsernameAvailable(data.available);
      } catch {
        setUsernameAvailable(null);
      } finally {
        setUsernameChecking(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [usernameInput, user]);

  const updateUsernameMutation = useMutation({
    mutationFn: async (username: string) => {
      const res = await apiRequest("PUT", "/api/user/username", { username });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Username saved", description: "Your username has been updated." });
      setUsernameAvailable(null);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to save username", variant: "destructive" });
    },
  });

  const updateShowRealNameMutation = useMutation({
    mutationFn: async (show: boolean) => {
      const res = await apiRequest("PUT", "/api/user/show-real-name", { show });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/user/profile-image", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      setLocalProfileImageUrl(url);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Profile photo updated" });
    } catch {
      toast({ title: "Error", description: "Failed to upload image", variant: "destructive" });
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Fetch data for exports
  const { data: models } = useQuery<ModelWithRelations[]>({
    queryKey: ["/api/models"],
  });

  const { data: allHopUps } = useQuery<(HopUpPart & { model: { name: string } })[]>({
    queryKey: ["/api/hop-up-parts/all"],
  });

  // Fetch pricing tiers
  const { data: pricingTiers, isLoading: loadingPricing } = useQuery<PricingTier[]>({
    queryKey: ["/api/pricing-tiers"],
  });

  // Create payment intent mutation
  const createPaymentIntentMutation = useMutation({
    mutationFn: async ({ tierId }: { tierId: number }) => {
      const response = await apiRequest("POST", "/api/create-payment-intent", { tierId });
      return response.json();
    },
    onSuccess: (data: any) => {
      setClientSecret(data.clientSecret);
      setShowCheckout(true);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to initialize payment",
        variant: "destructive",
      });
    },
  });

  // Complete purchase mutation
  const completePurchaseMutation = useMutation({
    mutationFn: async ({ tierId, paymentId }: { tierId: number; paymentId: string }) => {
      const response = await apiRequest("POST", "/api/purchase/complete", { tierId, paymentId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/models"] });
      toast({
        title: "Purchase successful!",
        description: "Your model limit has been increased. You can now add more models.",
      });
      setShowPurchaseDialog(false);
      setShowCheckout(false);
      setSelectedTier(null);
      setClientSecret("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete purchase",
        variant: "destructive",
      });
    },
  });

  // Card print preferences
  const { data: fetchedCardPrintPrefs } = useQuery<Record<string, boolean>>({
    queryKey: ["/api/user/card-print-prefs"],
  });

  const saveCardPrintPrefsMutation = useMutation({
    mutationFn: async (prefs: typeof DEFAULT_CARD_PREFS) => {
      const response = await apiRequest("PUT", "/api/user/card-print-prefs", prefs);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/card-print-prefs"] });
      toast({ title: "Card layout saved", description: "Your print card preferences have been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save card preferences", variant: "destructive" });
    },
  });

  const effectiveCardPrintPrefs = { ...DEFAULT_CARD_PREFS, ...(fetchedCardPrintPrefs || {}), ...cardPrintPrefs };

  const toggleCardPref = (key: keyof typeof DEFAULT_CARD_PREFS) => {
    const updated = { ...effectiveCardPrintPrefs, [key]: !effectiveCardPrintPrefs[key] };
    setCardPrintPrefs(updated);
    saveCardPrintPrefsMutation.mutate(updated);
  };

  // Share preference mutation
  const updateSharePreferenceMutation = useMutation({
    mutationFn: async (sharePreference: 'public' | 'authenticated' | 'private') => {
      const response = await apiRequest("PATCH", "/api/user/share-preference", { sharePreference });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Share preference updated",
        description: "Your community sharing preference has been saved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update share preference",
        variant: "destructive",
      });
    },
  });

  const handlePurchaseClick = () => {
    if (selectedTier) {
      createPaymentIntentMutation.mutate({
        tierId: selectedTier.id,
      });
    }
  };

  const handlePaymentSuccess = (paymentIntentId: string) => {
    if (selectedTier) {
      completePurchaseMutation.mutate({
        tierId: selectedTier.id,
        paymentId: paymentIntentId,
      });
    }
  };

  const handleCancelCheckout = () => {
    setShowCheckout(false);
    setClientSecret("");
  };

  const updateSetting = <K extends keyof SlideshowSettings>(
    key: K,
    value: SlideshowSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveSlideshowSettings(newSettings);
    toast({
      title: "Settings saved",
      description: "Your slideshow preferences have been updated.",
    });
  };

  const updateAppSetting = <K extends keyof typeof appSettings>(
    key: K,
    value: typeof appSettings[K]
  ) => {
    const newSettings = { ...appSettings, [key]: value };
    setAppSettings(newSettings);
    saveAppSettings({ [key]: value });
    toast({
      title: "Settings saved",
      description: "App settings have been updated.",
    });
  };

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  const handleExportModels = () => {
    if (!models || models.length === 0) {
      toast({
        title: "No data to export",
        description: "You don't have any models to export yet.",
        variant: "destructive",
      });
      return;
    }
    
    exportModelsToCSV(models);
    toast({
      title: "Export completed",
      description: "Models have been exported to CSV file.",
    });
  };

  const handleExportHopUps = () => {
    if (!allHopUps || allHopUps.length === 0) {
      toast({
        title: "No data to export",
        description: "You don't have any hop-up parts to export yet.",
        variant: "destructive",
      });
      return;
    }
    
    exportHopUpsToCSV(allHopUps);
    toast({
      title: "Export completed",
      description: "Hop-up parts have been exported to CSV file.",
    });
  };

  return (
    <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4 overflow-x-hidden">
      <div className="lg:flex lg:gap-8">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block lg:w-80 lg:flex-shrink-0">
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-mono">Quick Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="font-mono text-sm">Mode:</span>
                <span className="font-mono text-sm text-gray-600 dark:text-gray-400">{darkMode ? 'Dark' : 'Light'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono text-sm">Colors:</span>
                <span className="font-mono text-sm text-gray-600 dark:text-gray-400">{colorScheme === 'military' ? 'Default' : 'Alternative'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono text-sm">Language:</span>
                <span className="font-mono text-sm text-gray-600 dark:text-gray-400">English</span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono text-sm">Slideshow:</span>
                <span className="font-mono text-sm text-gray-600 dark:text-gray-400">{settings.duration}s</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-mono">User Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {user ? (
                <>
                  <div className="flex items-center space-x-3">
                    <div className="bg-red-600 text-white p-2 rounded-full">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                        {(user as any).firstName} {(user as any).lastName}
                      </p>
                      <p className="font-mono text-xs text-gray-500 dark:text-gray-400">
                        {(user as any).email}
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleLogout}
                    variant="outline" 
                    size="sm" 
                    className="w-full font-mono text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 border-red-200 dark:border-red-800"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-mono">About</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="font-mono text-sm text-gray-600 dark:text-gray-400">
                TrackMyRC v1.0
              </p>
              <p className="font-mono text-xs text-gray-500 dark:text-gray-500">
                Built with React & Express
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-3 mb-6">
        <div className="text-white p-3 rounded-lg" style={{backgroundColor: 'var(--theme-primary)'}}>
          <Settings className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-mono font-bold text-gray-900 dark:text-white">
            Settings
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-mono">
            Customize your TrackMyRC experience
          </p>
        </div>
      </div>

      {/* Mobile User Account Section */}
      <div className="block lg:hidden">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-mono">User Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {user ? (
              <>
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-full" style={{backgroundColor: 'var(--theme-primary)'}}>
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                      {(user as any).firstName} {(user as any).lastName}
                    </p>
                    <p className="font-mono text-xs text-gray-500 dark:text-gray-400">
                      {(user as any).email}
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={handleLogout}
                  variant="outline" 
                  size="sm" 
                  className="w-full font-mono border-primary/20 hover:bg-primary/5"
                  style={{color: 'var(--theme-primary)'}}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Profile */}
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-lg font-mono">
            <User className="h-5 w-5" />
            <span>Profile</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile image */}
          <div className="flex items-center gap-5">
            <div className="relative flex-shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] group relative"
                disabled={uploadingImage}
                title="Change profile photo"
              >
                {localProfileImageUrl ? (
                  <img
                    src={addStorageFallbackParam(localProfileImageUrl)}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[var(--theme-primary)] flex items-center justify-center text-white text-2xl font-mono font-bold">
                    {((user as any)?.firstName?.[0] || (user as any)?.username?.[0] || '?').toUpperCase()}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploadingImage ? (
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  ) : (
                    <Camera className="h-6 w-6 text-white" />
                  )}
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfileImageChange}
              />
            </div>
            <div>
              <p className="font-mono text-sm font-medium text-gray-900 dark:text-white">Profile Photo</p>
              <p className="font-mono text-xs text-gray-500 dark:text-gray-400 mt-1">
                Click to upload a new photo. Shown next to your models in the community.
              </p>
            </div>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label className="font-mono text-sm font-medium">Username</Label>
            <p className="text-xs font-mono text-gray-500 dark:text-gray-400">
              Your public handle in the community (3–30 chars, letters, numbers, underscores).
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="pl-9 font-mono"
                  placeholder="your_username"
                  maxLength={30}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {usernameChecking && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
                  {!usernameChecking && usernameAvailable === true && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  {!usernameChecking && usernameAvailable === false && <XCircle className="h-4 w-4 text-red-500" />}
                </div>
              </div>
              <Button
                onClick={() => updateUsernameMutation.mutate(usernameInput)}
                disabled={
                  updateUsernameMutation.isPending ||
                  !usernameInput ||
                  usernameInput === ((user as any)?.username || "") ||
                  usernameAvailable === false ||
                  usernameChecking
                }
                className="font-mono"
                style={{ backgroundColor: 'var(--theme-primary)', color: 'white' }}
              >
                {updateUsernameMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
            {!usernameChecking && usernameAvailable === false && usernameInput && usernameInput !== ((user as any)?.username || "") && (
              <p className="text-xs font-mono text-red-500">
                {!/^[a-z0-9_]{3,30}$/.test(usernameInput) ? "Invalid format (3–30 chars, letters/numbers/underscores only)" : "Username is already taken"}
              </p>
            )}
            {!usernameChecking && usernameAvailable === true && (
              <p className="text-xs font-mono text-green-500">Username is available!</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Theme Settings */}
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-lg font-mono">
            <Palette className="h-5 w-5" />
            <span>Theme Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-mono font-medium">Dark Mode</Label>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                Switch between light and dark themes
              </p>
            </div>
            <Switch
              checked={darkMode}
              onCheckedChange={toggleDarkMode}
            />
          </div>

          {/* Color Scheme Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-mono font-medium">Color Scheme</Label>
            <Select 
              value={colorScheme} 
              onValueChange={(value: ColorScheme) => {
                setColorScheme(value);
                toast({
                  title: "Color scheme updated",
                  description: `Switched to ${value === 'military' ? 'default green/orange' : 'alternative red/blue'} colors.`,
                });
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="military">Default (Green/Orange)</SelectItem>
                <SelectItem value="tamiya">Alternative (Red/Blue)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
              {colorScheme === 'military' 
                ? 'Default green (light mode) and orange (dark mode) theme'
                : 'Alternative red and blue colors'
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Community Sharing Settings */}
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-lg font-mono">
            <Share2 className="h-5 w-5" />
            <span>Community Sharing</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm font-mono text-gray-600 dark:text-gray-400">
            Control who can see your shared models in the community gallery.
          </p>
          
          <div className="space-y-3">
            <Label className="text-sm font-mono font-medium">Sharing Visibility</Label>
            <Select 
              value={(user as any)?.sharePreference || 'private'} 
              onValueChange={(value: 'public' | 'authenticated' | 'private') => {
                updateSharePreferenceMutation.mutate(value);
              }}
              disabled={updateSharePreferenceMutation.isPending}
            >
              <SelectTrigger className="w-full" data-testid="select-share-preference">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span>Public - Anyone can view</span>
                  </div>
                </SelectItem>
                <SelectItem value="authenticated">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Members Only - Logged-in users</span>
                  </div>
                </SelectItem>
                <SelectItem value="private">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    <span>Private - Only you</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
              {(user as any)?.sharePreference === 'public' 
                ? 'Your shared models are visible to everyone, including non-registered visitors.'
                : (user as any)?.sharePreference === 'authenticated'
                ? 'Only registered and logged-in members can view your shared models.'
                : 'Your models are private and not visible in the community gallery.'
              }
            </p>
          </div>

          <div className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-gray-700">
            <div>
              <p className="text-sm font-mono font-medium">Show my real name in community</p>
              <p className="text-xs font-mono text-gray-500 dark:text-gray-400">
                When off, your username is shown. When on, your first and last name are shown.
              </p>
            </div>
            <Switch
              checked={showRealNameLocal}
              onCheckedChange={(checked) => {
                setShowRealNameLocal(checked);
                updateShowRealNameMutation.mutate(checked);
              }}
              disabled={updateShowRealNameMutation.isPending}
            />
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-2">
            <p className="text-xs font-mono font-medium text-gray-700 dark:text-gray-300">How sharing works:</p>
            <ul className="text-xs font-mono text-gray-600 dark:text-gray-400 space-y-1">
              <li>1. Set your visibility preference above</li>
              <li>2. Toggle sharing ON for individual models you want to share</li>
              <li>3. Your shared models appear in the community gallery</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Print Card Layout */}
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-lg font-mono">
            <Printer className="h-5 w-5" />
            <span>Print Card Layout</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm font-mono text-gray-600 dark:text-gray-400">
            Choose which fields appear on your printed model cards.
          </p>

          <ModelCardPreview prefs={effectiveCardPrintPrefs} />

          <div className="space-y-3">
            {([
              { key: "showRcBrand", label: "RC Brand Logo", description: "Tamiya stamp top-left" },
              { key: "showCarMake", label: "Car Make Logo", description: "Brand logo top-right (Porsche, Lancia, etc.)" },
              { key: "showChassis", label: "Chassis", description: "Chassis name below model name" },
              { key: "showScale", label: "Scale", description: "Scale at bottom-left (1/10, 1/12, etc.)" },
              { key: "showItemNumber", label: "Item Number", description: "Kit number at bottom-right" },
              { key: "showReleaseYear", label: "Release Year", description: "Year the kit was released" },
            ] as const).map(({ key, label, description }) => (
              <div key={key} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div>
                  <p className="text-sm font-mono font-medium">{label}</p>
                  <p className="text-xs font-mono text-gray-500 dark:text-gray-400">{description}</p>
                </div>
                <Switch
                  checked={effectiveCardPrintPrefs[key]}
                  onCheckedChange={() => toggleCardPref(key)}
                  disabled={saveCardPrintPrefsMutation.isPending}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Model Management */}
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-lg font-mono">
            <Package className="h-5 w-5" />
            <span>Model Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-mono text-gray-500 dark:text-gray-400">Current Models</Label>
                <p className="text-2xl font-mono font-bold" style={{color: 'var(--theme-primary)'}}>
                  {models?.length || 0}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-mono text-gray-500 dark:text-gray-400">Model Limit</Label>
                <p className="text-2xl font-mono font-bold text-gray-900 dark:text-white">
                  {(user as any)?.modelLimit || 2}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-mono text-gray-500 dark:text-gray-400">Remaining</Label>
                <p className="text-2xl font-mono font-bold text-gray-600 dark:text-gray-300">
                  {Math.max(0, ((user as any)?.modelLimit || 2) - (models?.length || 0))}
                </p>
              </div>
            </div>

            {(user as any)?.manuallyGrantedModels > 0 && (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <p className="text-xs font-mono text-green-700 dark:text-green-300">
                  You have {(user as any).manuallyGrantedModels} admin-granted models
                </p>
              </div>
            )}

            <div className="space-y-3">
              <p className="text-sm font-mono text-gray-600 dark:text-gray-400">
                Free tier includes 2 models. Purchase model packs to expand your collection.
              </p>
              <Button
                onClick={() => setShowPurchaseDialog(true)}
                className="w-full font-mono"
                style={{backgroundColor: 'var(--theme-primary)'}}
                data-testid="button-purchase-models"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Purchase Model Packs
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Storage Status */}
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-lg font-mono">
            <Database className="h-5 w-5" />
            <span>Storage Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StorageStatus />
        </CardContent>
      </Card>

      {/* Photo Frame Settings */}
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-lg font-mono">
            <Camera className="h-5 w-5" />
            <span>Photo Frame Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Slideshow Duration */}
          <div className="space-y-2">
            <Label className="text-sm font-mono font-medium flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Slide Duration</span>
            </Label>
            <Select 
              value={settings.duration.toString()} 
              onValueChange={(value) => updateSetting('duration', parseInt(value))}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 seconds</SelectItem>
                <SelectItem value="3">3 seconds</SelectItem>
                <SelectItem value="4">4 seconds</SelectItem>
                <SelectItem value="5">5 seconds</SelectItem>
                <SelectItem value="7">7 seconds</SelectItem>
                <SelectItem value="10">10 seconds</SelectItem>
                <SelectItem value="15">15 seconds</SelectItem>
                <SelectItem value="30">30 seconds</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
              How long each photo is displayed in the slideshow
            </p>
          </div>

          {/* Auto Start */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-mono font-medium">Auto-start slideshow</Label>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                Automatically begin playing when slideshow opens
              </p>
            </div>
            <Switch
              checked={settings.autoStart}
              onCheckedChange={(checked) => updateSetting('autoStart', checked)}
            />
          </div>

          {/* Show Captions */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-mono font-medium flex items-center space-x-2">
                <Type className="h-4 w-4" />
                <span>Show photo captions</span>
              </Label>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                Display photo descriptions in the slideshow
              </p>
            </div>
            <Switch
              checked={settings.showCaptions}
              onCheckedChange={(checked) => updateSetting('showCaptions', checked)}
            />
          </div>

          {/* Show Tags */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-mono font-medium flex items-center space-x-2">
                <Tags className="h-4 w-4" />
                <span>Show model tags</span>
              </Label>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                Display model tags and categories in the slideshow
              </p>
            </div>
            <Switch
              checked={settings.showTags}
              onCheckedChange={(checked) => updateSetting('showTags', checked)}
            />
          </div>

          {/* Shuffle */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-mono font-medium">Shuffle photos</Label>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                Randomize the order of photos in the slideshow
              </p>
            </div>
            <Switch
              checked={settings.shuffle}
              onCheckedChange={(checked) => updateSetting('shuffle', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Export */}
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-lg font-mono flex items-center space-x-2">
            <Download className="h-5 w-5" />
            <span>Data Export</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-mono font-medium">Export Models</Label>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                  Download all your models data as CSV file
                </p>
              </div>
              <Button 
                onClick={handleExportModels}
                variant="outline" 
                size="sm"
                className="font-mono"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                CSV
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-mono font-medium">Export Hop-Up Parts</Label>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                  Download all your hop-up parts data as CSV file
                </p>
              </div>
              <Button 
                onClick={handleExportHopUps}
                variant="outline" 
                size="sm"
                className="font-mono"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reset Settings */}
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-lg font-mono">Reset Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-mono font-medium">Reset to defaults</Label>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                Restore all settings to their default values
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => {
                localStorage.removeItem('tamiya_slideshow_settings');
                const defaultSettings = getSlideshowSettings();
                setSettings(defaultSettings);
                toast({
                  title: "Settings reset",
                  description: "All settings have been restored to defaults.",
                });
              }}
              className="font-mono"
            >
              Reset All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-lg font-mono flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Disclaimer</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
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

      {/* Purchase Model Packs Dialog */}
      <Dialog open={showPurchaseDialog} onOpenChange={(open) => {
        setShowPurchaseDialog(open);
        if (!open) {
          setShowCheckout(false);
          setSelectedTier(null);
          setClientSecret("");
        }
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="font-mono">
              {showCheckout ? "Complete Payment" : "Purchase Model Packs"}
            </DialogTitle>
            <DialogDescription className="font-mono">
              {showCheckout 
                ? "Enter your payment details to complete your purchase."
                : "Select a model pack to expand your collection. All purchases are one-time payments."
              }
            </DialogDescription>
          </DialogHeader>
          
          {showCheckout && clientSecret ? (
            stripePromise ? (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <StripeCheckoutForm
                  amount={selectedTier ? parseFloat(selectedTier.finalPrice) : 0}
                  modelCount={selectedTier?.modelCount || 0}
                  onSuccess={handlePaymentSuccess}
                  onCancel={handleCancelCheckout}
                />
              </Elements>
            ) : (
              <div className="p-6 text-center space-y-3">
                <p className="font-mono text-sm text-gray-600 dark:text-gray-400">
                  Payment processing is not currently configured.
                </p>
                <p className="font-mono text-xs text-gray-500">
                  Please contact support to enable payments.
                </p>
              </div>
            )
          ) : (
          <div className="space-y-4 py-4">
            {loadingPricing ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" style={{color: 'var(--theme-primary)'}} />
              </div>
            ) : pricingTiers && pricingTiers.length > 0 ? (
              <div className="grid gap-4">
                {pricingTiers.map((tier) => (
                  <button
                    key={tier.id}
                    onClick={() => setSelectedTier(tier)}
                    className={`relative p-4 rounded-lg border-2 transition-all text-left ${
                      selectedTier?.id === tier.id
                        ? 'border-[var(--theme-primary)] bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-[var(--theme-primary)] hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    data-testid={`tier-option-${tier.modelCount}`}
                  >
                    {tier.discountPercent > 0 && (
                      <div className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-mono font-bold text-white" style={{backgroundColor: 'var(--theme-secondary)'}}>
                        {tier.discountPercent}% OFF
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-mono font-bold text-lg">{tier.modelCount} Models</p>
                        <p className="font-mono text-sm text-gray-600 dark:text-gray-400">
                          {tier.discountPercent > 0 ? (
                            <>
                              <span className="line-through mr-2">${tier.basePrice}</span>
                              <span className="font-bold" style={{color: 'var(--theme-primary)'}}>
                                ${tier.finalPrice}
                              </span>
                            </>
                          ) : (
                            <span className="font-bold">${tier.finalPrice}</span>
                          )}
                        </p>
                        <p className="font-mono text-xs text-gray-500 dark:text-gray-500">
                          ${(parseFloat(tier.finalPrice) / tier.modelCount).toFixed(2)} per model
                        </p>
                      </div>
                      {selectedTier?.id === tier.id && (
                        <CheckCircle2 className="h-6 w-6" style={{color: 'var(--theme-primary)'}} />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 font-mono py-8">
                No pricing tiers available
              </p>
            )}
          </div>
          )}

          {!showCheckout && (
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowPurchaseDialog(false);
                  setSelectedTier(null);
                }}
                className="font-mono"
                data-testid="button-cancel-purchase"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePurchaseClick}
                disabled={!selectedTier || createPaymentIntentMutation.isPending}
                className="font-mono text-white"
                style={{backgroundColor: 'var(--theme-primary)'}}
                data-testid="button-confirm-purchase"
              >
                {createPaymentIntentMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Purchase {selectedTier ? `${selectedTier.modelCount} Models` : 'Selected Pack'}
                  </>
                )}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}