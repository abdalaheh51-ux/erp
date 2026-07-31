"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  TrendingUp,
  Wallet,
  Handshake,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  FileText,
  MessageSquare,
  Banknote,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  DEAL_STAGE,
  INVOICE_STATUS,
  INTERACTION_TYPE,
  getDealStageLabel,
  getInvoiceStatusLabel,
  getInteractionTypeLabel,
} from "@/lib/erp-constants";
import { LoadingState, PageHeader } from "@/components/erp/empty-states";
import { t } from "@/lib/translations";
import { useUIStore } from "@/store/ui-store";
import {
  InvoiceStatusBadge,
  InteractionTypeBadge,
  PaymentMethodBadge,
} from "@/components/erp/badges";
import { cn } from "@/lib/utils";

interface DashboardData {
  counts: {
    customers: number;
    deals: number;
    invoices: number;
    payments: number;
    interactions: number;
    products: number;
  };
  revenue: {
    total: number;
    outstanding: number;
    pipeline: number;
    won: number;
  };
  deltas: {
    revenueThisMonth: number;
    revenueLastMonth: number;
    customersNewThisMonth: number;
    customersNewLastMonth: number;
    openDealsCount: number;
    overdueCount: number;
  };
  pipeline: Array<{ stage: string; count: number; value: number }>;
  customerStatusDist: Array<{ status: string; count: number }>;
  invoiceStatusDist: Array<{
    status: string;
    count: number;
    amount: number;
  }>;
  revenueTrend: Array<{ label: string; revenue: number }>;
  recentInteractions: Array<{
    id: string;
    content: string;
    date: string;
    type: string;
    customer: { id: string; name: string };
  }>;
  recentPayments: Array<{
    id: string;
    amount: number;
    paymentMethod: string;
    date: string;
    invoice: { number: string; customer: { id: string; name: string } };
  }>;
  recentInvoices: Array<{
    id: string;
    number: string;
    totalAmount: number;
    status: string;
    createdAt: string;
    customer: { id: string; name: string };
    _count: { payments: number };
  }>;
}

const PIE_COLORS: Record<string, string> = {
  draft: "#a1a1aa",
  pending: "#f59e0b",
  paid: "#10b981",
  overdue: "#f43f5e",
};

const CUSTOMER_STATUS_COLORS: Record<string, string> = {
  new: "#0ea5e9",
  lead: "#f59e0b",
  active: "#10b981",
  inactive: "#a1a1aa",
};

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
}

