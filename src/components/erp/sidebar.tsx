"use client";

import {
  LayoutDashboard,
  Users,
  Handshake,
  MessageSquare,
  Package,
  FileText,
  Wallet,
  Sparkles,
  X,
} from "lucide-react";
import { useUIStore, type ModuleKey } from "@/store/ui-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NavItem {
  key: ModuleKey;
  label: string;
  icon: typeof LayoutDashboard;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [{ key: "dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "CRM",
    items: [
      { key: "customers", label: "Customers", icon: Users },
      { key: "deals", label: "Deals", icon: Handshake },
      { key: "interactions", label: "Interactions", icon: MessageSquare },
    ],
  },
  {
    label: "Billing",
    items: [
      { key: "invoices", label: "Invoices", icon: FileText },
      { key: "payments", label: "Payments", icon: Wallet },
    ],
  },
  {
    label: "Catalog",
    items: [{ key: "products", label: "Products", icon: Package }],
  },
];

export function Sidebar() {
  const { activeModule, setModule, sidebarOpen, setSidebarOpen } = useUIStore();

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-sidebar transition-transform duration-200 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Brand */}
        <div className="flex h-16 items-center justify-between gap-2 border-b border-sidebar-border px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-sky-600 text-white shadow-sm">
              <img src="/logo.svg" alt="Nexus ERP" className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold leading-tight text-sidebar-foreground">
                Nexus ERP
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                CRM · Billing
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5 pb-8">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = activeModule === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setModule(item.key)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-4">
          <div className="rounded-lg bg-sidebar-accent/60 p-3">
            <p className="text-xs font-medium text-sidebar-foreground">
              Nexus ERP v1.0
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Integrated CRM &amp; invoicing
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
