import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");

  const where: Record<string, unknown> = {};
  if (search) where.name = { contains: search };

  const products = await db.product.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { invoiceItems: true } } },
  });
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const product = await db.product.create({
    data: {
      name: body.name,
      price: Number(body.price) || 0,
      description: body.description || null,
    },
  });
  return NextResponse.json(product, { status: 201 });
}
