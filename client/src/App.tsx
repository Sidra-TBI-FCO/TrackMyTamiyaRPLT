import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SlideshowProvider } from "@/lib/slideshow-context";
import { ThemeProvider } from "@/lib/theme-context";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

// Marketing pages
import Landing from "@/pages/landing";
import Features from "@/pages/features";
import Screenshots from "@/pages/screenshots";
import PricingPage from "@/pages/pricing";
import DownloadPage from "@/pages/download";
import DisclaimerPage from "@/pages/disclaimer";
import FeedbackPage from "@/pages/feedback";

// Application pages
import Home from "@/pages/home";
import Models from "@/pages/models";
import BuildLogs from "@/pages/build-logs";
import Parts from "@/pages/parts";
import PhotoGallery from "@/pages/photo-gallery";
import PhotoFrame from "@/pages/photo-frame";
import ModelDetail from "@/pages/model-detail";
import SettingsPage from "@/pages/settings";
import AdminPage from "@/pages/admin";
import AuthPage from "@/pages/auth-page";
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";
import NotFound from "@/pages/not-found";

import Header from "@/components/layout/header";
import Navigation from "@/components/layout/navigation";
import MobileNav from "@/components/layout/mobile-nav";
import MarketingHeader from "@/components/layout/marketing-header";

// Marketing routes that should always be accessible
const MARKETING_ROUTES = ['/features', '/screenshots', '/pricing', '/download', '/disclaimer', '/feedback', '/auth', '/forgot-password', '/reset-password'];

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Marketing pages - always accessible to everyone */}
      <Route path="/features" component={Features} />
      <Route path="/screenshots" component={Screenshots} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/download" component={DownloadPage} />
      <Route path="/disclaimer" component={DisclaimerPage} />
      <Route path="/feedback" component={FeedbackPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      
      {/* Protected application routes */}
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/models" component={Models} />
          <Route path="/models/:id" component={ModelDetail} />
          <Route path="/build-logs" component={BuildLogs} />
          <Route path="/models/:modelId/build-log" component={BuildLogs} />
          <Route path="/parts" component={Parts} />
          <Route path="/photo-gallery" component={PhotoGallery} />
          <Route path="/photo-frame" component={PhotoFrame} />
          <Route path="/settings" component={SettingsPage} />
          <Route path="/admin" component={AdminPage} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <SlideshowProvider>
            <AppContent />
          </SlideshowProvider>
        </TooltipProvider>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();
  
  // Check if we're on a marketing route
  const isMarketingRoute = MARKETING_ROUTES.some(route => location.startsWith(route));
  
  // Show app layout only for authenticated users on non-marketing routes
  const showAppLayout = !isLoading && isAuthenticated && !isMarketingRoute;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {showAppLayout ? (
        <>
          <Header />
          <Navigation />
        </>
      ) : (
        <MarketingHeader />
      )}
      <main className={showAppLayout ? "pb-16 lg:pb-0 max-w-full" : ""}>
        <Router />
      </main>
      {showAppLayout && <MobileNav />}
    </div>
  );
}

export default App;
