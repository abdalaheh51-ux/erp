import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await db.customer.findUnique({
    where: { id },
    include: {
      deals: { orderBy: { createdAt: "desc" } },
      interactions: { orderBy: { date: "desc" } },
      invoices: {
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { payments: true } } },
      },
      _count: { select: { deals: true, invoices: true, interactions: true } },
    },
  });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(customer);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const customer = await db.customer.update({
    where: { id },
    data: {
      name: body.name,
      email: body.email || null,
      phone: body.phone || null,
      status: body.status,
      source: body.source || null,
    },
  });
  return NextResponse.json(customer);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.customer.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
