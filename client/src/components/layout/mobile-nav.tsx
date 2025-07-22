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

  const navItems = [
    { href: "/", icon: Home, label: "Home", isActive: location === "/" },
    { href: "/models", icon: LayoutGrid, label: "Models", isActive: location === "/models" },
    { href: "/build-logs", icon: Wrench, label: "Logs", isActive: location === "/build-logs" },
    { href: "/hop-up-parts", icon: Cog, label: "Parts", isActive: location === "/hop-up-parts" },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 lg:hidden z-50">
      <div className="grid grid-cols-5 gap-1 px-2 py-1">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <button
              className={cn(
                "flex flex-col items-center justify-center py-2 px-1 transition-colors min-w-0",
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
            <button className="flex flex-col items-center justify-center py-2 px-1 text-red-600 bg-red-50 dark:bg-red-950 rounded-lg">
              <div className="bg-red-600 rounded-full p-1">
                <Plus className="h-4 w-4 text-white" />
              </div>
              <span className="text-xs font-mono mt-1 text-red-600">Add</span>
            </button>
          }
        />
      </div>
    </nav>
  );
}
