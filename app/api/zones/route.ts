import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { zones, surveys } from "@/lib/db/schema";
import { sql, eq, desc } from "drizzle-orm";

export async function GET() {
  const rows = await db
    .select({
      id: zones.id,
      name: zones.name,
      district: zones.district,
      city: zones.city,
      stage: zones.stage,
      estimatedMoveIn: zones.estimatedMoveIn,
      estimatedHouseholds: zones.estimatedHouseholds,
      notes: zones.notes,
      createdAt: zones.createdAt,
      updatedAt: zones.updatedAt,
      surveyCount: sql<number>`count(${surveys.id})`,
      avgPricePerPyeong: sql<number>`cast(coalesce(avg(${surveys.pricePerPyeong}), 0) as integer)`,
    })
    .from(zones)
    .leftJoin(surveys, eq(zones.id, surveys.zoneId))
    .groupBy(zones.id)
    .orderBy(desc(zones.createdAt));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = await db
    .insert(zones)
    .values({
      name: body.name,
      district: body.district,
      city: body.city || "서울",
      stage: body.stage || "정비구역지정",
      estimatedMoveIn: body.estimatedMoveIn || null,
      estimatedHouseholds: body.estimatedHouseholds || null,
      notes: body.notes || null,
    })
    .returning();

  return NextResponse.json(result[0], { status: 201 });
}
