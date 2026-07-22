import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DEAL_STAGE_ORDER } from "@/lib/erp-constants";
import { deriveInvoiceStatus } from "@/lib/invoice-math";

export const dynamic = "force-dynamic";

export async function GET() {
  const now = new Date();
  // Month boundaries for "this month" vs "last month" deltas
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [
    customers,
    deals,
    invoices,
    payments,
    interactions,
    products,
    customersByStatus,
    dealsByStage,
    invoicesByStatus,
    // Delta computations
    revenueThisMonth,
    revenueLastMonth,
    customersNewThisMonth,
    customersNewLastMonth,
    openDealsCount,
  ] = await Promise.all([
    db.customer.count(),
    db.deal.count(),
    db.invoice.count(),
    db.payment.count(),
    db.interaction.count(),
    db.product.count(),
    db.customer.groupBy({ by: ["status"], _count: true }),
    db.deal.groupBy({ by: ["stage"], _count: true, _sum: { value: true } }),
    db.invoice.groupBy({ by: ["status"], _count: true, _sum: { totalAmount: true } }),
    db.payment.aggregate({
      where: { date: { gte: thisMonthStart } },
      _sum: { amount: true },
    }),
    db.payment.aggregate({
      where: { date: { gte: lastMonthStart, lte: lastMonthEnd } },
      _sum: { amount: true },
    }),
    db.customer.count({ where: { createdAt: { gte: thisMonthStart } } }),
    db.customer.count({
      where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
    }),
    db.deal.count({ where: { stage: { notIn: ["won", "lost"] } } }),
  ]);

  const totalRevenue = await db.payment.aggregate({ _sum: { amount: true } });
  const allInvoices = await db.invoice.findMany({
    include: { payments: true },
  });
  const derivedInvoiceStatuses = allInvoices.map((invoice) => {
    const paid = invoice.payments.reduce((s, p) => s + p.amount, 0);
    return {
      id: invoice.id,
      status: deriveInvoiceStatus(invoice.totalAmount, invoice.payments, invoice.dueDate, invoice.status),
      balance: Math.max(0, invoice.totalAmount - paid),
      totalAmount: invoice.totalAmount,
    };
  });
  const totalOutstanding = derivedInvoiceStatuses
    .filter((invoice) => invoice.status === "pending" || invoice.status === "overdue")
    .reduce((sum, invoice) => sum + invoice.balance, 0);
  const overdueCount = derivedInvoiceStatuses.filter((invoice) => invoice.status === "overdue").length;
  const totalDealsValue = await db.deal.aggregate({
    where: { stage: { notIn: ["won", "lost"] } },
    _sum: { value: true },
  });
  const wonDealsValue = await db.deal.aggregate({
    where: { stage: "won" },
    _sum: { value: true },
  });

  // Pipeline by stage (ordered)
  const pipeline = DEAL_STAGE_ORDER.map((stage) => {
    const found = dealsByStage.find((d) => d.stage === stage);
    return {
      stage,
      count: found?._count || 0,
      value: found?._sum.value || 0,
    };
  });

  // Customer status distribution
  const customerStatusDist = (["new", "lead", "active", "inactive"] as const).map((s) => ({
    status: s,
    count: customersByStatus.find((c) => c.status === s)?._count || 0,
  }));

  // Invoice status distribution derived from payments and due dates
  const invoiceStatusDist = (["draft", "pending", "paid", "overdue"] as const).map((s) => {
    const matching = derivedInvoiceStatuses.filter((invoice) => invoice.status === s);
    return {
      status: s,
      count: matching.length,
      amount: matching.reduce((sum, invoice) => sum + invoice.totalAmount, 0),
    };
  });

  // Revenue last 6 months
  const months: Array<{ label: string; revenue: number; key: string }> = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months.push({ label: d.toLocaleString("en-US", { month: "short" }), revenue: 0, key });
  }

  const allPayments = await db.payment.findMany({ select: { amount: true, date: true } });
  for (const p of allPayments) {
    const key = `${p.date.getFullYear()}-${String(p.date.getMonth() + 1).padStart(2, "0")}`;
    const m = months.find((mm) => mm.key === key);
    if (m) m.revenue += p.amount;
  }

  const invoiceAmountsByStatus = derivedInvoiceStatuses.reduce<Record<string, number>>((acc, invoice) => {
    acc[invoice.status] = (acc[invoice.status] || 0) + invoice.totalAmount;
    return acc;
  }, {});
  invoiceStatusDist.forEach((entry) => {
    entry.amount = invoiceAmountsByStatus[entry.status] || 0;
  });

  // Recent activity
  const recentInteractions = await db.interaction.findMany({
    take: 5,
    orderBy: { date: "desc" },
    include: { customer: true },
  });
  const recentPayments = await db.payment.findMany({
    take: 5,
    orderBy: { date: "desc" },
    include: { invoice: { include: { customer: true } } },
  });

  const recentInvoices = await db.invoice.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { customer: true, _count: { select: { payments: true } } },
  });

  return NextResponse.json({
    counts: { customers, deals, invoices, payments, interactions, products },
    revenue: {
      total: totalRevenue._sum.amount || 0,
      outstanding: totalOutstanding,
      pipeline: totalDealsValue._sum.value || 0,
      won: wonDealsValue._sum.value || 0,
    },
    // Real deltas for KPI cards
    deltas: {
      revenueThisMonth: revenueThisMonth._sum.amount || 0,
      revenueLastMonth: revenueLastMonth._sum.amount || 0,
      customersNewThisMonth,
      customersNewLastMonth,
      openDealsCount,
      overdueCount,
    },
    pipeline,
    customerStatusDist,
    invoiceStatusDist,
    revenueTrend: months.map((m) => ({ label: m.label, revenue: m.revenue })),
    recentInteractions,
    recentPayments,
    recentInvoices,
  });
}
