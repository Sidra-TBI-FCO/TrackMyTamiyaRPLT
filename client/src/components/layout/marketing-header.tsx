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
              <div className="w-8 h-8 bg-red-600 dark:bg-blue-600 flex items-center justify-center relative overflow-hidden" style={{clipPath: 'polygon(15% 0%, 85% 0%, 100% 15%, 100% 85%, 85% 100%, 15% 100%, 0% 85%, 0% 15%)'}}>
                {/* Angular star similar to Tamiya style */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div 
                    className="w-5 h-5 bg-white"
                    style={{
                      clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
                    }}
                  />
                </div>
              </div>
              <span className="font-bold text-lg">
                <span className="text-red-600 dark:text-blue-500">TRACK</span>
                <span className="text-blue-600 dark:text-red-500">MY</span>
                <span className="text-red-600 dark:text-blue-500">TAMIYA</span>
              </span>
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
                <Sun className="h-4 w-4 text-yellow-500" />
              ) : (
                <Moon className="h-4 w-4 text-slate-600" />
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