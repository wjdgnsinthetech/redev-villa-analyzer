"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPrice } from "@/lib/constants";
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Minus,
  DollarSign,
  Home,
  Building2,
  Percent,
  Target,
  PiggyBank,
  BarChart3,
} from "lucide-react";

interface ZoneOption {
  id: number;
  name: string;
  district: string;
  city: string;
  avgPricePerPyeong: number;
  surveyCount: number;
}

interface SimResult {
  // 입력 기반 계산
  권리가액: number;
  분양가총액: number;
  추가분담금: number;
  프리미엄: number;
  총투자액: number;
  예상시세: number;
  예상수익: number;
  수익률: number;
  // 판정
  verdict: "매력적" | "보통" | "주의" | "위험";
}

function calculate(
  매입가: number,
  감정가: number,
  비례율: number,
  희망평형: number,
  분양가단가: number,
  시세단가: number,
): SimResult | null {
  if (!매입가 || !감정가 || !비례율 || !희망평형 || !분양가단가 || !시세단가) return null;

  const 권리가액 = Math.round(감정가 * 비례율 / 100);
  const 분양가총액 = Math.round(희망평형 * 분양가단가);
  const 추가분담금 = 분양가총액 - 권리가액;
  const 프리미엄 = 매입가 - 감정가;
  const 총투자액 = 매입가 + Math.max(추가분담금, 0);
  const 예상시세 = Math.round(희망평형 * 시세단가);
  const 예상수익 = 예상시세 - 총투자액;
  const 수익률 = 총투자액 > 0 ? Math.round((예상수익 / 총투자액) * 1000) / 10 : 0;

  let verdict: SimResult["verdict"];
  if (수익률 >= 30) verdict = "매력적";
  else if (수익률 >= 10) verdict = "보통";
  else if (수익률 >= 0) verdict = "주의";
  else verdict = "위험";

  return { 권리가액, 분양가총액, 추가분담금, 프리미엄, 총투자액, 예상시세, 예상수익, 수익률, verdict };
}

const VERDICT_CONFIG = {
  "매력적": { color: "bg-emerald-100 text-emerald-800 border-emerald-300", icon: CheckCircle2, gradient: "from-emerald-400 to-green-500" },
  "보통": { color: "bg-blue-100 text-blue-800 border-blue-300", icon: Minus, gradient: "from-blue-400 to-indigo-500" },
  "주의": { color: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: AlertTriangle, gradient: "from-yellow-400 to-amber-500" },
  "위험": { color: "bg-red-100 text-red-800 border-red-300", icon: XCircle, gradient: "from-red-400 to-rose-500" },
};

