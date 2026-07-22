"use client";

import { useEffect } from "react";
import { useUIStore } from "@/store/ui-store";

export function RootClientWrapper({ children }: { children: React.ReactNode }) {
  const language = useUIStore((state) => state.language);

  useEffect(() => {
    const htmlElement = document.documentElement;
    htmlElement.lang = language;
    htmlElement.dir = language === "ar" ? "rtl" : "ltr";
    
    if (language === "ar") {
      htmlElement.classList.add("rtl");
    } else {
      htmlElement.classList.remove("rtl");
    }
  }, [language]);

  return children;
}
