import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Home, LayoutGrid, Plus, Camera, User } from "lucide-react";

export default function MobileNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 lg:hidden z-50">
      <div className="grid grid-cols-5 gap-1">
        <Link href="/">
          <button
            className={cn(
              "flex flex-col items-center justify-center py-2 transition-colors",
              location === "/" ? "text-red-600" : "text-gray-400"
            )}
          >
            <Home className="h-5 w-5" />
            <span className="text-xs font-mono mt-1">Home</span>
          </button>
        </Link>
        
        <Link href="/models">
          <button
            className={cn(
              "flex flex-col items-center justify-center py-2 transition-colors",
              location === "/models" ? "text-red-600" : "text-gray-400"
            )}
          >
            <LayoutGrid className="h-5 w-5" />
            <span className="text-xs font-mono mt-1">Models</span>
          </button>
        </Link>
        
        <button className="flex flex-col items-center justify-center py-2 text-gray-400">
          <Plus className="h-6 w-6" />
        </button>
        
        <Link href="/photos">
          <button
            className={cn(
              "flex flex-col items-center justify-center py-2 transition-colors",
              location === "/photos" ? "text-red-600" : "text-gray-400"
            )}
          >
            <Camera className="h-5 w-5" />
            <span className="text-xs font-mono mt-1">Photos</span>
          </button>
        </Link>
        
        <button className="flex flex-col items-center justify-center py-2 text-gray-400">
          <User className="h-5 w-5" />
          <span className="text-xs font-mono mt-1">Profile</span>
        </button>
      </div>
    </nav>
  );
}
