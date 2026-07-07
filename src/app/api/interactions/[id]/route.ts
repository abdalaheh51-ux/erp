import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const interaction = await db.interaction.findUnique({
    where: { id },
    include: { customer: true },
  });
  if (!interaction) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(interaction);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const interaction = await db.interaction.update({
    where: { id },
    data: {
      content: body.content,
      type: body.type,
      date: body.date ? new Date(body.date) : undefined,
      customerId: body.customerId,
    },
    include: { customer: true },
  });
  return NextResponse.json(interaction);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.interaction.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
