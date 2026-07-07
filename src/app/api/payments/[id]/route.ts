import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

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
  return NextResponse.json(payment);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.payment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
