"use client";

import { Menu, Moon, Sun, Bell, Search, Globe } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUIStore } from "@/store/ui-store";
import { t } from "@/lib/translations";

export function Header() {
  const { setSidebarOpen, activeModule, language, setLanguage } = useUIStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const titles: Record<string, string> = {
    dashboard: t("dashboard", language),
    customers: t("customers", language),
    deals: t("deals", language),
    interactions: t("interactions", language),
    products: t("products", language),
    invoices: t("invoices", language),
    payments: t("payments", language),
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

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLanguage(language === "en" ? "ar" : "en")}
          title={language === "en" ? "عربي" : "English"}
        >
          <Globe className="size-5" />
          <span className="ml-0.5 text-xs font-semibold">
            {language.toUpperCase()}
          </span>
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

        <div className="ml-1 flex h-9 w-9 items-center justify-center rounded-full overflow-hidden border border-border bg-black shadow-sm">
          <img src="/logo.jpg" alt="Nexus ERP" className="h-full w-full object-cover" />
        </div>
      </div>
    </header>
  );
}
