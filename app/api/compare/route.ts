import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { zones, surveys, listings } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const idsParam = req.nextUrl.searchParams.get("ids");
  if (!idsParam) {
    return NextResponse.json({ error: "ids parameter required" }, { status: 400 });
  }

  const zoneIds = idsParam.split(",").map(Number).filter((n) => !isNaN(n));
  if (zoneIds.length === 0) {
    return NextResponse.json({ error: "no valid ids" }, { status: 400 });
  }

  const results = [];

  for (const zoneId of zoneIds) {
    const zoneRows = await db.select().from(zones).where(eq(zones.id, zoneId));
    const zone = zoneRows[0];
    if (!zone) continue;

    const surveyRows = await db
      .select()
      .from(surveys)
      .where(eq(surveys.zoneId, zoneId));

    const listingRows = await db
      .select()
      .from(listings)
      .where(eq(listings.zoneId, zoneId));

    const prices = surveyRows.map((s) => s.pricePerPyeong).sort((a, b) => a - b);
    const areas = surveyRows.map((s) => s.areaPyeong);
    const years = surveyRows.map((s) => s.yearBuilt).filter((y): y is number => y !== null);
    const dates = surveyRows.map((s) => s.surveyDate).filter((d): d is string => d !== null).sort();
    const buildings = new Set(surveyRows.map((s) => s.buildingName).filter(Boolean));

    const median =
      prices.length > 0
        ? prices.length % 2 === 1
          ? prices[Math.floor(prices.length / 2)]
          : Math.round((prices[Math.floor(prices.length / 2) - 1] + prices[Math.floor(prices.length / 2)]) / 2)
        : 0;

    const avg = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;

    const watchCount = listingRows.filter((l) => l.status === "관심").length;

    results.push({
      id: zone.id,
      name: zone.name,
      district: zone.district,
      city: zone.city,
      stage: zone.stage,
      estimatedMoveIn: zone.estimatedMoveIn,
      estimatedHouseholds: zone.estimatedHouseholds,
      notes: zone.notes,
      stats: {
        surveyCount: surveyRows.length,
        listingCount: listingRows.length,
        watchCount,
        buildingCount: buildings.size,
        avgPricePerPyeong: avg,
        medianPricePerPyeong: median,
        minPricePerPyeong: prices.length > 0 ? prices[0] : 0,
        maxPricePerPyeong: prices.length > 0 ? prices[prices.length - 1] : 0,
        avgArea: areas.length > 0 ? Math.round((areas.reduce((a, b) => a + b, 0) / areas.length) * 10) / 10 : 0,
        minArea: areas.length > 0 ? Math.min(...areas) : 0,
        maxArea: areas.length > 0 ? Math.max(...areas) : 0,
        avgYear: years.length > 0 ? Math.round(years.reduce((a, b) => a + b, 0) / years.length) : null,
        minYear: years.length > 0 ? Math.min(...years) : null,
        maxYear: years.length > 0 ? Math.max(...years) : null,
        earliestDate: dates.length > 0 ? dates[0] : null,
        latestDate: dates.length > 0 ? dates[dates.length - 1] : null,
        realTradeCount: surveyRows.filter((s) => s.transactionType === "실거래").length,
        askingCount: surveyRows.filter((s) => s.transactionType === "호가").length,
        estimatedCount: surveyRows.filter((s) => s.transactionType === "추정").length,
      },
    });
  }

  return NextResponse.json(results);
}
