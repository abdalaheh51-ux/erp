import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deriveInvoiceStatus } from "@/lib/invoice-math";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payment = await db.payment.findUnique({
    where: { id },
    include: { invoice: { include: { customer: true } } },
  });
  if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(payment);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const payment = await db.payment.update({
    where: { id },
    data: {
      amount: body.amount !== undefined ? Number(body.amount) : undefined,
      paymentMethod: body.paymentMethod,
      date: body.date ? new Date(body.date) : undefined,
    },
    include: { invoice: { include: { customer: true } } },
  });

  const invoice = await db.invoice.findUnique({
    where: { id: payment.invoiceId },
    include: { payments: true },
  });
  if (invoice) {
    const nextStatus = deriveInvoiceStatus(invoice.totalAmount, invoice.payments, invoice.dueDate, invoice.status);
    if (nextStatus !== invoice.status) {
      await db.invoice.update({ where: { id: invoice.id }, data: { status: nextStatus } });
    }
  }

  return NextResponse.json(payment);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payment = await db.payment.findUnique({ where: { id } });
  if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.payment.delete({ where: { id } });

  const invoice = await db.invoice.findUnique({
    where: { id: payment.invoiceId },
    include: { payments: true },
  });
  if (invoice) {
    const nextStatus = deriveInvoiceStatus(invoice.totalAmount, invoice.payments, invoice.dueDate, invoice.status);
    if (nextStatus !== invoice.status) {
      await db.invoice.update({ where: { id: invoice.id }, data: { status: nextStatus } });
    }
  }

  return NextResponse.json({ ok: true });
}
