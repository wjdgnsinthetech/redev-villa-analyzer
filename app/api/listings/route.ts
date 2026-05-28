import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { listings } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const zoneId = req.nextUrl.searchParams.get("zoneId");

  const rows = zoneId
    ? await db
        .select()
        .from(listings)
        .where(eq(listings.zoneId, Number(zoneId)))
        .orderBy(desc(listings.createdAt))
    : await db.select().from(listings).orderBy(desc(listings.createdAt));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const areaPyeong = Number(body.areaPyeong);
  const askingPrice = Number(body.askingPrice);
  const askingPricePerPyeong = Math.round(askingPrice / areaPyeong);
  const areaSqm = Math.round(areaPyeong * 3.306 * 100) / 100;

  const result = await db
    .insert(listings)
    .values({
      zoneId: Number(body.zoneId),
      buildingName: body.buildingName || null,
      areaPyeong,
      areaSqm,
      yearBuilt: body.yearBuilt ? Number(body.yearBuilt) : null,
      floor: body.floor ? Number(body.floor) : null,
      totalFloors: body.totalFloors ? Number(body.totalFloors) : null,
      askingPrice,
      askingPricePerPyeong,
      assessedPrice: body.assessedPrice ? Number(body.assessedPrice) : null,
      priceGapPercent: body.priceGapPercent ?? null,
      verdict: body.verdict || null,
      matchedSurveyCount: body.matchedSurveyCount ?? null,
      source: body.source || null,
      status: body.status || "검토중",
      notes: body.notes || null,
    })
    .returning();

  return NextResponse.json(result[0], { status: 201 });
}
