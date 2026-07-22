// Shared ERP constants: status enums, labels, colors

export const CUSTOMER_STATUS = {
  new: { label: "New", color: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400", dot: "bg-sky-500" },
  lead: { label: "Lead", color: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400", dot: "bg-amber-500" },
  active: { label: "Active", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400", dot: "bg-emerald-500" },
  inactive: { label: "Inactive", color: "bg-zinc-100 text-zinc-600 dark:bg-zinc-500/15 dark:text-zinc-400", dot: "bg-zinc-400" },
} as const;

export const CUSTOMER_SOURCES = {
  website: "Website",
  social_media: "Social Media",
  referral: "Referral",
  ads: "Advertisements",
  other: "Other",
} as const;

export const DEAL_STAGE = {
  contact: { label: "Initial Contact", color: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400", column: "bg-sky-50/60 dark:bg-sky-950/20" },
  proposal: { label: "Proposal Sent", color: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400", column: "bg-violet-50/60 dark:bg-violet-950/20" },
  negotiation: { label: "Negotiation", color: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400", column: "bg-amber-50/60 dark:bg-amber-950/20" },
  won: { label: "Closed Won", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400", column: "bg-emerald-50/60 dark:bg-emerald-950/20" },
  lost: { label: "Closed Lost", color: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400", column: "bg-rose-50/60 dark:bg-rose-950/20" },
} as const;

export const DEAL_STAGE_ORDER = ["contact", "proposal", "negotiation", "won", "lost"] as const;

export const INTERACTION_TYPE = {
  note: { label: "Note", icon: "FileText", color: "text-zinc-500" },
  call: { label: "Call", icon: "Phone", color: "text-sky-500" },
  meeting: { label: "Meeting", icon: "Users", color: "text-violet-500" },
  email: { label: "Email", icon: "Mail", color: "text-emerald-500" },
} as const;

export const INVOICE_STATUS = {
  draft: { label: "Draft", color: "bg-zinc-100 text-zinc-600 dark:bg-zinc-500/15 dark:text-zinc-400" },
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400" },
  paid: { label: "Paid", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400" },
  overdue: { label: "Overdue", color: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400" },
} as const;

export const PAYMENT_METHOD = {
  cash: { label: "Cash", icon: "Banknote" },
  bank_transfer: { label: "Bank Transfer", icon: "Building2" },
  payment_gateway: { label: "Payment Gateway", icon: "CreditCard" },
} as const;

export type CustomerStatus = keyof typeof CUSTOMER_STATUS;
export type CustomerSource = keyof typeof CUSTOMER_SOURCES;
export type DealStage = keyof typeof DEAL_STAGE;
export type InteractionType = keyof typeof INTERACTION_TYPE;
export type InvoiceStatus = keyof typeof INVOICE_STATUS;
export type PaymentMethod = keyof typeof PAYMENT_METHOD;

export const CURRENCY = "EGP";
export function getLocaleFromLang(lang?: string) {
  const l = lang || (typeof document !== "undefined" ? document.documentElement.lang : "en");
  return l === "ar" ? "ar-EG" : "en-US";
}

export function formatCurrency(amount: number, lang?: string): string {
  const locale = getLocaleFromLang(lang);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: CURRENCY,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatNumber(n: number, lang?: string): string {
  const locale = getLocaleFromLang(lang);
  return new Intl.NumberFormat(locale).format(n || 0);
}

export function formatDate(date: Date | string | null | undefined, lang?: string): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  const locale = getLocaleFromLang(lang);
  return d.toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
}

export function formatDateTime(date: Date | string | null | undefined, lang?: string): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  const locale = getLocaleFromLang(lang);
  return d.toLocaleDateString(locale, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function timeAgo(date: Date | string, lang?: string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return lang === "ar" ? "الآن" : "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}${lang === "ar" ? "د" : "m"}` + (lang === "ar" ? "" : " ago");
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}${lang === "ar" ? "س" : "h"}` + (lang === "ar" ? "" : " ago");
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}${lang === "ar" ? "ي" : "d"}` + (lang === "ar" ? "" : " ago");
  return formatDate(d, lang);
}

// Generate next invoice number: INV-0001
export async function generateInvoiceNumber(count: number): string {
  return `INV-${String(count + 1).padStart(4, "0")}`;
}
