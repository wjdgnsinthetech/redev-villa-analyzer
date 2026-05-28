import { XMLParser } from "fast-xml-parser";

const API_BASE =
  "https://apis.data.go.kr/1613000/RTMSDataSvcRHTrade/getRTMSDataSvcRHTrade";

export interface RealTradingItem {
  buildingName: string;
  areaSqm: number;
  areaPyeong: number;
  yearBuilt: number | null;
  floor: number | null;
  price: number; // 만원
  pricePerPyeong: number;
  surveyDate: string; // YYYY-MM-DD
  dong: string;
  jibun: string;
}

/**
 * API 응답 필드 (영문 키)
 * buildYear, dealAmount, dealDay, dealMonth, dealYear,
 * excluUseAr, floor, jibun, mhouseNm, umdNm, sggCd, ...
 */
interface ApiItem {
  dealAmount?: string;
  buildYear?: number | string;
  dealYear?: number | string;
  dealMonth?: number | string;
  dealDay?: number | string;
  umdNm?: string; // 법정동
  excluUseAr?: number | string; // 전용면적
  floor?: number | string;
  mhouseNm?: string; // 연립다세대 이름
  jibun?: string;
  houseType?: string; // 다세대, 연립
  cdealType?: string; // 해제 여부 (O = 취소)
}

/**
 * 국토교통부 연립다세대 매매 실거래 API 호출
 */
export async function fetchRealTrading(
  serviceKey: string,
  lawdCd: string,
  dealYmd: string, // YYYYMM
  pageNo = 1,
  numOfRows = 1000
): Promise<{ items: RealTradingItem[]; totalCount: number }> {
  // URL을 직접 구성 (serviceKey는 이미 인코딩된 상태일 수 있으므로)
  const url = `${API_BASE}?serviceKey=${serviceKey}&LAWD_CD=${lawdCd}&DEAL_YMD=${dealYmd}&pageNo=${pageNo}&numOfRows=${numOfRows}`;

  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
  });

  const text = await res.text();

  // HTML 에러 응답 체크
  if (text.includes("<!DOCTYPE") || text.includes("<HTML")) {
    throw new Error(`API returned HTML error (status ${res.status}). 키를 확인해주세요.`);
  }

  const parser = new XMLParser({
    ignoreAttributes: false,
    trimValues: true,
  });

  const parsed = parser.parse(text);

  // 에러 체크 — resultCode: XML "000" → parser가 숫자 0으로 변환할 수 있음
  const header = parsed?.response?.header;
  if (header) {
    const code = Number(header.resultCode);
    if (code !== 0) {
      throw new Error(
        `API Error: ${header.resultCode} - ${header.resultMsg || "Unknown error"}`
      );
    }
  }

  const body = parsed?.response?.body;
  if (!body) {
    throw new Error("Invalid API response: no body");
  }

  const totalCount = Number(body.totalCount || 0);

  if (totalCount === 0 || !body.items) {
    return { items: [], totalCount: 0 };
  }

  // items.item이 단일 객체일 수도 있고 배열일 수도 있음
  const rawItems: ApiItem[] = Array.isArray(body.items.item)
    ? body.items.item
    : body.items.item
    ? [body.items.item]
    : [];

  const items: RealTradingItem[] = rawItems
    .map((item) => {
      // 취소 거래 제외
      if (item.cdealType && String(item.cdealType).trim() === "O") {
        return null;
      }

      const priceStr = String(item.dealAmount || "0").replace(/,/g, "").trim();
      const price = parseInt(priceStr, 10);
      if (isNaN(price) || price <= 0) return null;

      const areaSqm = parseFloat(String(item.excluUseAr || "0"));
      if (areaSqm <= 0) return null;

      const areaPyeong = Math.round((areaSqm / 3.306) * 10) / 10;
      const pricePerPyeong = areaPyeong > 0 ? Math.round(price / areaPyeong) : 0;

      const yearBuilt = item.buildYear ? Number(item.buildYear) : null;
      const floor = item.floor ? Number(item.floor) : null;

      const year = String(item.dealYear || "");
      const month = String(item.dealMonth || "").padStart(2, "0");
      const day = String(item.dealDay || "").padStart(2, "0");
      const surveyDate = `${year}-${month}-${day}`;

      const dong = String(item.umdNm || "").trim();
      const buildingName = String(item.mhouseNm || "").trim();
      const jibun = String(item.jibun || "").trim();

      return {
        buildingName: buildingName || "(미상)",
        areaSqm,
        areaPyeong,
        yearBuilt: yearBuilt && !isNaN(yearBuilt) ? yearBuilt : null,
        floor: floor && !isNaN(floor) ? floor : null,
        price,
        pricePerPyeong,
        surveyDate,
        dong,
        jibun,
      };
    })
    .filter((item): item is RealTradingItem => item !== null);

  return { items, totalCount };
}

/**
 * 여러 달 데이터를 한번에 가져오기
 */
export async function fetchRealTradingRange(
  serviceKey: string,
  lawdCd: string,
  dongFilter: string, // 필터링할 법정동 이름 (e.g., "흑석동")
  fromYm: string, // YYYYMM
  toYm: string, // YYYYMM
  debugErrors?: string[]
): Promise<RealTradingItem[]> {
  const allItems: RealTradingItem[] = [];

  // YYYYMM 범위 생성
  const months = generateMonthRange(fromYm, toYm);

  for (const ym of months) {
    try {
      const { items, totalCount } = await fetchRealTrading(serviceKey, lawdCd, ym);

      // 법정동 필터링
      const filtered = dongFilter
        ? items.filter((item) => item.dong.includes(dongFilter))
        : items;

      debugErrors?.push(`${ym}: total=${totalCount}, parsed=${items.length}, dong_filtered=${filtered.length}`);
      allItems.push(...filtered);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Failed to fetch ${ym}:`, msg);
      debugErrors?.push(`${ym}: ERROR - ${msg}`);
    }
  }

  return allItems;
}

function generateMonthRange(from: string, to: string): string[] {
  const months: string[] = [];
  let year = parseInt(from.slice(0, 4));
  let month = parseInt(from.slice(4, 6));
  const toYear = parseInt(to.slice(0, 4));
  const toMonth = parseInt(to.slice(4, 6));

  while (year < toYear || (year === toYear && month <= toMonth)) {
    months.push(`${year}${String(month).padStart(2, "0")}`);
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }

  return months;
}
