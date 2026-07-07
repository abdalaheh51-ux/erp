import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deal = await db.deal.findUnique({
    where: { id },
    include: { customer: true, invoices: true },
  });
  if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(deal);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const deal = await db.deal.update({
    where: { id },
    data: {
      title: body.title,
      value: body.value !== undefined ? Number(body.value) : undefined,
      stage: body.stage,
      customerId: body.customerId,
    },
    include: { customer: true },
  });
  return NextResponse.json(deal);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.deal.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
