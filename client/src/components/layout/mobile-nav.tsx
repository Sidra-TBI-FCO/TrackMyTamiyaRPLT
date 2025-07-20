import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Home, LayoutGrid, Wrench, Cog, Camera, MoreHorizontal, Plus } from "lucide-react";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import AddModelDialog from "@/components/models/add-model-dialog";

export default function MobileNav() {
  const [location] = useLocation();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const mainNavItems = [
    { href: "/", icon: Home, label: "Home", isActive: location === "/" },
    { href: "/models", icon: LayoutGrid, label: "Models", isActive: location === "/models" },
    { href: "/photos", icon: Camera, label: "Photos", isActive: location === "/photos" },
  ];

  const moreNavItems = [
    { href: "/build-logs", icon: Wrench, label: "Build Logs", isActive: location === "/build-logs" },
    { href: "/hop-up-parts", icon: Cog, label: "Hop-Up Parts", isActive: location === "/hop-up-parts" },
    { href: "/photo-frame", icon: Camera, label: "Photo Frame", isActive: location === "/photo-frame" },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 lg:hidden z-50">
      <div className="flex items-center justify-around px-2 py-1">
        {mainNavItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <button
              className={cn(
                "flex flex-col items-center justify-center py-2 px-3 transition-colors min-w-0",
                item.isActive ? "text-red-600" : "text-gray-400"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs font-mono mt-1 truncate">{item.label}</span>
            </button>
          </Link>
        ))}
        
        <AddModelDialog
          trigger={
            <button className="flex flex-col items-center justify-center py-2 px-3 text-red-600 bg-red-50 dark:bg-red-950 rounded-lg">
              <div className="bg-red-600 rounded-full p-1">
                <Plus className="h-4 w-4 text-white" />
              </div>
              <span className="text-xs font-mono mt-1 text-red-600">Add</span>
            </button>
          }
        />
        
        <Sheet open={isMoreMenuOpen} onOpenChange={setIsMoreMenuOpen}>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center justify-center py-2 px-3 text-gray-400 min-w-0">
              <MoreHorizontal className="h-5 w-5" />
              <span className="text-xs font-mono mt-1">More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto">
            <SheetHeader>
              <SheetTitle className="text-left">More Features</SheetTitle>
            </SheetHeader>
            <div className="grid gap-4 py-4">
              {moreNavItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <button
                    onClick={() => setIsMoreMenuOpen(false)}
                    className={cn(
                      "flex items-center w-full p-3 rounded-lg transition-colors text-left",
                      item.isActive
                        ? "bg-red-50 dark:bg-red-950 text-red-600"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800"
                    )}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    <div>
                      <div className="font-mono font-medium">{item.label}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {item.label === "Build Logs" && "Track your build progress"}
                        {item.label === "Hop-Up Parts" && "Manage your upgrades"}
                        {item.label === "Photo Frame" && "Slideshow mode"}
                      </div>
                    </div>
                  </button>
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
