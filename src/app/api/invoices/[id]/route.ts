import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deriveInvoiceStatus } from "@/lib/invoice-math";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await db.invoice.findUnique({
    where: { id },
    include: {
      customer: true,
      deal: true,
      items: { include: { product: true } },
      payments: { orderBy: { date: "desc" } },
    },
  });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(invoice);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  // If items are provided, replace them and recompute total
  const hasItems = Array.isArray(body.items);

  const totalAmount = hasItems
    ? (body.items as Array<{ quantity: number; unitPrice: number }>).reduce(
        (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
        0,
      )
    : undefined;

  if (hasItems) {
    await db.invoiceItem.deleteMany({ where: { invoiceId: id } });
  }

  const invoice = await db.invoice.update({
    where: { id },
    data: {
      status: body.status,
      dueDate: body.dueDate ? new Date(body.dueDate) : body.dueDate === null ? null : undefined,
      customerId: body.customerId,
      dealId: body.dealId || null,
      ...(totalAmount !== undefined ? { totalAmount } : {}),
      ...(hasItems
        ? {
            items: {
              create: (body.items as Array<{ productId: string; quantity: number; unitPrice: number }>).map((it) => ({
                productId: it.productId,
                quantity: Number(it.quantity) || 1,
                unitPrice: Number(it.unitPrice) || 0,
              })),
            },
          }
        : {}),
    },
    include: {
      customer: true,
      deal: true,
      items: { include: { product: true } },
      payments: true,
    },
  });

  // Auto-update invoice status based on payments and due date
  if (body.recomputeStatus) {
    const payments = await db.payment.findMany({ where: { invoiceId: id }, select: { amount: true } });
    const nextStatus = deriveInvoiceStatus(invoice.totalAmount, payments, invoice.dueDate, invoice.status);
    if (nextStatus !== invoice.status) {
      await db.invoice.update({ where: { id }, data: { status: nextStatus } });
    }
  }

  return NextResponse.json(invoice);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.invoice.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
