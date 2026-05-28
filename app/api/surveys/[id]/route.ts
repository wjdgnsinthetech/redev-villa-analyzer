import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { surveys } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const updates: Record<string, unknown> = {
    ...body,
    updatedAt: sql`datetime('now','localtime')`,
  };

  if (body.areaPyeong) {
    updates.areaSqm = Math.round(Number(body.areaPyeong) * 3.306 * 100) / 100;
  }
  if (body.areaPyeong && body.price) {
    updates.pricePerPyeong = Math.round(
      Number(body.price) / Number(body.areaPyeong)
    );
  }

  const result = await db
    .update(surveys)
    .set(updates)
    .where(eq(surveys.id, Number(id)))
    .returning();

  if (!result[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(result[0]);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(surveys).where(eq(surveys.id, Number(id)));
  return NextResponse.json({ ok: true });
}
