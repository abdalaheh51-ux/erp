import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

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

  // Auto-update invoice status to paid if payments cover total
  if (body.recomputeStatus) {
    const payments = await db.payment.aggregate({
      where: { invoiceId: id },
      _sum: { amount: true },
    });
    const paid = payments._sum.amount || 0;
    if (paid >= invoice.totalAmount && invoice.totalAmount > 0) {
      await db.invoice.update({ where: { id }, data: { status: "paid" } });
    }
  }

  return NextResponse.json(invoice);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.invoice.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
