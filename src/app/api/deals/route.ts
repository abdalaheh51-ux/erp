import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const stage = searchParams.get("stage");
  const customerId = searchParams.get("customerId");

  const where: Record<string, unknown> = {};
  if (stage && stage !== "all") where.stage = stage;
  if (customerId) where.customerId = customerId;

  const deals = await db.deal.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { customer: true },
  });
  return NextResponse.json(deals);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const deal = await db.deal.create({
    data: {
      title: body.title,
      value: Number(body.value) || 0,
      stage: body.stage || "contact",
      customerId: body.customerId,
    },
    include: { customer: true },
  });
  return NextResponse.json(deal, { status: 201 });
}
