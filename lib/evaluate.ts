import type { Survey } from "./db/schema";

export interface EvaluateInput {
  zoneId: number;
  areaPyeong: number;
  yearBuilt?: number;
  floor?: number;
  askingPrice: number;
}

export interface EvaluateTolerances {
  areaTolerance: number;
  yearTolerance: number;
  floorTolerance: number;
}

export type Verdict = "적정" | "다소높음" | "고가" | "저렴" | "매수검토";

export interface EvaluateResult {
  verdict: Verdict;
  askingPricePerPyeong: number;
  medianPricePerPyeong: number;
  avgPricePerPyeong: number;
  minPricePerPyeong: number;
  maxPricePerPyeong: number;
  priceGapPercent: number;
  matchedCount: number;
  matchedSurveys: Survey[];
  assessedPrice: number;
  warning?: string;
}

const DEFAULT_TOLERANCES: EvaluateTolerances = {
  areaTolerance: 3,
  yearTolerance: 5,
  floorTolerance: 2,
};

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function getVerdict(gapPercent: number): Verdict {
  const abs = Math.abs(gapPercent);
  if (abs <= 10) return "적정";
  if (gapPercent > 20) return "고가";
  if (gapPercent > 10) return "다소높음";
  if (gapPercent < -20) return "매수검토";
  return "저렴";
}

export function evaluateListing(
  input: EvaluateInput,
  allSurveys: Survey[],
  tolerances: EvaluateTolerances = DEFAULT_TOLERANCES
): EvaluateResult {
  const zoneSurveys = allSurveys.filter((s) => s.zoneId === input.zoneId);

  let matched = zoneSurveys.filter((s) => {
    const areaDiff = Math.abs(s.areaPyeong - input.areaPyeong);
    if (areaDiff > tolerances.areaTolerance) return false;

    if (input.yearBuilt && s.yearBuilt) {
      const yearDiff = Math.abs(s.yearBuilt - input.yearBuilt);
      if (yearDiff > tolerances.yearTolerance) return false;
    }

    if (input.floor && s.floor) {
      const floorDiff = Math.abs(s.floor - input.floor);
      if (floorDiff > tolerances.floorTolerance) return false;
    }

    return true;
  });

  let warning: string | undefined;

  if (matched.length < 3) {
    warning = `유사 조건 데이터가 ${matched.length}건으로 부족합니다. 조건을 완화하여 재검색합니다.`;
    matched = zoneSurveys.filter((s) => {
      const areaDiff = Math.abs(s.areaPyeong - input.areaPyeong);
      return areaDiff <= tolerances.areaTolerance * 2;
    });

    if (matched.length < 3) {
      matched = zoneSurveys;
      warning = `유사 조건 데이터가 부족하여 구역 전체 데이터(${matched.length}건)로 비교합니다.`;
    }
  }

  if (matched.length === 0) {
    const askingPPP = Math.round(input.askingPrice / input.areaPyeong);
    return {
      verdict: "적정",
      askingPricePerPyeong: askingPPP,
      medianPricePerPyeong: 0,
      avgPricePerPyeong: 0,
      minPricePerPyeong: 0,
      maxPricePerPyeong: 0,
      priceGapPercent: 0,
      matchedCount: 0,
      matchedSurveys: [],
      assessedPrice: 0,
      warning: "비교 가능한 시세 데이터가 없습니다. 먼저 시세 조사를 등록해주세요.",
    };
  }

  const ppps = matched.map((s) => s.pricePerPyeong);
  const med = median(ppps);
  const avg = Math.round(ppps.reduce((a, b) => a + b, 0) / ppps.length);
  const min = Math.min(...ppps);
  const max = Math.max(...ppps);

  const askingPPP = Math.round(input.askingPrice / input.areaPyeong);
  const gap = ((askingPPP - med) / med) * 100;
  const roundedGap = Math.round(gap * 10) / 10;

  const assessedPrice = Math.round(med * input.areaPyeong);

  return {
    verdict: getVerdict(roundedGap),
    askingPricePerPyeong: askingPPP,
    medianPricePerPyeong: med,
    avgPricePerPyeong: avg,
    minPricePerPyeong: min,
    maxPricePerPyeong: max,
    priceGapPercent: roundedGap,
    matchedCount: matched.length,
    matchedSurveys: matched,
    assessedPrice,
    warning,
  };
}
