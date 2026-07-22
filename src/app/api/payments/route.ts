import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deriveInvoiceStatus } from "@/lib/invoice-math";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const invoiceId = searchParams.get("invoiceId");

  const where: Record<string, unknown> = {};
  if (invoiceId) where.invoiceId = invoiceId;

  const payments = await db.payment.findMany({
    where,
    orderBy: { date: "desc" },
    include: { invoice: { include: { customer: true } } },
  });
  return NextResponse.json(payments);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const payment = await db.payment.create({
    data: {
      invoiceId: body.invoiceId,
      amount: Number(body.amount) || 0,
      paymentMethod: body.paymentMethod || "cash",
      date: body.date ? new Date(body.date) : new Date(),
    },
    include: { invoice: { include: { customer: true } } },
  });

  // Auto-update invoice status based on payments and due date
  const invoice = await db.invoice.findUnique({
    where: { id: body.invoiceId },
    include: { payments: true },
  });
  if (invoice) {
    const nextStatus = deriveInvoiceStatus(
      invoice.totalAmount,
      invoice.payments,
      invoice.dueDate,
      invoice.status,
    );
    if (nextStatus !== invoice.status) {
      await db.invoice.update({ where: { id: invoice.id }, data: { status: nextStatus } });
    }
  }

  return NextResponse.json(payment, { status: 201 });
}
