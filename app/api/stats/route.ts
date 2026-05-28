import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { zones, surveys, listings } from "@/lib/db/schema";
import { eq, sql, desc } from "drizzle-orm";

export async function GET() {
  const [zoneCountRow] = await db.select({ count: sql<number>`count(*)` }).from(zones);
  const [surveyCountRow] = await db.select({ count: sql<number>`count(*)` }).from(surveys);
  const [listingCountRow] = await db.select({ count: sql<number>`count(*)` }).from(listings);
  const [watchCountRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(listings)
    .where(eq(listings.status, "관심"));

  const zoneCount = zoneCountRow?.count ?? 0;
  const surveyCount = surveyCountRow?.count ?? 0;
  const listingCount = listingCountRow?.count ?? 0;
  const watchCount = watchCountRow?.count ?? 0;

  const zoneRanking = await db
    .select({
      id: zones.id,
      name: zones.name,
      district: zones.district,
      city: zones.city,
      stage: zones.stage,
      avgPricePerPyeong: sql<number>`cast(avg(${surveys.pricePerPyeong}) as integer)`,
      surveyCount: sql<number>`count(${surveys.id})`,
      latestSurveyDate: sql<string>`max(${surveys.surveyDate})`,
    })
    .from(zones)
    .innerJoin(surveys, eq(zones.id, surveys.zoneId))
    .groupBy(zones.id)
    .orderBy(desc(sql`avg(${surveys.pricePerPyeong})`))
    .limit(10);

  const recentListings = await db
    .select({
      id: listings.id,
      zoneId: listings.zoneId,
      zoneName: zones.name,
      buildingName: listings.buildingName,
      areaPyeong: listings.areaPyeong,
      askingPrice: listings.askingPrice,
      verdict: listings.verdict,
      createdAt: listings.createdAt,
    })
    .from(listings)
    .innerJoin(zones, eq(listings.zoneId, zones.id))
    .orderBy(desc(listings.createdAt))
    .limit(10);

  return NextResponse.json({
    zoneCount,
    surveyCount,
    listingCount,
    watchCount,
    zoneRanking,
    recentListings,
  });
}
