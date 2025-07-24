import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { Link } from "wouter";

interface MarketingHeaderProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function MarketingHeader({ isDarkMode, onToggleDarkMode }: MarketingHeaderProps) {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <span className="font-bold text-lg">TrackMyTamiya</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/features">
              <Button variant="ghost">Features</Button>
            </Link>
            <Link href="/screenshots">
              <Button variant="ghost">Screenshots</Button>
            </Link>
            <Link href="/download">
              <Button variant="ghost">Download</Button>
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleDarkMode}
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            
            <Link href="/api/login">
              <Button className="bg-red-600 hover:bg-red-700 text-white">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}