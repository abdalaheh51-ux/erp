import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const customerId = searchParams.get("customerId");

  const where: Record<string, unknown> = {};
  if (status && status !== "all") where.status = status;
  if (customerId) where.customerId = customerId;

  const invoices = await db.invoice.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      customer: true,
      deal: true,
      items: { include: { product: true } },
      payments: true,
    },
  });
  return NextResponse.json(invoices);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Generate sequential invoice number
  const count = await db.invoice.count();
  const number = `INV-${String(count + 1).padStart(4, "0")}`;

  // Calculate total from items
  const items = (body.items || []) as Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
  const totalAmount = items.reduce(
    (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
    0,
  );

  const invoice = await db.invoice.create({
    data: {
      number,
      totalAmount,
      status: body.status || "draft",
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      customerId: body.customerId,
      dealId: body.dealId || null,
      items: {
        create: items.map((it) => ({
          productId: it.productId,
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice) || 0,
        })),
      },
    },
    include: {
      customer: true,
      deal: true,
      items: { include: { product: true } },
      payments: true,
    },
  });

  return NextResponse.json(invoice, { status: 201 });
}
