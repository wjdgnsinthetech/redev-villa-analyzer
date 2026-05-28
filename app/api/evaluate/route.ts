import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { surveys } from "@/lib/db/schema";
import { evaluateListing } from "@/lib/evaluate";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const { zoneId, areaPyeong, yearBuilt, floor, askingPrice } = body;

  if (!zoneId || !areaPyeong || !askingPrice) {
    return NextResponse.json(
      { error: "zoneId, areaPyeong, askingPrice는 필수입니다." },
      { status: 400 }
    );
  }

  const allSurveys = await db
    .select()
    .from(surveys)
    .where(eq(surveys.zoneId, Number(zoneId)));

  const result = evaluateListing(
    {
      zoneId: Number(zoneId),
      areaPyeong: Number(areaPyeong),
      yearBuilt: yearBuilt ? Number(yearBuilt) : undefined,
      floor: floor ? Number(floor) : undefined,
      askingPrice: Number(askingPrice),
    },
    allSurveys,
    body.tolerances
  );

  return NextResponse.json(result);
}
