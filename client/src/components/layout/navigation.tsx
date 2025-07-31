import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutGrid, Wrench, Cog, Camera, Settings } from "lucide-react";

export default function Navigation() {
  const [location] = useLocation();

  const navItems = [
    { 
      path: "/", 
      label: "Collection", 
      icon: LayoutGrid,
      isActive: location === "/" || location === "/models" 
    },
    { 
      path: "/build-logs", 
      label: "Build Logs", 
      icon: Wrench,
      isActive: location === "/build-logs" 
    },
    { 
      path: "/parts", 
      label: "Hop-Up Parts", 
      icon: Cog,
      isActive: location === "/parts" 
    },
    { 
      path: "/photo-gallery", 
      label: "Photo Gallery", 
      icon: Camera,
      isActive: location === "/photo-gallery" 
    },
    { 
      path: "/settings", 
      label: "Settings", 
      icon: Settings,
      isActive: location === "/settings" 
    },
  ];

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 hidden lg:block">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          {navItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <button
                className={cn(
                  "flex items-center px-3 py-4 text-sm font-mono font-medium border-b-2 transition-colors",
                  item.isActive
                    ? "text-white" 
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                )}
                style={item.isActive ? {borderColor: 'var(--theme-primary)', color: 'var(--theme-primary)'} : {}}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </button>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
