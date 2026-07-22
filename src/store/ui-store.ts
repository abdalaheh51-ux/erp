"use client";

import { create } from "zustand";
import type { Language } from "@/lib/translations";

export type ModuleKey =
  | "dashboard"
  | "customers"
  | "deals"
  | "interactions"
  | "products"
  | "invoices"
  | "payments";

interface CustomerDetailState {
  open: boolean;
  customerId: string | null;
}

interface UIState {
  activeModule: ModuleKey;
  sidebarOpen: boolean;
  selectedCustomerId: string | null;
  customerDetail: CustomerDetailState;
  language: Language;
  setModule: (m: ModuleKey) => void;
  setSidebarOpen: (open: boolean) => void;
  openCustomerDetail: (id: string) => void;
  closeCustomerDetail: () => void;
  setLanguage: (lang: Language) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeModule: "dashboard",
  sidebarOpen: false,
  selectedCustomerId: null,
  customerDetail: { open: false, customerId: null },
  language: "en",
  setModule: (m) => set({ activeModule: m, sidebarOpen: false }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  openCustomerDetail: (id) =>
    set({ customerDetail: { open: true, customerId: id } }),
  closeCustomerDetail: () =>
    set({ customerDetail: { open: false, customerId: null } }),
  setLanguage: (lang) => set({ language: lang }),
}));
