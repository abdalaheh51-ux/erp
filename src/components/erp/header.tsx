"use client";

import { Menu, Moon, Sun, Bell, Search } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUIStore } from "@/store/ui-store";

export function Header() {
  const { setSidebarOpen, activeModule } = useUIStore();
  const { theme, setTheme } = useTheme();
  const [mounted] = useState(false);

  const titles: Record<string, string> = {
    dashboard: "Dashboard",
    customers: "Customers",
    deals: "Deals",
    interactions: "Interactions",
    products: "Products",
    invoices: "Invoices",
    payments: "Payments",
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <Menu className="size-5" />
      </Button>

      <h2 className="text-base font-semibold text-foreground sm:text-lg">
        {titles[activeModule]}
      </h2>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="h-9 w-56 pl-9 lg:w-64"
          />
        </div>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-5" />
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-rose-500 ring-2 ring-background" />
        </Button>

        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Sun className="size-5" />
            ) : (
              <Moon className="size-5" />
            )}
          </Button>
        )}

        <div className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-sky-600 text-white shadow-sm">
          <img src="/logo.svg" alt="Nexus ERP" className="h-5 w-5" />
        </div>
      </div>
    </header>
  );
}
