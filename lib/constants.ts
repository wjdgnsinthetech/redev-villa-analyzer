export const STAGES = [
  "정비구역지정",
  "조합설립인가",
  "사업시행인가",
  "관리처분인가",
  "착공",
  "준공",
] as const;

export type Stage = (typeof STAGES)[number];

export const STAGE_COLORS: Record<Stage, string> = {
  정비구역지정: "bg-gray-100 text-gray-700",
  조합설립인가: "bg-blue-100 text-blue-700",
  사업시행인가: "bg-indigo-100 text-indigo-700",
  관리처분인가: "bg-purple-100 text-purple-700",
  착공: "bg-orange-100 text-orange-700",
  준공: "bg-green-100 text-green-700",
};

export const TRANSACTION_TYPES = ["실거래", "호가", "추정"] as const;

export const LISTING_STATUSES = ["검토중", "관심", "패스", "계약"] as const;

export const VERDICT_STYLES: Record<string, string> = {
  적정: "bg-green-100 text-green-800 border-green-300",
  다소높음: "bg-yellow-100 text-yellow-800 border-yellow-300",
  고가: "bg-red-100 text-red-800 border-red-300",
  저렴: "bg-blue-100 text-blue-800 border-blue-300",
  매수검토: "bg-emerald-100 text-emerald-800 border-emerald-300",
};

export function pyeongToSqm(pyeong: number): number {
  return Math.round(pyeong * 3.306 * 100) / 100;
}

export function sqmToPyeong(sqm: number): number {
  return Math.round((sqm / 3.306) * 100) / 100;
}

export function formatPrice(manwon: number): string {
  if (manwon >= 10000) {
    const eok = Math.floor(manwon / 10000);
    const remainder = manwon % 10000;
    if (remainder === 0) return `${eok}억`;
    return `${eok}억 ${remainder.toLocaleString()}만`;
  }
  return `${manwon.toLocaleString()}만`;
}

export function formatPricePerPyeong(manwon: number): string {
  return `${manwon.toLocaleString()}만/평`;
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[0]}.${parts[1]}.${parts[2]}`;
  }
  if (parts.length === 2) {
    return `${parts[0]}.${parts[1]}`;
  }
  return dateStr;
}

export function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  const parts = dateStr.split("-");
  if (parts.length >= 2) {
    return `${parts[0].slice(2)}.${parts[1]}`;
  }
  return dateStr;
}
