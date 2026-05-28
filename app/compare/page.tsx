"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  formatPrice,
  formatDateShort,
  STAGE_COLORS,
  type Stage,
} from "@/lib/constants";
import {
  GitCompareArrows,
  MapPin,
  BarChart3,
  TrendingUp,
  Calendar,
  Building2,
  ClipboardCheck,
  Star,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Home,
  Layers,
  ArrowUpDown,
  Info,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";

interface ZoneListItem {
  id: number;
  name: string;
  district: string;
  city: string;
  stage: string;
  estimatedMoveIn: string | null;
  estimatedHouseholds: number | null;
  surveyCount: number;
  avgPricePerPyeong: number;
}

interface ZoneCompareData {
  id: number;
  name: string;
  district: string;
  city: string;
  stage: string;
  estimatedMoveIn: string | null;
  estimatedHouseholds: number | null;
  notes: string | null;
  stats: {
    surveyCount: number;
    listingCount: number;
    watchCount: number;
    buildingCount: number;
    avgPricePerPyeong: number;
    medianPricePerPyeong: number;
    minPricePerPyeong: number;
    maxPricePerPyeong: number;
    avgArea: number;
    minArea: number;
    maxArea: number;
    avgYear: number | null;
    minYear: number | null;
    maxYear: number | null;
    earliestDate: string | null;
    latestDate: string | null;
    realTradeCount: number;
    askingCount: number;
    estimatedCount: number;
  };
}

const ZONE_COLORS = [
  "#6366f1", // indigo
  "#f59e0b", // amber
  "#10b981", // emerald
  "#ef4444", // red
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#f97316", // orange
  "#ec4899", // pink
];

const STAGE_ORDER: Record<string, number> = {
  정비구역지정: 1,
  조합설립인가: 2,
  사업시행인가: 3,
  관리처분인가: 4,
  착공: 5,
  준공: 6,
};

export default function ComparePage() {
  const [allZones, setAllZones] = useState<ZoneListItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [compareData, setCompareData] = useState<ZoneCompareData[]>([]);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [showSelector, setShowSelector] = useState(true);

  // Fetch all zones
  useEffect(() => {
    fetch("/api/zones")
      .then((r) => r.json())
      .then((data) => {
        setAllZones(data);
        // 기본으로 시세 데이터가 있는 구역 최대 3개 선택
        const withSurveys = data
          .filter((z: ZoneListItem) => z.surveyCount > 0)
          .slice(0, 3)
          .map((z: ZoneListItem) => z.id);
        if (withSurveys.length > 0) {
          setSelectedIds(withSurveys);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Fetch comparison data when selectedIds change
  useEffect(() => {
    if (selectedIds.length === 0) {
      setCompareData([]);
      return;
    }
    setComparing(true);
    fetch(`/api/compare?ids=${selectedIds.join(",")}`)
      .then((r) => r.json())
      .then(setCompareData)
      .catch(console.error)
      .finally(() => setComparing(false));
  }, [selectedIds]);

  const toggleZone = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((v) => v !== id)
        : prev.length < 8
        ? [...prev, id]
        : prev
    );
  };

  const selectAll = () => {
    setSelectedIds(allZones.slice(0, 8).map((z) => z.id));
  };

  const clearAll = () => {
    setSelectedIds([]);
  };

  // --- Chart Data ---
  const barChartData = useMemo(() => {
    return compareData.map((z, i) => ({
      name: z.name.length > 6 ? z.name.slice(0, 6) + "…" : z.name,
      fullName: z.name,
      평균: z.stats.avgPricePerPyeong,
      중앙값: z.stats.medianPricePerPyeong,
      최소: z.stats.minPricePerPyeong,
      최대: z.stats.maxPricePerPyeong,
      fill: ZONE_COLORS[i % ZONE_COLORS.length],
    }));
  }, [compareData]);

  const radarData = useMemo(() => {
    if (compareData.length === 0) return [];

    // Normalize each dimension to 0-100 scale
    const maxSurvey = Math.max(...compareData.map((z) => z.stats.surveyCount), 1);
    const maxPrice = Math.max(...compareData.map((z) => z.stats.avgPricePerPyeong), 1);
    const maxBuilding = Math.max(...compareData.map((z) => z.stats.buildingCount), 1);
    const maxHouseholds = Math.max(
      ...compareData.map((z) => z.estimatedHouseholds || 0),
      1
    );

    const dimensions = [
      { subject: "시세건수", key: "surveyCount", max: maxSurvey },
      { subject: "평당가", key: "avgPrice", max: maxPrice },
      { subject: "건물수", key: "buildingCount", max: maxBuilding },
      { subject: "진행단계", key: "stageScore", max: 6 },
      { subject: "세대수", key: "households", max: maxHouseholds },
    ];

    return dimensions.map((dim) => {
      const point: Record<string, string | number> = { subject: dim.subject };
      compareData.forEach((z) => {
        let raw = 0;
        switch (dim.key) {
          case "surveyCount":
            raw = z.stats.surveyCount;
            break;
          case "avgPrice":
            raw = z.stats.avgPricePerPyeong;
            break;
          case "buildingCount":
            raw = z.stats.buildingCount;
            break;
          case "stageScore":
            raw = STAGE_ORDER[z.stage] || 0;
            break;
          case "households":
            raw = z.estimatedHouseholds || 0;
            break;
        }
        point[z.name] = Math.round((raw / dim.max) * 100);
      });
      return point;
    });
  }, [compareData]);

  const detailChartData = useMemo(() => {
    return compareData.map((z) => ({
      name: z.name.length > 6 ? z.name.slice(0, 6) + "…" : z.name,
      fullName: z.name,
      실거래: z.stats.realTradeCount,
      호가: z.stats.askingCount,
      추정: z.stats.estimatedCount,
    }));
  }, [compareData]);

  // --- Best/Worst markers ---
  const highlights = useMemo(() => {
    if (compareData.length < 2) return {};
    const prices = compareData.map((z) => z.stats.avgPricePerPyeong);
    const surveys = compareData.map((z) => z.stats.surveyCount);
    return {
      cheapestIdx: prices.indexOf(Math.min(...prices)),
      expensiveIdx: prices.indexOf(Math.max(...prices)),
      mostDataIdx: surveys.indexOf(Math.max(...surveys)),
    };
  }, [compareData]);

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
          <GitCompareArrows className="w-6 h-6 text-primary" />
          구역 비교
        </h1>
        <p className="text-muted-foreground mt-1">
          여러 재개발 구역의 시세와 현황을 한눈에 비교하세요.
        </p>
      </div>

      {/* Zone Selector */}
      <Card className="glass-card border-0">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              비교 구역 선택
              <Badge variant="outline" className="ml-1 text-[10px]">
                {selectedIds.length}/{allZones.length}
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={selectAll}
                className="text-xs h-7 px-2"
              >
                전체 선택
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="text-xs h-7 px-2"
              >
                초기화
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSelector(!showSelector)}
                className="h-7 w-7 p-0"
              >
                {showSelector ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        {showSelector && (
          <CardContent className="pt-0">
            {allZones.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                등록된 구역이 없습니다. 먼저 구역을 등록해주세요.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {allZones.map((zone) => {
                  const isSelected = selectedIds.includes(zone.id);
                  return (
                    <button
                      key={zone.id}
                      onClick={() => toggleZone(zone.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 ${
                        isSelected
                          ? "bg-primary/10 border-2 border-primary/30 shadow-sm"
                          : "bg-muted/30 border-2 border-transparent hover:bg-muted/60"
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                          isSelected
                            ? "bg-primary text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <span className="text-[10px] font-bold">
                            {zone.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium truncate">
                            {zone.name}
                          </p>
                          <Badge
                            variant="outline"
                            className={`text-[9px] py-0 px-1 shrink-0 ${
                              STAGE_COLORS[zone.stage as Stage] || ""
                            }`}
                          >
                            {zone.stage}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {zone.city} {zone.district} · 시세{" "}
                          {zone.surveyCount}건
                          {zone.avgPricePerPyeong > 0 && (
                            <> · 평균 {formatPrice(zone.avgPricePerPyeong)}/평</>
                          )}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Comparison Results */}
      {comparing ? (
        <div className="flex items-center justify-center h-32">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">비교 분석 중...</p>
          </div>
        </div>
      ) : compareData.length === 0 ? (
        <Card className="glass-card border-dashed border-2 border-primary/20">
          <CardContent className="py-14 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center mb-4">
              <GitCompareArrows className="w-7 h-7 text-primary" />
            </div>
            <p className="font-semibold text-lg">비교할 구역을 선택하세요</p>
            <p className="text-muted-foreground mt-1.5 text-sm">
              위에서 2개 이상의 구역을 선택하면 상세 비교 결과를 확인할 수 있습니다.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {compareData.map((zone, i) => {
              const color = ZONE_COLORS[i % ZONE_COLORS.length];
              const isCheapest = highlights.cheapestIdx === i;
              const isMostData = highlights.mostDataIdx === i;
              return (
                <Card
                  key={zone.id}
                  className="glass-card border-0 overflow-hidden group hover:shadow-lg transition-all duration-300"
                >
                  <div
                    className="h-1.5"
                    style={{ backgroundColor: color }}
                  />
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-sm">{zone.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {zone.city} {zone.district}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[9px] py-0 px-1.5 ${
                          STAGE_COLORS[zone.stage as Stage] || ""
                        }`}
                      >
                        {zone.stage}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          평균 평당가
                        </span>
                        <span className="text-sm font-bold tabular-nums">
                          {zone.stats.avgPricePerPyeong > 0
                            ? formatPrice(zone.stats.avgPricePerPyeong) + "/평"
                            : "-"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          중앙값
                        </span>
                        <span className="text-sm font-semibold tabular-nums">
                          {zone.stats.medianPricePerPyeong > 0
                            ? formatPrice(zone.stats.medianPricePerPyeong) +
                              "/평"
                            : "-"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          가격 범위
                        </span>
                        <span className="text-[11px] tabular-nums text-muted-foreground">
                          {zone.stats.minPricePerPyeong > 0
                            ? `${formatPrice(zone.stats.minPricePerPyeong)} ~ ${formatPrice(zone.stats.maxPricePerPyeong)}`
                            : "-"}
                        </span>
                      </div>

                      <div className="border-t border-border/50 pt-2 mt-2 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <BarChart3 className="w-3 h-3" />
                            시세 건수
                          </span>
                          <span className="text-xs font-medium">
                            {zone.stats.surveyCount}건
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            건물 수
                          </span>
                          <span className="text-xs font-medium">
                            {zone.stats.buildingCount}개
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Home className="w-3 h-3" />
                            예상 세대
                          </span>
                          <span className="text-xs font-medium">
                            {zone.estimatedHouseholds
                              ? `${zone.estimatedHouseholds.toLocaleString()}세대`
                              : "-"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            예상 입주
                          </span>
                          <span className="text-xs font-medium">
                            {zone.estimatedMoveIn || "-"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mt-3">
                      {isCheapest && compareData.length > 1 && (
                        <Badge className="text-[9px] bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100">
                          최저가
                        </Badge>
                      )}
                      {isMostData && compareData.length > 1 && (
                        <Badge className="text-[9px] bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                          데이터 풍부
                        </Badge>
                      )}
                      {zone.stats.watchCount > 0 && (
                        <Badge className="text-[9px] bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
                          <Star className="w-2.5 h-2.5 mr-0.5" />
                          관심 {zone.stats.watchCount}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Comparison Table */}
          <Card className="glass-card border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-primary" />
                상세 비교표
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-3 pr-4 text-xs font-medium text-muted-foreground w-32">
                        항목
                      </th>
                      {compareData.map((zone, i) => (
                        <th
                          key={zone.id}
                          className="text-center py-3 px-3 min-w-[120px]"
                        >
                          <div className="flex flex-col items-center gap-1">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{
                                backgroundColor:
                                  ZONE_COLORS[i % ZONE_COLORS.length],
                              }}
                            />
                            <span className="text-xs font-semibold">
                              {zone.name}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    <CompareRow
                      label="소재지"
                      values={compareData.map(
                        (z) => `${z.city} ${z.district}`
                      )}
                    />
                    <CompareRow
                      label="진행 단계"
                      values={compareData.map((z) => z.stage)}
                      renderValue={(v) => (
                        <Badge
                          variant="outline"
                          className={`text-[10px] py-0 px-1.5 ${
                            STAGE_COLORS[v as Stage] || ""
                          }`}
                        >
                          {v}
                        </Badge>
                      )}
                      highlightMax={(vals) => {
                        const scores = vals.map(
                          (v) => STAGE_ORDER[v] || 0
                        );
                        return scores.indexOf(Math.max(...scores));
                      }}
                    />
                    <CompareRow
                      label="평균 평당가"
                      values={compareData.map((z) =>
                        z.stats.avgPricePerPyeong > 0
                          ? formatPrice(z.stats.avgPricePerPyeong)
                          : "-"
                      )}
                      rawValues={compareData.map(
                        (z) => z.stats.avgPricePerPyeong
                      )}
                      highlightMin
                      unit="/평"
                    />
                    <CompareRow
                      label="중앙값"
                      values={compareData.map((z) =>
                        z.stats.medianPricePerPyeong > 0
                          ? formatPrice(z.stats.medianPricePerPyeong)
                          : "-"
                      )}
                      rawValues={compareData.map(
                        (z) => z.stats.medianPricePerPyeong
                      )}
                      highlightMin
                      unit="/평"
                    />
                    <CompareRow
                      label="최저가"
                      values={compareData.map((z) =>
                        z.stats.minPricePerPyeong > 0
                          ? formatPrice(z.stats.minPricePerPyeong)
                          : "-"
                      )}
                      rawValues={compareData.map(
                        (z) => z.stats.minPricePerPyeong
                      )}
                      highlightMin
                      unit="/평"
                    />
                    <CompareRow
                      label="최고가"
                      values={compareData.map((z) =>
                        z.stats.maxPricePerPyeong > 0
                          ? formatPrice(z.stats.maxPricePerPyeong)
                          : "-"
                      )}
                      unit="/평"
                    />
                    <CompareRow
                      label="시세 건수"
                      values={compareData.map(
                        (z) => `${z.stats.surveyCount}건`
                      )}
                      rawValues={compareData.map(
                        (z) => z.stats.surveyCount
                      )}
                      highlightMax
                    />
                    <CompareRow
                      label="건물 수"
                      values={compareData.map(
                        (z) => `${z.stats.buildingCount}개`
                      )}
                    />
                    <CompareRow
                      label="평균 면적"
                      values={compareData.map((z) =>
                        z.stats.avgArea > 0
                          ? `${z.stats.avgArea}평`
                          : "-"
                      )}
                    />
                    <CompareRow
                      label="면적 범위"
                      values={compareData.map((z) =>
                        z.stats.minArea > 0
                          ? `${z.stats.minArea}~${z.stats.maxArea}평`
                          : "-"
                      )}
                    />
                    <CompareRow
                      label="평균 연식"
                      values={compareData.map((z) =>
                        z.stats.avgYear
                          ? `${z.stats.avgYear}년`
                          : "-"
                      )}
                    />
                    <CompareRow
                      label="예상 세대"
                      values={compareData.map((z) =>
                        z.estimatedHouseholds
                          ? `${z.estimatedHouseholds.toLocaleString()}세대`
                          : "-"
                      )}
                    />
                    <CompareRow
                      label="예상 입주"
                      values={compareData.map(
                        (z) => z.estimatedMoveIn || "-"
                      )}
                    />
                    <CompareRow
                      label="최근 조사"
                      values={compareData.map((z) =>
                        z.stats.latestDate
                          ? formatDateShort(z.stats.latestDate)
                          : "-"
                      )}
                    />
                    <CompareRow
                      label="실거래 비율"
                      values={compareData.map((z) => {
                        if (z.stats.surveyCount === 0) return "-";
                        const pct = Math.round(
                          (z.stats.realTradeCount / z.stats.surveyCount) *
                            100
                        );
                        return `${pct}% (${z.stats.realTradeCount}건)`;
                      })}
                    />
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart: 평당가 비교 */}
            <Card className="glass-card border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  평당가 비교
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={barChartData}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#f0f0f0"
                      />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) =>
                          v >= 10000
                            ? `${(v / 10000).toFixed(0)}억`
                            : `${v.toLocaleString()}`
                        }
                      />
                      <Tooltip
                        formatter={(value, name) => [
                          formatPrice(Number(value)) + "/평",
                          name,
                        ]}
                        labelFormatter={(label, payload) => {
                          if (payload?.[0]?.payload?.fullName) {
                            return payload[0].payload.fullName;
                          }
                          return label;
                        }}
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                          fontSize: "12px",
                        }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: "11px" }}
                      />
                      <Bar
                        dataKey="평균"
                        fill="#6366f1"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="중앙값"
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="최소"
                        fill="#94a3b8"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="최대"
                        fill="#f59e0b"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Radar Chart */}
            {compareData.length >= 2 && (
              <Card className="glass-card border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    종합 비교 레이더
                    <span className="text-[10px] font-normal text-muted-foreground ml-1">
                      (정규화 0~100)
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart
                        cx="50%"
                        cy="50%"
                        outerRadius="70%"
                        data={radarData}
                      >
                        <PolarGrid stroke="#e5e7eb" />
                        <PolarAngleAxis
                          dataKey="subject"
                          tick={{ fontSize: 11 }}
                        />
                        <PolarRadiusAxis
                          angle={90}
                          domain={[0, 100]}
                          tick={{ fontSize: 9 }}
                          tickCount={5}
                        />
                        {compareData.map((zone, i) => (
                          <Radar
                            key={zone.id}
                            name={zone.name}
                            dataKey={zone.name}
                            stroke={ZONE_COLORS[i % ZONE_COLORS.length]}
                            fill={ZONE_COLORS[i % ZONE_COLORS.length]}
                            fillOpacity={0.15}
                            strokeWidth={2}
                          />
                        ))}
                        <Legend
                          wrapperStyle={{ fontSize: "11px" }}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "12px",
                            border: "none",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                            fontSize: "12px",
                          }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Transaction Type Breakdown */}
            <Card className="glass-card border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-primary" />
                  거래유형별 시세 건수
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={detailChartData}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#f0f0f0"
                      />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(value, name) => [
                          `${value}건`,
                          name,
                        ]}
                        labelFormatter={(label, payload) => {
                          if (payload?.[0]?.payload?.fullName) {
                            return payload[0].payload.fullName;
                          }
                          return label;
                        }}
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                          fontSize: "12px",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px" }} />
                      <Bar
                        dataKey="실거래"
                        fill="#22c55e"
                        radius={[4, 4, 0, 0]}
                        stackId="stack"
                      />
                      <Bar
                        dataKey="호가"
                        fill="#3b82f6"
                        radius={[0, 0, 0, 0]}
                        stackId="stack"
                      />
                      <Bar
                        dataKey="추정"
                        fill="#f59e0b"
                        radius={[4, 4, 0, 0]}
                        stackId="stack"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Insights */}
            {compareData.length >= 2 && (
              <Card className="glass-card border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Info className="w-4 h-4 text-primary" />
                    비교 인사이트
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <InsightBlock compareData={compareData} />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ---- Helper Components ---- */

function CompareRow({
  label,
  values,
  rawValues,
  renderValue,
  highlightMax,
  highlightMin,
  unit,
}: {
  label: string;
  values: string[];
  rawValues?: number[];
  renderValue?: (v: string) => React.ReactNode;
  highlightMax?: boolean | ((vals: string[]) => number);
  highlightMin?: boolean;
  unit?: string;
}) {
  let maxIdx = -1;
  let minIdx = -1;

  if (rawValues && rawValues.length > 0) {
    const nonZero = rawValues.filter((v) => v > 0);
    if (nonZero.length > 0) {
      if (highlightMax === true) {
        const maxVal = Math.max(...nonZero);
        maxIdx = rawValues.indexOf(maxVal);
      }
      if (highlightMin === true) {
        const minVal = Math.min(...nonZero);
        minIdx = rawValues.indexOf(minVal);
      }
    }
  }

  if (typeof highlightMax === "function") {
    maxIdx = highlightMax(values);
  }

  return (
    <tr className="hover:bg-muted/30 transition-colors">
      <td className="py-2.5 pr-4 text-xs font-medium text-muted-foreground whitespace-nowrap">
        {label}
      </td>
      {values.map((val, i) => (
        <td key={i} className="text-center py-2.5 px-3">
          <span
            className={`text-xs font-medium ${
              i === maxIdx
                ? "text-emerald-600 font-bold"
                : i === minIdx
                ? "text-blue-600 font-bold"
                : ""
            }`}
          >
            {renderValue ? renderValue(val) : val}
            {unit && val !== "-" && !renderValue && (
              <span className="text-muted-foreground font-normal">
                {unit}
              </span>
            )}
          </span>
        </td>
      ))}
    </tr>
  );
}

function InsightBlock({
  compareData,
}: {
  compareData: ZoneCompareData[];
}) {
  const insights: { icon: React.ReactNode; text: string; type: "info" | "positive" | "warning" }[] = [];

  // 가격 비교
  const withPrice = compareData.filter(
    (z) => z.stats.avgPricePerPyeong > 0
  );
  if (withPrice.length >= 2) {
    const sorted = [...withPrice].sort(
      (a, b) => a.stats.avgPricePerPyeong - b.stats.avgPricePerPyeong
    );
    const cheapest = sorted[0];
    const expensive = sorted[sorted.length - 1];
    const diff = expensive.stats.avgPricePerPyeong - cheapest.stats.avgPricePerPyeong;
    const diffPct = Math.round(
      (diff / cheapest.stats.avgPricePerPyeong) * 100
    );

    insights.push({
      icon: <TrendingUp className="w-4 h-4 text-blue-500" />,
      text: `${cheapest.name}이(가) 평균 평당가 기준 가장 저렴합니다 (${formatPrice(cheapest.stats.avgPricePerPyeong)}/평). ${expensive.name} 대비 ${diffPct}% 낮습니다.`,
      type: "info",
    });
  }

  // 진행 단계 비교
  const stagesSorted = [...compareData].sort(
    (a, b) => (STAGE_ORDER[b.stage] || 0) - (STAGE_ORDER[a.stage] || 0)
  );
  if (stagesSorted.length >= 2) {
    const most = stagesSorted[0];
    insights.push({
      icon: <Layers className="w-4 h-4 text-purple-500" />,
      text: `${most.name}이(가) "${most.stage}" 단계로 가장 진행이 앞서 있습니다.`,
      type: "positive",
    });
  }

  // 데이터 충분도
  const lowData = compareData.filter((z) => z.stats.surveyCount < 5);
  if (lowData.length > 0) {
    insights.push({
      icon: <BarChart3 className="w-4 h-4 text-amber-500" />,
      text: `${lowData.map((z) => z.name).join(", ")}은(는) 시세 데이터가 5건 미만입니다. 추가 조사가 필요합니다.`,
      type: "warning",
    });
  }

  // 면적 차이
  const withArea = compareData.filter((z) => z.stats.avgArea > 0);
  if (withArea.length >= 2) {
    const areasSorted = [...withArea].sort(
      (a, b) => b.stats.avgArea - a.stats.avgArea
    );
    if (areasSorted[0].stats.avgArea - areasSorted[areasSorted.length - 1].stats.avgArea > 5) {
      insights.push({
        icon: <Home className="w-4 h-4 text-indigo-500" />,
        text: `구역별 평균 면적 차이가 큽니다 (${areasSorted[areasSorted.length - 1].name}: ${areasSorted[areasSorted.length - 1].stats.avgArea}평 vs ${areasSorted[0].name}: ${areasSorted[0].stats.avgArea}평). 평당가 비교 시 면적 차이를 고려하세요.`,
        type: "warning",
      });
    }
  }

  if (insights.length === 0) {
    insights.push({
      icon: <Info className="w-4 h-4 text-muted-foreground" />,
      text: "더 많은 시세 데이터를 추가하면 더 정확한 인사이트를 제공합니다.",
      type: "info",
    });
  }

  return (
    <>
      {insights.map((insight, i) => (
        <div
          key={i}
          className={`flex items-start gap-3 p-3 rounded-xl ${
            insight.type === "positive"
              ? "bg-emerald-50"
              : insight.type === "warning"
              ? "bg-amber-50"
              : "bg-blue-50"
          }`}
        >
          <div className="mt-0.5 shrink-0">{insight.icon}</div>
          <p className="text-xs leading-relaxed text-foreground/80">
            {insight.text}
          </p>
        </div>
      ))}
    </>
  );
}