function formatPct(v: number | null): string {
  if (v === null) return "—";
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(1)}%`;
}

// Custom tooltip for the Deals Pipeline bar chart — readable & well-styled
function PipelineTooltip({ active, payload }: {
  active?: boolean;
  payload?: Array<{ payload: { stage: string; count: number; value: number } }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0].payload;
  const stageCfg = DEAL_STAGE[item.stage as keyof typeof DEAL_STAGE];
  const language = useUIStore((s) => s.language);
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2.5 shadow-lg">
      <div className="flex items-center gap-2">
        <span className="size-2.5 rounded-full bg-blue-500" />
        <span className="text-xs font-semibold text-foreground">
          {getDealStageLabel(item.stage, language) || item.stage}
        </span>
      </div>
      <div className="mt-1.5 space-y-0.5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[11px] text-muted-foreground">{t("kpi_total_value", language)}</span>
          <span className="text-xs font-bold text-foreground">
            {formatCurrency(item.value, language)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[11px] text-muted-foreground">{t("kpi_deals", language)}</span>
          <span className="text-xs font-medium text-foreground">{item.count}</span>
        </div>
      </div>
    </div>
  );
}

// Custom tooltip for the Invoice Status donut chart — guarantees light text on dark popover
function InvoiceStatusTooltip({ active, payload }: {
  active?: boolean;
  payload?: Array<{ payload: { status: string; count: number; amount: number } }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0].payload;
  const statusCfg = INVOICE_STATUS[item.status as keyof typeof INVOICE_STATUS];
  const color = PIE_COLORS[item.status] || "#a1a1aa";
  const language = useUIStore((s) => s.language);
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2.5 shadow-lg">
      <div className="flex items-center gap-2">
        <span className="size-2.5 rounded-full" style={{ background: color }} />
        <span className="text-xs font-semibold text-foreground">
          {getInvoiceStatusLabel(item.status, language) || item.status}
        </span>
      </div>
      <div className="mt-1.5 space-y-0.5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[11px] text-muted-foreground">{t("invoice_count", language)}</span>
          <span className="text-xs font-bold text-foreground">{item.count}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[11px] text-muted-foreground">{t("amount", language)}</span>
          <span className="text-xs font-medium text-foreground">{formatCurrency(item.amount, language)}</span>
        </div>
      </div>
    </div>
  );
}

export function DashboardModule() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      return res.json();
    },
  });
  const setModule = useUIStore((s) => s.setModule);
  const language = useUIStore((s) => s.language);

  if (isLoading || !data) {
    return (
      <div>
        <PageHeader
          title={t("dashboard", language)}
          description={t("total_revenue", language)}
        />
        <LoadingState label={t("loading_dashboard", language)} />
      </div>
    );
  }

  const revPct = pctChange(data.deltas.revenueThisMonth, data.deltas.revenueLastMonth);
  const custPct = pctChange(data.deltas.customersNewThisMonth, data.deltas.customersNewLastMonth);

  const kpis: Array<{
    label: string;
    value: string;
    icon: LucideIcon;
    delta: string;
    sub: string;
    trend: "up" | "down" | "flat";
    accent: string;
    iconBg: string;
  }> = [
    {
      label: t("total_revenue", language),
      value: formatCurrency(data.revenue.total, language),
      icon: TrendingUp,
      delta: formatPct(revPct),
      sub: `${formatCurrency(data.deltas.revenueThisMonth, language)} ${t("this_month", language)}`,
      trend: revPct === null ? "flat" : revPct >= 0 ? "up" : "down",
      accent: "from-blue-500 to-sky-600",
      iconBg: "from-blue-500 to-sky-600",
    },
    {
      label: t("outstanding", language),
      value: formatCurrency(data.revenue.outstanding, language),
      icon: Wallet,
      delta: data.deltas.overdueCount > 0 ? `${data.deltas.overdueCount} ${t("overdue_count_suffix", language)}` : t("on_track", language) || "On track",
      sub: t("awaiting_payment", language),
      trend: data.deltas.overdueCount > 0 ? "down" : "flat",
      accent: "from-amber-500 to-orange-600",
      iconBg: "from-amber-500 to-orange-600",
    },
    {
      label: t("pipeline_value", language),
      value: formatCurrency(data.revenue.pipeline, language),
      icon: Handshake,
      delta: `${data.deltas.openDealsCount} ${t("open_deals_suffix", language)}`,
      sub: `${formatCurrency(data.revenue.won, language)} ${t("won", language) || "won"}`,
      trend: "up",
      accent: "from-violet-500 to-purple-600",
      iconBg: "from-violet-500 to-purple-600",
    },
    {
      label: t("total_customers", language),
      value: formatNumber(data.counts.customers, language),
      icon: Users,
      delta: formatPct(custPct),
      sub: `${data.deltas.customersNewThisMonth} ${t("new", language)} ${t("this_month", language)}`,
      trend: custPct === null ? "flat" : custPct >= 0 ? "up" : "down",
      accent: "from-sky-500 to-cyan-600",
      iconBg: "from-sky-500 to-cyan-600",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("dashboard", language)}
        description={t("dashboard_description", language)}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          const trendColor =
            kpi.trend === "up"
              ? "text-emerald-600 dark:text-emerald-400"
              : kpi.trend === "down"
                ? "text-rose-600 dark:text-rose-400"
                : "text-muted-foreground";
          return (
            <Card
              key={kpi.label}
              className="relative overflow-hidden border-border/60 transition-shadow hover:shadow-md"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div
                    className={cn(
                      "flex size-10 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm",
                      kpi.iconBg,
                    )}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div className={cn("flex items-center gap-1 text-xs font-medium", trendColor)}>
                    {kpi.trend === "up" ? (
                      <ArrowUpRight className="size-3.5" />
                    ) : kpi.trend === "down" ? (
                      <ArrowDownRight className="size-3.5" />
                    ) : (
                      <Minus className="size-3.5" />
                    )}
                    {kpi.delta}
                  </div>
                </div>
                <p className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
                  {kpi.value}
                </p>
                <p className="mt-0.5 text-sm font-medium text-foreground/80">{kpi.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{kpi.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Revenue trend */}
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">{t("revenue_trend", language)}</CardTitle>
                <p className="mt-0.5 text-xs text-muted-foreground">{t("last_6_months", language)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-blue-400">
                  {formatCurrency(
                    data.revenueTrend.reduce((s, m) => s + m.revenue, 0),
                    language,
                  )}
                </p>
                <p className="text-[11px] text-muted-foreground">{t("six_month_total", language)}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data.revenueTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#475569" }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#475569" }}
                  tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))}
                  width={45}
                />
                <Tooltip
                  formatter={(v: number) => [formatCurrency(v, language), t("revenue", language)]}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    background: "#ffffff",
                    color: "#1e293b",
                    fontSize: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fill="url(#rev)"
                  dot={{ r: 3, fill: "#3b82f6", strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Invoice status pie */}
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">{t("invoice_status", language)}</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatNumber(data.counts.invoices)} {t("total_invoices", language)}
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie
                  data={data.invoiceStatusDist}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  stroke="none"
                >
                  {data.invoiceStatusDist.map((entry) => (
                    <Cell key={entry.status} fill={PIE_COLORS[entry.status] || "#a1a1aa"} />
                  ))}
                </Pie>
                <Tooltip
                  cursor={{ fill: "var(--muted)", opacity: 0.3 }}
                  content={<InvoiceStatusTooltip />}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
              {data.invoiceStatusDist.map((s) => (
                <div key={s.status} className="flex items-center justify-between text-xs">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ background: PIE_COLORS[s.status] || "#a1a1aa" }}
                    />
                    <span className="truncate text-muted-foreground">
                      {INVOICE_STATUS[s.status as keyof typeof INVOICE_STATUS]?.label}
                    </span>
                  </div>
                  <span className="font-medium text-foreground">{s.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline + Customer dist */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">{t("deals_pipeline", language)}</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("value_by_stage", language)} · {formatCurrency(data.revenue.pipeline, language)} {t("open", language)}
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={data.pipeline}
                layout="vertical"
                margin={{ top: 0, right: 20, left: 48, bottom: 0 }}
                style={{ direction: "ltr" }}
              >
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#475569" }}
                  tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))}
                />
                <YAxis
                  type="category"
                  dataKey="stage"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 13, fill: "#cbd5e1", fontWeight: 600 }}
                  tickFormatter={(v) =>
                    getDealStageLabel(v, language) || v
                  }
                  width={190}
                />
                <Tooltip
                  cursor={{ fill: "#f1f5f9", opacity: 0.5 }}
                  content={<PipelineTooltip />}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} fill="#3b82f6" barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">{t("customer_distribution", language)}</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("by_status", language)}</p>
          </CardHeader>
          <CardContent className="space-y-3 pt-1">
            {data.customerStatusDist.map((c) => {
              const total = data.customerStatusDist.reduce((s, x) => s + x.count, 0);
              const pct = total > 0 ? (c.count / total) * 100 : 0;
              const color = CUSTOMER_STATUS_COLORS[c.status] || "#a1a1aa";
              return (
                <div key={c.status}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ background: color }}
                      />
                      <span className="font-medium capitalize text-foreground">{c.status}</span>
                    </div>
                    <span className="text-muted-foreground">
                      <span className="font-semibold text-foreground">{c.count}</span>{" "}
                      ({pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                </div>
              );
            })}
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border/60 pt-3">
              <div className="rounded-lg bg-muted/40 p-2.5">
                <p className="text-[11px] text-muted-foreground">{t("interactions", language)}</p>
                <p className="text-lg font-semibold text-foreground">
                  {formatNumber(data.counts.interactions)}
                </p>
              </div>
              <div className="rounded-lg bg-muted/40 p-2.5">
                <p className="text-[11px] text-muted-foreground">{t("payments", language)}</p>
                <p className="text-lg font-semibold text-foreground">
                  {formatNumber(data.counts.payments)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">{t("recent_invoices", language)}</CardTitle>
              <button
                onClick={() => setModule("invoices")}
                className="text-xs font-medium text-blue-400 hover:text-blue-300 hover:underline"
              >
                {t("view_all", language)}
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-0.5">
            {data.recentInvoices.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">{t("no_invoices_yet", language)}</p>
            )}
            {data.recentInvoices.map((inv) => (
              <button
                key={inv.id}
                onClick={() => setModule("invoices")}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted/60"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                  <FileText className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-sm font-semibold text-foreground">
                    {inv.number}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {inv.customer.name}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <p className="text-sm font-semibold text-foreground">
                    {formatCurrency(inv.totalAmount)}
                  </p>
                  <InvoiceStatusBadge status={inv.status} />
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">{t("recent_activity", language)}</CardTitle>
              <button
                onClick={() => setModule("interactions")}
                className="text-xs font-medium text-blue-400 hover:text-blue-300 hover:underline"
              >
                {t("view_all", language)}
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-0.5">
            {data.recentInteractions.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">{t("no_activity_yet", language)}</p>
            )}
            {data.recentInteractions.map((act) => (
              <button
                key={act.id}
                onClick={() => setModule("interactions")}
                className="flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted/60"
              >
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <MessageSquare className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-foreground">
                      {act.customer.name}
                    </p>
                    <InteractionTypeBadge type={act.type} />
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                    {act.content}
                  </p>
                </div>
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {formatDate(act.date)}
                </span>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent payments */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">{t("recent_payments", language)}</CardTitle>
            <button
              onClick={() => setModule("payments")}
              className="text-xs font-medium text-blue-400 hover:text-blue-300 hover:underline"
            >
              {t("view_all", language)}
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-0.5">
          {data.recentPayments.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">{t("no_payments_yet", language)}</p>
          )}
          {data.recentPayments.map((p) => (
            <button
              key={p.id}
              onClick={() => setModule("payments")}
              className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted/60"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                <Banknote className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {p.invoice.customer.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  <span className="font-mono">{p.invoice.number}</span> · {formatDate(p.date)}
                </p>
              </div>
              <div className="hidden shrink-0 sm:block">
                <PaymentMethodBadge method={p.paymentMethod} />
              </div>
              <p className="shrink-0 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                +{formatCurrency(p.amount)}
              </p>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
