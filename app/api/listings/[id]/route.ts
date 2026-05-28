import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { listings } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const result = await db
    .update(listings)
    .set({
      ...body,
      updatedAt: sql`datetime('now','localtime')`,
    })
    .where(eq(listings.id, Number(id)))
    .returning();

  if (!result[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(result[0]);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(listings).where(eq(listings.id, Number(id)));
  return NextResponse.json({ ok: true });
}
