import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { zones } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const rows = await db.select().from(zones).where(eq(zones.id, Number(id)));
  const zone = rows[0];
  if (!zone) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(zone);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const result = await db
    .update(zones)
    .set({
      ...body,
      updatedAt: sql`datetime('now','localtime')`,
    })
    .where(eq(zones.id, Number(id)))
    .returning();

  if (!result[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(result[0]);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(zones).where(eq(zones.id, Number(id)));
  return NextResponse.json({ ok: true });
}
