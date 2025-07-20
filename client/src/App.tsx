import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState } from "react";

import Home from "@/pages/home";
import Models from "@/pages/models";
import BuildLogs from "@/pages/build-logs";
import HopUpParts from "@/pages/hop-up-parts";
import PhotoGallery from "@/pages/photo-gallery";
import PhotoFrame from "@/pages/photo-frame";
import ModelDetail from "@/pages/model-detail";
import NotFound from "@/pages/not-found";

import Header from "@/components/layout/header";
import Navigation from "@/components/layout/navigation";
import MobileNav from "@/components/layout/mobile-nav";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/models" component={Models} />
      <Route path="/models/:id" component={ModelDetail} />
      <Route path="/build-logs" component={BuildLogs} />
      <Route path="/hop-up-parts" component={HopUpParts} />
      <Route path="/photos" component={PhotoGallery} />
      <Route path="/photo-frame" component={PhotoFrame} />
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
        <div className={`min-h-screen bg-background ${isDarkMode ? "dark" : ""}`}>
          <Header onToggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} />
          <Navigation />
          <main className="pb-16 lg:pb-0">
            <Router />
          </main>
          <MobileNav />
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
