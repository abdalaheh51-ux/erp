import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = {};
  if (status && status !== "all") where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { phone: { contains: search } },
    ];
  }

  const customers = await db.customer.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { deals: true, invoices: true, interactions: true } },
    },
  });
  return NextResponse.json(customers);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const customer = await db.customer.create({
    data: {
      name: body.name,
      email: body.email || null,
      phone: body.phone || null,
      status: body.status || "new",
      source: body.source || null,
    },
  });
  return NextResponse.json(customer, { status: 201 });
}