export default function InvestPage() {
  const [zones, setZones] = useState<ZoneOption[]>([]);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  // 입력값
  const [매입가, set매입가] = useState("");
  const [감정가, set감정가] = useState("");
  const [비례율, set비례율] = useState("100");
  const [희망평형, set희망평형] = useState("");
  const [분양가단가, set분양가단가] = useState("");
  const [시세단가, set시세단가] = useState("");

  useEffect(() => {
    fetch("/api/zones")
      .then((r) => r.json())
      .then(setZones)
      .catch(console.error);
  }, []);

  // 구역 선택 시 평당가 참고값 자동 반영
  const selectedZoneData = zones.find((z) => z.id === Number(selectedZone));

  const result = useMemo(() => {
    return calculate(
      Number(매입가),
      Number(감정가),
      Number(비례율),
      Number(희망평형),
      Number(분양가단가),
      Number(시세단가),
    );
  }, [매입가, 감정가, 비례율, 희망평형, 분양가단가, 시세단가]);

  // 워터폴 차트 데이터
  const waterfallData = useMemo(() => {
    if (!result) return [];
    return [
      { label: "매입가", value: Number(매입가), type: "cost" as const },
      { label: "추가분담금", value: Math.max(result.추가분담금, 0), type: "cost" as const },
      { label: "총투자액", value: result.총투자액, type: "total" as const },
      { label: "예상시세", value: result.예상시세, type: "revenue" as const },
      { label: "예상수익", value: result.예상수익, type: result.예상수익 >= 0 ? "profit" as const : "loss" as const },
    ];
  }, [result, 매입가]);

  return (
    <div className="space-y-6 pb-20 md:pb-0 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Calculator className="w-6 h-6 text-primary" />
          투자 수익률 분석
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          재개발 빌라 매입 시 비례율·추가분담금·예상수익률을 시뮬레이션합니다.
        </p>
      </div>

      {/* 설명 카드 */}
      <Card className="glass-card border-0 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="py-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">계산 흐름:</span>{" "}
            매입가 → 감정가 × 비례율 = 권리가액 → 분양가 - 권리가액 = 추가분담금 → 총투자 대비 예상시세로 수익률 산출
          </p>
        </CardContent>
      </Card>

      {/* 입력 폼 */}
      <Card className="glass-card border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" />
            투자 조건 입력
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* 구역 선택 */}
          <div>
            <Label className="text-xs font-medium">참고 구역 (선택)</Label>
            <Select value={selectedZone} onValueChange={(v) => setSelectedZone(v)}>
              <SelectTrigger className="mt-1.5 w-full">
                <SelectValue placeholder="구역을 선택하면 평당가 참고" />
              </SelectTrigger>
              <SelectContent>
                {zones.map((z) => (
                  <SelectItem key={z.id} value={z.id.toString()}>
                    {z.name} ({z.city} {z.district}) — 평균 {formatPrice(z.avgPricePerPyeong)}/평
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedZoneData && selectedZoneData.avgPricePerPyeong > 0 && (
              <p className="text-[11px] text-muted-foreground mt-1.5">
                참고: {selectedZoneData.name} 평균 평당가 <span className="font-semibold text-primary">{formatPrice(selectedZoneData.avgPricePerPyeong)}/평</span> (시세 {selectedZoneData.surveyCount}건)
              </p>
            )}
          </div>

          {/* 매입 정보 */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5" />
              매입 조건
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px] text-muted-foreground">매입가 (만원) *</Label>
                <Input
                  type="number"
                  placeholder="예: 20000"
                  value={매입가}
                  onChange={(e) => set매입가(e.target.value)}
                  className="mt-1"
                />
                <p className="text-[10px] text-muted-foreground mt-0.5">실제 빌라 매수 금액</p>
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">감정가 (만원) *</Label>
                <Input
                  type="number"
                  placeholder="예: 15000"
                  value={감정가}
                  onChange={(e) => set감정가(e.target.value)}
                  className="mt-1"
                />
                <p className="text-[10px] text-muted-foreground mt-0.5">조합 종전자산 감정평가액</p>
              </div>
            </div>
          </div>

          {/* 사업 정보 */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              사업 조건
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-[11px] text-muted-foreground">비례율 (%) *</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="예: 100"
                  value={비례율}
                  onChange={(e) => set비례율(e.target.value)}
                  className="mt-1"
                />
                <p className="text-[10px] text-muted-foreground mt-0.5">보통 80~120%</p>
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">희망 평형 (평) *</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="예: 34"
                  value={희망평형}
                  onChange={(e) => set희망평형(e.target.value)}
                  className="mt-1"
                />
                <p className="text-[10px] text-muted-foreground mt-0.5">입주 희망 아파트 평형</p>
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">분양가 (만원/평) *</Label>
                <Input
                  type="number"
                  placeholder="예: 1800"
                  value={분양가단가}
                  onChange={(e) => set분양가단가(e.target.value)}
                  className="mt-1"
                />
                <p className="text-[10px] text-muted-foreground mt-0.5">예상 조합원 분양가</p>
              </div>
            </div>
          </div>

          {/* 시세 예상 */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" />
              예상 시세
            </p>
            <div>
              <Label className="text-[11px] text-muted-foreground">입주 후 예상 시세 (만원/평) *</Label>
              <Input
                type="number"
                placeholder="예: 2500"
                value={시세단가}
                onChange={(e) => set시세단가(e.target.value)}
                className="mt-1"
              />
              <p className="text-[10px] text-muted-foreground mt-0.5">입주 후 주변 아파트 시세 기준</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 결과 */}
      {result && (
        <div className="space-y-4 animate-in">
          {/* 수익률 히어로 */}
          <Card className="glass-card border-0 overflow-hidden">
            <div className={`h-2 w-full bg-gradient-to-r ${VERDICT_CONFIG[result.verdict].gradient}`} />
            <CardContent className="py-8">
              <div className="text-center space-y-4">
                <Badge className={`text-lg px-5 py-1.5 ${VERDICT_CONFIG[result.verdict].color}`}>
                  {result.verdict}
                </Badge>
                <p className={`text-5xl font-bold tabular-nums ${
                  result.수익률 > 0 ? "text-emerald-600" : result.수익률 < 0 ? "text-red-600" : "text-gray-600"
                }`}>
                  {result.수익률 > 0 ? "+" : ""}{result.수익률}%
                </p>
                <p className="text-sm text-muted-foreground">
                  예상 수익 <span className={`font-bold ${result.예상수익 >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {result.예상수익 >= 0 ? "+" : ""}{formatPrice(result.예상수익)}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 상세 분석 */}
          <Card className="glass-card border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                투자 구조 분석
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 흐름도 */}
              <div className="space-y-3">
                {/* 매입 단계 */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">매입 단계</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground">매입가</p>
                      <p className="text-base font-bold tabular-nums">{formatPrice(Number(매입가))}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground">감정가</p>
                      <p className="text-base font-bold tabular-nums">{formatPrice(Number(감정가))}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground">프리미엄</p>
                      <p className={`text-base font-bold tabular-nums ${result.프리미엄 > 0 ? "text-red-600" : "text-blue-600"}`}>
                        {result.프리미엄 > 0 ? "+" : ""}{formatPrice(result.프리미엄)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <ArrowRight className="w-4 h-4 text-primary rotate-90" />
                  </div>
                </div>

                {/* 권리 산정 */}
                <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200/60">
                  <p className="text-[10px] font-semibold text-indigo-500 uppercase tracking-wider mb-3">권리 산정</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground">감정가</p>
                      <p className="text-base font-bold tabular-nums">{formatPrice(Number(감정가))}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground">× 비례율</p>
                      <p className="text-base font-bold tabular-nums">{비례율}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground">= 권리가액</p>
                      <p className="text-base font-bold tabular-nums text-indigo-600">{formatPrice(result.권리가액)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <ArrowRight className="w-4 h-4 text-primary rotate-90" />
                  </div>
                </div>

                {/* 분양·분담금 */}
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/60">
                  <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider mb-3">분양 · 분담금</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground">분양가 ({희망평형}평)</p>
                      <p className="text-base font-bold tabular-nums">{formatPrice(result.분양가총액)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground">- 권리가액</p>
                      <p className="text-base font-bold tabular-nums">{formatPrice(result.권리가액)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground">= 추가분담금</p>
                      <p className={`text-base font-bold tabular-nums ${result.추가분담금 > 0 ? "text-red-600" : "text-emerald-600"}`}>
                        {result.추가분담금 > 0 ? "+" : ""}{formatPrice(result.추가분담금)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <ArrowRight className="w-4 h-4 text-primary rotate-90" />
                  </div>
                </div>

                {/* 최종 수익 */}
                <div className={`p-4 rounded-xl border ${result.예상수익 >= 0 ? "bg-emerald-50 border-emerald-200/60" : "bg-red-50 border-red-200/60"}`}>
                  <p className={`text-[10px] font-semibold uppercase tracking-wider mb-3 ${result.예상수익 >= 0 ? "text-emerald-600" : "text-red-600"}`}>최종 수익 분석</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground">총투자액</p>
                      <p className="text-base font-bold tabular-nums">{formatPrice(result.총투자액)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground">예상시세 ({희망평형}평)</p>
                      <p className="text-base font-bold tabular-nums">{formatPrice(result.예상시세)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground">예상수익</p>
                      <p className={`text-lg font-bold tabular-nums ${result.예상수익 >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {result.예상수익 >= 0 ? "+" : ""}{formatPrice(result.예상수익)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 워터폴 시각화 */}
              <div className="mt-6 pt-4 border-t border-border/30">
                <p className="text-xs font-semibold text-muted-foreground mb-3">투자 흐름 시각화</p>
                <div className="flex items-end gap-2 h-40">
                  {waterfallData.map((item) => {
                    const maxVal = Math.max(...waterfallData.map((d) => Math.abs(d.value)));
                    const heightPct = maxVal > 0 ? (Math.abs(item.value) / maxVal) * 100 : 0;
                    const colorClass =
                      item.type === "cost" ? "bg-gradient-to-t from-slate-400 to-slate-300" :
                      item.type === "total" ? "bg-gradient-to-t from-indigo-500 to-indigo-400" :
                      item.type === "revenue" ? "bg-gradient-to-t from-blue-500 to-blue-400" :
                      item.type === "profit" ? "bg-gradient-to-t from-emerald-500 to-emerald-400" :
                      "bg-gradient-to-t from-red-500 to-red-400";
                    return (
                      <div key={item.label} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">
                          {formatPrice(Math.abs(item.value))}
                        </span>
                        <div
                          className={`w-full rounded-t-lg ${colorClass} transition-all duration-500`}
                          style={{ height: `${Math.max(heightPct, 5)}%` }}
                        />
                        <span className="text-[10px] text-muted-foreground text-center leading-tight">{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 핵심 지표 요약 */}
              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border/30">
                <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Percent className="w-3.5 h-3.5 text-indigo-500" />
                    <p className="text-[10px] text-muted-foreground">프리미엄율</p>
                  </div>
                  <p className="text-lg font-bold tabular-nums">
                    {Number(감정가) > 0 ? Math.round((result.프리미엄 / Number(감정가)) * 100) : 0}%
                  </p>
                  <p className="text-[10px] text-muted-foreground">감정가 대비</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                  <div className="flex items-center gap-1.5 mb-1">
                    <PiggyBank className="w-3.5 h-3.5 text-emerald-500" />
                    <p className="text-[10px] text-muted-foreground">추가분담금 비율</p>
                  </div>
                  <p className="text-lg font-bold tabular-nums">
                    {result.분양가총액 > 0 ? Math.round((result.추가분담금 / result.분양가총액) * 100) : 0}%
                  </p>
                  <p className="text-[10px] text-muted-foreground">분양가 대비</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 참고사항 */}
          <div className="flex items-start gap-2 text-[11px] text-muted-foreground bg-muted/30 rounded-xl px-4 py-3">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
            <div>
              <p className="font-medium text-foreground">참고사항</p>
              <p className="mt-0.5 leading-relaxed">
                이 계산은 단순화된 시뮬레이션입니다. 실제 투자 시에는 취득세·양도세·금융비용·이주비·기간수익 등을 추가로 고려해야 합니다.
                비례율과 감정가는 사업 진행에 따라 변동될 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
