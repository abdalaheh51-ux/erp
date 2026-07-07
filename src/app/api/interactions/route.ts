import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customerId");

  const where: Record<string, unknown> = {};
  if (customerId) where.customerId = customerId;

  const interactions = await db.interaction.findMany({
    where,
    orderBy: { date: "desc" },
    include: { customer: true },
  });
  return NextResponse.json(interactions);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const interaction = await db.interaction.create({
    data: {
      content: body.content,
      type: body.type || "note",
      date: body.date ? new Date(body.date) : new Date(),
      customerId: body.customerId,
    },
    include: { customer: true },
  });
  return NextResponse.json(interaction, { status: 201 });
}
