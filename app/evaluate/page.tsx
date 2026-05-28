"use client";

import { useEffect, useState } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice, formatDateShort, VERDICT_STYLES } from "@/lib/constants";
import type { EvaluateResult } from "@/lib/evaluate";
import {
  Zap,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Target,
  Hash,
  ArrowUpDown,
} from "lucide-react";

interface ZoneOption {
  id: number;
  name: string;
  district: string;
  surveyCount: number;
}

export default function EvaluatePage() {
  const [zones, setZones] = useState<ZoneOption[]>([]);
  const [selectedZone, setSelectedZone] = useState("");
  const [areaPyeong, setAreaPyeong] = useState("");
  const [yearBuilt, setYearBuilt] = useState("");
  const [floor, setFloor] = useState("");
  const [askingPrice, setAskingPrice] = useState("");
  const [result, setResult] = useState<EvaluateResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/zones")
      .then((r) => r.json())
      .then(setZones)
      .catch(console.error);
  }, []);

  const evaluate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zoneId: Number(selectedZone),
          areaPyeong: Number(areaPyeong),
          yearBuilt: yearBuilt ? Number(yearBuilt) : undefined,
          floor: floor ? Number(floor) : undefined,
          askingPrice: Number(askingPrice),
        }),
      });
      const data: EvaluateResult = await res.json();
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const canEvaluate = selectedZone && areaPyeong && askingPrice;
  const selectedZoneData = zones.find((z) => z.id === Number(selectedZone));

  return (
    <div className="space-y-6 pb-20 md:pb-0 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Zap className="w-6 h-6 text-primary" />
          빠른 매물 평가
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          매물 조건을 입력하면 시세 대비 적정가를 바로 확인할 수 있습니다.
        </p>
      </div>

      <Card className="glass-card border-0">
        <CardContent className="pt-6 space-y-4">
          <div>
            <Label className="text-xs font-medium">구역 선택 *</Label>
            <Select value={selectedZone} onValueChange={(v) => setSelectedZone(v ?? "")}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="구역을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {zones.map((z) => (
                  <SelectItem key={z.id} value={z.id.toString()}>
                    {z.name} ({z.district}) — 시세 {z.surveyCount}건
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedZoneData && selectedZoneData.surveyCount === 0 && (
              <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mt-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                시세 데이터가 없습니다. 먼저 시세를 등록해주세요.
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium">평형 *</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="예: 12.5"
                value={areaPyeong}
                onChange={(e) => setAreaPyeong(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">호가 (만원) *</Label>
              <Input
                type="number"
                placeholder="예: 32000"
                value={askingPrice}
                onChange={(e) => setAskingPrice(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">준공연도</Label>
              <Input
                type="number"
                placeholder="예: 2003"
                value={yearBuilt}
                onChange={(e) => setYearBuilt(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">층</Label>
              <Input
                type="number"
                placeholder="예: 3"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>

          <Button
            onClick={evaluate}
            disabled={!canEvaluate || loading}
            className="w-full text-base py-6 gradient-primary border-0 shadow-lg shadow-primary/25 hover:opacity-90 transition-opacity"
            size="lg"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                평가 중...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 mr-2" />
                평가하기
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Result */}
      {result && (
        <div className="space-y-4 animate-in">
          {/* Verdict hero */}
          <Card className="glass-card border-0 overflow-hidden">
            <div className={`h-1.5 w-full ${
              result.verdict === "적정" ? "bg-gradient-to-r from-green-400 to-emerald-500" :
              result.verdict === "다소높음" ? "bg-gradient-to-r from-yellow-400 to-amber-500" :
              result.verdict === "고가" ? "bg-gradient-to-r from-red-400 to-rose-500" :
              result.verdict === "저렴" ? "bg-gradient-to-r from-blue-400 to-cyan-500" :
              "bg-gradient-to-r from-emerald-400 to-teal-500"
            }`} />
            <CardContent className="py-8">
              <div className="text-center space-y-4">
                <Badge className={`text-xl px-6 py-2 ${VERDICT_STYLES[result.verdict] || ""}`}>
                  {result.verdict}
                </Badge>
                <p className={`text-5xl font-bold tabular-nums ${
                  result.priceGapPercent > 0 ? "text-red-600" : result.priceGapPercent < 0 ? "text-blue-600" : "text-green-600"
                }`}>
                  {result.priceGapPercent > 0 ? "+" : ""}
                  {result.priceGapPercent}%
                </p>
                {result.warning && (
                  <div className="inline-flex items-center gap-1.5 text-sm text-amber-700 bg-amber-50 rounded-lg px-4 py-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {result.warning}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-8">
                {[
                  { label: "호가 평당가", value: formatPrice(result.askingPricePerPyeong), icon: TrendingUp, color: "text-foreground" },
                  { label: "시세 중앙값", value: formatPrice(result.medianPricePerPyeong), icon: ArrowUpDown, color: "text-primary" },
                  { label: "적정 추정가", value: formatPrice(result.assessedPrice), icon: Target, color: "text-emerald-600" },
                  { label: "비교 건수", value: result.matchedCount + "건", icon: Hash, color: "text-muted-foreground" },
                ].map((item) => (
                  <div key={item.label} className="p-4 rounded-xl bg-muted/30 border border-border/40">
                    <div className="flex items-center gap-1.5 mb-1">
                      <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                      <p className="text-[11px] text-muted-foreground">{item.label}</p>
                    </div>
                    <p className="text-lg font-bold tabular-nums">{item.value}</p>
                  </div>
                ))}
              </div>

              <p className="text-center text-xs text-muted-foreground mt-4 tabular-nums">
                평당가 범위: {formatPrice(result.minPricePerPyeong)} ~ {formatPrice(result.maxPricePerPyeong)}
              </p>
            </CardContent>
          </Card>

          {/* Matched surveys */}
          {result.matchedSurveys.length > 0 && (
            <Card className="glass-card border-0 overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">
                  비교 시세 데이터 ({result.matchedCount}건)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="font-semibold text-xs">건물명</TableHead>
                        <TableHead className="text-right font-semibold text-xs">거래일</TableHead>
                        <TableHead className="text-right font-semibold text-xs">평형</TableHead>
                        <TableHead className="text-right font-semibold text-xs">연식</TableHead>
                        <TableHead className="text-right font-semibold text-xs">층</TableHead>
                        <TableHead className="text-right font-semibold text-xs">가격</TableHead>
                        <TableHead className="text-right font-semibold text-xs">평당가</TableHead>
                        <TableHead className="font-semibold text-xs">유형</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.matchedSurveys.map((s) => (
                        <TableRow key={s.id} className="hover:bg-accent/40 transition-colors">
                          <TableCell className="text-sm">{s.buildingName || "-"}</TableCell>
                          <TableCell className="text-right text-sm tabular-nums text-muted-foreground">{formatDateShort(s.surveyDate)}</TableCell>
                          <TableCell className="text-right text-sm tabular-nums">{s.areaPyeong}평</TableCell>
                          <TableCell className="text-right text-sm tabular-nums">{s.yearBuilt || "-"}</TableCell>
                          <TableCell className="text-right text-sm tabular-nums">{s.floor ? `${s.floor}층` : "-"}</TableCell>
                          <TableCell className="text-right font-semibold text-sm tabular-nums">{formatPrice(s.price)}</TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground tabular-nums">{formatPrice(s.pricePerPyeong)}/평</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] font-normal">{s.transactionType}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
