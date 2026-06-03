"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
import { formatPrice, STAGE_COLORS, type Stage } from "@/lib/constants";
import {
  Download,
  Database,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowRight,
  FileDown,
  MapPin,
  ExternalLink,
  Info,
  BarChart3,
  Filter,
} from "lucide-react";

interface ZoneOption {
  id: number;
  name: string;
  district: string;
  city: string;
  stage: string;
  surveyCount: number;
  avgPricePerPyeong: number;
}

interface ImportResult {
  success: boolean;
  zone: string;
  dong: string;
  period: string;
  fetched: number;
  filtered: number;
  imported: number;
  skipped: number;
  items: {
    buildingName: string;
    areaPyeong: number;
    price: number;
    surveyDate: string;
  }[];
  error?: string;
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export default function ImportPage() {
  const [zones, setZones] = useState<ZoneOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [fromYear, setFromYear] = useState(String(CURRENT_YEAR - 1));
  const [fromMonth, setFromMonth] = useState("01");
  const [toYear, setToYear] = useState(String(CURRENT_YEAR));
  const [toMonth, setToMonth] = useState(String(new Date().getMonth() + 1).padStart(2, "0"));
  const [minPrice, setMinPrice] = useState("1000");
  const [minArea, setMinArea] = useState("5");

  // Import state
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/zones")
      .then((r) => r.json())
      .then(setZones)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const selectedZoneData = zones.find((z) => String(z.id) === selectedZone);

  const handleImport = async () => {
    if (!selectedZone) return;

    setImporting(true);
    setResult(null);
    setError(null);

    try {
      const fromYm = `${fromYear}${fromMonth}`;
      const toYm = `${toYear}${toMonth}`;

      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zoneId: Number(selectedZone),
          fromYm,
          toYm,
          minPrice: minPrice ? Number(minPrice) : undefined,
          minAreaPyeong: minArea ? Number(minArea) : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "가져오기 실패");
      } else {
        setResult(data);
        // 구역 목록 새로고침
        const updated = await fetch("/api/zones").then((r) => r.json());
        setZones(updated);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "네트워크 오류");
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Download className="w-6 h-6 text-primary" />
          실거래가 가져오기
        </h1>
        <p className="text-muted-foreground mt-1">
          국토교통부 공공데이터 API를 통해 연립다세대 실거래가를 자동으로 가져옵니다.
        </p>
      </div>

      {/* API Key Info */}
      <Card className="glass-card border-0 border-l-4 border-l-amber-400">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
            <div className="space-y-1.5">
              <p className="text-sm font-medium">API 키 설정 필요</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                <a
                  href="https://www.data.go.kr/data/15058017/openapi.do"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-0.5"
                >
                  data.go.kr <ExternalLink className="w-3 h-3" />
                </a>
                에서 &quot;국토교통부_연립다세대 매매 실거래자료&quot; API를 신청하세요 (무료, 즉시 발급).
                발급받은 서비스키를{" "}
                <code className="px-1.5 py-0.5 bg-muted rounded text-[11px] font-mono">
                  .env.local
                </code>
                에 추가하세요:
              </p>
              <pre className="text-[11px] bg-muted/80 rounded-lg p-3 font-mono text-foreground/80 overflow-x-auto">
                DATA_GO_KR_API_KEY=발급받은_서비스키_여기에_붙여넣기
              </pre>
              <p className="text-[11px] text-muted-foreground">
                ⚠️ 인코딩된 키(Encoding)를 사용하세요. 설정 후 서버 재시작 필요.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Form */}
        <div className="lg:col-span-2 space-y-5">
          <Card className="glass-card border-0">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Database className="w-4 h-4 text-primary" />
                가져오기 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Zone selector */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  구역 선택
                </Label>
                <Select
                  value={selectedZone}
                  onValueChange={(v) => setSelectedZone(v)}
                >
                  <SelectTrigger className="bg-white w-full">
                    <SelectValue placeholder="구역을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {zones.map((zone) => (
                      <SelectItem key={zone.id} value={String(zone.id)}>
                        <div className="flex items-center gap-2">
                          <span>{zone.name}</span>
                          <span className="text-muted-foreground text-xs">
                            ({zone.city} {zone.district})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedZoneData && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <Badge
                      variant="outline"
                      className={`text-[9px] py-0 px-1.5 ${
                        STAGE_COLORS[selectedZoneData.stage as Stage] || ""
                      }`}
                    >
                      {selectedZoneData.stage}
                    </Badge>
                    <span>현재 시세 {selectedZoneData.surveyCount}건</span>
                    {selectedZoneData.avgPricePerPyeong > 0 && (
                      <>
                        <span>·</span>
                        <span>
                          평균 {formatPrice(selectedZoneData.avgPricePerPyeong)}/평
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Date range */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">조회 기간</Label>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1">
                    <Select value={fromYear} onValueChange={(v) => setFromYear(v ?? fromYear)}>
                      <SelectTrigger className="w-[90px] bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {YEARS.map((y) => (
                          <SelectItem key={y} value={String(y)}>
                            {y}년
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={fromMonth} onValueChange={(v) => setFromMonth(v ?? fromMonth)}>
                      <SelectTrigger className="w-[75px] bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((m) => (
                          <SelectItem
                            key={m}
                            value={String(m).padStart(2, "0")}
                          >
                            {m}월
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />

                  <div className="flex items-center gap-1">
                    <Select value={toYear} onValueChange={(v) => setToYear(v ?? toYear)}>
                      <SelectTrigger className="w-[90px] bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {YEARS.map((y) => (
                          <SelectItem key={y} value={String(y)}>
                            {y}년
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={toMonth} onValueChange={(v) => setToMonth(v ?? toMonth)}>
                      <SelectTrigger className="w-[75px] bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((m) => (
                          <SelectItem
                            key={m}
                            value={String(m).padStart(2, "0")}
                          >
                            {m}월
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  기간이 길수록 API 호출 횟수가 증가합니다 (월별 1회 호출).
                </p>
              </div>

              {/* Filters */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5" />
                  필터링 (지분거래 등 제외)
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      최소 거래가 (만원)
                    </Label>
                    <Input
                      type="number"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      placeholder="1000"
                      className="bg-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      최소 면적 (평)
                    </Label>
                    <Input
                      type="number"
                      value={minArea}
                      onChange={(e) => setMinArea(e.target.value)}
                      placeholder="5"
                      className="bg-white mt-1"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  비정상 거래(지분매매, 특수관계 거래 등)를 자동으로 제외합니다.
                </p>
              </div>

              {/* Import button */}
              <Button
                onClick={handleImport}
                disabled={!selectedZone || importing}
                className="w-full gradient-primary text-white hover:opacity-90 h-11"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    실거래가 가져오는 중...
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4 mr-2" />
                    실거래가 가져오기
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Error */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800">
                      가져오기 실패
                    </p>
                    <p className="text-xs text-red-600 mt-1">{error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Result */}
          {result && (
            <Card className="glass-card border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  가져오기 완료
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Summary stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-blue-50 text-center">
                    <p className="text-2xl font-bold text-blue-700">
                      {result.fetched}
                    </p>
                    <p className="text-[11px] text-blue-600 mt-0.5">
                      API 조회
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 text-center">
                    <p className="text-2xl font-bold text-amber-700">
                      {result.filtered}
                    </p>
                    <p className="text-[11px] text-amber-600 mt-0.5">
                      필터 통과
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 text-center">
                    <p className="text-2xl font-bold text-emerald-700">
                      {result.imported}
                    </p>
                    <p className="text-[11px] text-emerald-600 mt-0.5">
                      신규 등록
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 text-center">
                    <p className="text-2xl font-bold text-gray-600">
                      {result.skipped}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      중복 스킵
                    </p>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  {result.zone} · {result.dong} · {result.period}
                </div>

                {/* Imported items */}
                {result.items.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">
                      등록된 데이터 ({result.items.length}건)
                    </p>
                    <div className="max-h-60 overflow-y-auto rounded-xl border border-border/50">
                      <table className="w-full text-xs">
                        <thead className="bg-muted/50 sticky top-0">
                          <tr>
                            <th className="text-left py-2 px-3 font-medium">
                              건물명
                            </th>
                            <th className="text-right py-2 px-3 font-medium">
                              면적
                            </th>
                            <th className="text-right py-2 px-3 font-medium">
                              거래가
                            </th>
                            <th className="text-right py-2 px-3 font-medium">
                              거래일
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                          {result.items.map((item, i) => (
                            <tr key={i} className="hover:bg-muted/20">
                              <td className="py-1.5 px-3">
                                {item.buildingName}
                              </td>
                              <td className="py-1.5 px-3 text-right tabular-nums">
                                {item.areaPyeong}평
                              </td>
                              <td className="py-1.5 px-3 text-right tabular-nums font-medium">
                                {formatPrice(item.price)}
                              </td>
                              <td className="py-1.5 px-3 text-right tabular-nums text-muted-foreground">
                                {item.surveyDate}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Link to zone */}
                <Link
                  href={`/zones/${selectedZone}`}
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
                >
                  구역 상세 보기 <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Zone info */}
        <div className="space-y-4">
          <Card className="glass-card border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                구역별 현황
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {zones.map((zone) => (
                  <div
                    key={zone.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl transition-all ${
                      String(zone.id) === selectedZone
                        ? "bg-primary/10 border border-primary/20"
                        : "hover:bg-muted/40"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium">{zone.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {zone.city} {zone.district}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold tabular-nums">
                        {zone.surveyCount}건
                      </p>
                      {zone.avgPricePerPyeong > 0 && (
                        <p className="text-[10px] text-muted-foreground tabular-nums">
                          {formatPrice(zone.avgPricePerPyeong)}/평
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">사용 방법</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2.5 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    <a
                      href="https://www.data.go.kr/data/15058017/openapi.do"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      data.go.kr
                    </a>
                    에서 API 키 발급
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    <code className="px-1 py-0.5 bg-muted rounded text-[10px] font-mono">
                      .env.local
                    </code>
                    에 키 추가 후 서버 재시작
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    3
                  </span>
                  <span>구역 선택 → 기간 설정 → 가져오기</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    4
                  </span>
                  <span>
                    중복 데이터는 자동 스킵. 같은 기간 여러 번 실행해도 안전
                  </span>
                </li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
