import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { surveys } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const zoneId = req.nextUrl.searchParams.get("zoneId");

  const rows = zoneId
    ? await db
        .select()
        .from(surveys)
        .where(eq(surveys.zoneId, Number(zoneId)))
        .orderBy(desc(surveys.createdAt))
    : await db.select().from(surveys).orderBy(desc(surveys.createdAt));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const areaPyeong = Number(body.areaPyeong);
  const price = Number(body.price);
  const pricePerPyeong = Math.round(price / areaPyeong);
  const areaSqm = Math.round(areaPyeong * 3.306 * 100) / 100;

  const result = await db
    .insert(surveys)
    .values({
      zoneId: Number(body.zoneId),
      buildingName: body.buildingName || null,
      areaPyeong,
      areaSqm,
      yearBuilt: body.yearBuilt ? Number(body.yearBuilt) : null,
      floor: body.floor ? Number(body.floor) : null,
      totalFloors: body.totalFloors ? Number(body.totalFloors) : null,
      price,
      pricePerPyeong,
      transactionType: body.transactionType || "호가",
      surveyDate: body.surveyDate || null,
      source: body.source || null,
      notes: body.notes || null,
    })
    .returning();

  return NextResponse.json(result[0], { status: 201 });
}
