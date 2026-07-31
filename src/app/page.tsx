"use client";

import { Providers } from "@/components/erp/providers";
import { ThemeProvider } from "@/components/erp/theme-provider";
import { Sidebar } from "@/components/erp/sidebar";
import { Header } from "@/components/erp/header";
import { DashboardModule } from "@/components/erp/modules/dashboard";
import { CustomersModule } from "@/components/erp/modules/customers";
import { DealsModule } from "@/components/erp/modules/deals";
import { InteractionsModule } from "@/components/erp/modules/interactions";
import { ProductsModule } from "@/components/erp/modules/products";
import { InvoicesModule } from "@/components/erp/modules/invoices";
import { PaymentsModule } from "@/components/erp/modules/payments";
import { useUIStore } from "@/store/ui-store";

function ModuleRouter() {
  const activeModule = useUIStore((s) => s.activeModule);

  switch (activeModule) {
    case "dashboard":
      return <DashboardModule />;
    case "customers":
      return <CustomersModule />;
    case "deals":
      return <DealsModule />;
    case "interactions":
      return <InteractionsModule />;
    case "products":
      return <ProductsModule />;
    case "invoices":
      return <InvoicesModule />;
    case "payments":
      return <PaymentsModule />;
    default:
      return <DashboardModule />;
  }
}

function AppShell() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-64">
        <Header />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <ModuleRouter />
        </main>
        <footer className="mt-auto border-t border-border bg-background py-4 px-6 text-center text-xs text-muted-foreground">
          Nexus ERP — Integrated CRM &amp; Invoicing Platform · Built with Next.js
        </footer>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      forcedTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <Providers>
        <AppShell />
      </Providers>
    </ThemeProvider>
  );
}
