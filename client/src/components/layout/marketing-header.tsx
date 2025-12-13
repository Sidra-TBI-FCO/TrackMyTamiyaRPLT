import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun, LayoutDashboard, Menu, X } from "lucide-react";
import { Link } from "wouter";
import { useTheme } from "@/lib/theme-context";
import { useAuth } from "@/hooks/useAuth";

export default function MarketingHeader() {
  const { darkMode, toggleDarkMode } = useTheme();
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/features", label: "Features" },
    { href: "/screenshots", label: "Screenshots" },
    { href: "/pricing", label: "Pricing" },
    { href: "/feedback", label: "Feedback" },
    { href: "/community", label: "Community" },
    { href: "/download", label: "Download" },
  ];

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 flex items-center justify-center relative overflow-hidden" style={{clipPath: 'polygon(15% 0%, 85% 0%, 100% 15%, 100% 85%, 85% 100%, 15% 100%, 0% 85%, 0% 15%)', backgroundColor: 'var(--theme-primary)'}}>
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
                <span style={{color: 'var(--theme-primary)'}}>TRACK</span>
                <span style={{color: 'var(--theme-secondary)'}}>MY</span>
                <span style={{color: 'var(--theme-primary)'}}>RC</span>
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button variant="ghost">{link.label}</Button>
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <Sun className="h-4 w-4 text-yellow-500" />
              ) : (
                <Moon className="h-4 w-4 text-slate-600" />
              )}
            </Button>
            
            {isAuthenticated ? (
              <Link href="/">
                <Button className="text-white hidden sm:flex" style={{backgroundColor: 'var(--theme-primary)'}} data-testid="button-go-to-app">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Go to App
                </Button>
                <Button className="text-white sm:hidden" size="icon" style={{backgroundColor: 'var(--theme-primary)'}} data-testid="button-go-to-app-mobile">
                  <LayoutDashboard className="w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <Link href="/auth">
                <Button className="text-white" style={{backgroundColor: 'var(--theme-primary)'}} data-testid="button-login">
                  Login
                </Button>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-2">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Button>
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
