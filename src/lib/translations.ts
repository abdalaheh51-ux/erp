export const translations = {
  en: {
    dashboard: "Dashboard",
    customers: "Customers",
    deals: "Deals",
    interactions: "Interactions",
    products: "Products",
    invoices: "Invoices",
    payments: "Payments",
    search: "Search...",
    welcome: "Welcome to Nexus ERP",
    settings: "Settings",
    logout: "Logout",
    profile: "Profile",
    theme: "Theme",
    language: "Language",
  },
  ar: {
    dashboard: "لوحة التحكم",
    customers: "العملاء",
    deals: "الصفقات",
    interactions: "التفاعلات",
    products: "المنتجات",
    invoices: "الفواتير",
    payments: "الدفعات",
    search: "بحث...",
    welcome: "مرحباً بك في نظام النيكس",
    settings: "الإعدادات",
    logout: "تسجيل الخروج",
    profile: "الملف الشخصي",
    theme: "المظهر",
    language: "اللغة",
  },
};

export type Language = "en" | "ar";
export type TranslationKey = keyof typeof translations.en;

export function t(key: TranslationKey, lang: Language): string {
  return translations[lang][key] || translations.en[key];
}
