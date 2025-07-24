import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SlideshowProvider } from "@/lib/slideshow-context";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

// Marketing pages
import Landing from "@/pages/landing";
import Features from "@/pages/features";
import Screenshots from "@/pages/screenshots";
import DownloadPage from "@/pages/download";

// Application pages
import Home from "@/pages/home";
import Models from "@/pages/models";
import BuildLogs from "@/pages/build-logs";
import Parts from "@/pages/parts";
import PhotoGallery from "@/pages/photo-gallery";
import PhotoFrame from "@/pages/photo-frame";
import ModelDetail from "@/pages/model-detail";
import SettingsPage from "@/pages/settings";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";

import Header from "@/components/layout/header";
import Navigation from "@/components/layout/navigation";
import MobileNav from "@/components/layout/mobile-nav";
import MarketingHeader from "@/components/layout/marketing-header";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Marketing pages - always accessible */}
      <Route path="/features" component={Features} />
      <Route path="/screenshots" component={Screenshots} />
      <Route path="/download" component={DownloadPage} />
      <Route path="/auth" component={AuthPage} />
      
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
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark", !isDarkMode);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SlideshowProvider>
          <AppContent isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
        </SlideshowProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function AppContent({ isDarkMode, toggleDarkMode }: { isDarkMode: boolean; toggleDarkMode: () => void }) {
  const { isAuthenticated, isLoading } = useAuth();
  const showAppLayout = !isLoading && isAuthenticated;

  return (
    <div className={`min-h-screen bg-background overflow-x-hidden ${isDarkMode ? "dark" : ""}`}>
      {showAppLayout ? (
        <>
          <Header onToggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} />
          <Navigation />
        </>
      ) : (
        <MarketingHeader isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />
      )}
      <main className={showAppLayout ? "pb-16 lg:pb-0 max-w-full" : ""}>
        <Router />
      </main>
      {showAppLayout && <MobileNav />}
      <Toaster />
    </div>
  );
}

export default App;
