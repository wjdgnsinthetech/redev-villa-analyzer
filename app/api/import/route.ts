import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { zones, surveys } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { parseLawdInfo } from "@/lib/lawd-codes";
import { fetchRealTradingRange, type RealTradingItem } from "@/lib/realtrading";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { zoneId, fromYm, toYm, minPrice, minAreaPyeong } = body;

  if (!zoneId || !fromYm || !toYm) {
    return NextResponse.json(
      { error: "zoneId, fromYm, toYm 필수" },
      { status: 400 }
    );
  }

  // API 키 확인
  const serviceKey = process.env.DATA_GO_KR_API_KEY;
  if (!serviceKey) {
    return NextResponse.json(
      { error: "API 키가 설정되지 않았습니다. .env.local에 DATA_GO_KR_API_KEY를 추가해주세요." },
      { status: 500 }
    );
  }

  // 구역 정보 조회
  const zoneRows = await db.select().from(zones).where(eq(zones.id, Number(zoneId)));
  const zone = zoneRows[0];
  if (!zone) {
    return NextResponse.json({ error: "구역을 찾을 수 없습니다" }, { status: 404 });
  }

  // LAWD 코드 파싱
  const lawdInfo = parseLawdInfo(zone.city, zone.district);
  if (!lawdInfo) {
    return NextResponse.json(
      {
        error: `법정동코드를 찾을 수 없습니다: ${zone.city} ${zone.district}. 지원하는 지역인지 확인해주세요.`,
      },
      { status: 400 }
    );
  }

  try {
    // API 호출
    const debugErrors: string[] = [];
    const items = await fetchRealTradingRange(
      serviceKey,
      lawdInfo.lawdCd,
      lawdInfo.dong,
      fromYm,
      toYm,
      debugErrors
    );

    // 필터링
    let filtered = items;

    // 최소 가격 필터 (지분거래 등 제외)
    const minPriceVal = minPrice ? Number(minPrice) : 0;
    if (minPriceVal > 0) {
      filtered = filtered.filter((item) => item.price >= minPriceVal);
    }

    // 최소 면적 필터
    const minAreaVal = minAreaPyeong ? Number(minAreaPyeong) : 0;
    if (minAreaVal > 0) {
      filtered = filtered.filter((item) => item.areaPyeong >= minAreaVal);
    }

    // 중복 체크 및 DB 삽입
    let imported = 0;
    let skipped = 0;
    const importedItems: Array<{
      buildingName: string;
      areaPyeong: number;
      price: number;
      surveyDate: string;
    }> = [];

    for (const item of filtered) {
      // 중복 체크: 같은 구역 + 건물명 + 가격 + 날짜
      const [existing] = await db
        .select({ count: sql<number>`count(*)` })
        .from(surveys)
        .where(
          and(
            eq(surveys.zoneId, Number(zoneId)),
            eq(surveys.buildingName, item.buildingName),
            eq(surveys.price, item.price),
            eq(surveys.surveyDate, item.surveyDate)
          )
        );

      if (existing && existing.count > 0) {
        skipped++;
        continue;
      }

      await db.insert(surveys)
        .values({
          zoneId: Number(zoneId),
          buildingName: item.buildingName,
          areaPyeong: item.areaPyeong,
          areaSqm: item.areaSqm,
          yearBuilt: item.yearBuilt,
          floor: item.floor,
          totalFloors: null,
          price: item.price,
          pricePerPyeong: item.pricePerPyeong,
          transactionType: "실거래",
          surveyDate: item.surveyDate,
          source: "국토교통부 실거래가",
          notes: item.jibun ? `지번: ${item.jibun}` : null,
        });

      imported++;
      importedItems.push({
        buildingName: item.buildingName,
        areaPyeong: item.areaPyeong,
        price: item.price,
        surveyDate: item.surveyDate,
      });
    }

    return NextResponse.json({
      success: true,
      zone: zone.name,
      dong: lawdInfo.dong,
      lawdCd: lawdInfo.lawdCd,
      period: `${fromYm}~${toYm}`,
      fetched: items.length,
      filtered: filtered.length,
      imported,
      skipped,
      items: importedItems,
      debugErrors: debugErrors.length > 0 ? debugErrors : undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `API 호출 실패: ${message}` }, { status: 500 });
  }
}
