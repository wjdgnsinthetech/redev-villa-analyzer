"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  STAGES,
  STAGE_COLORS,
  TRANSACTION_TYPES,
  LISTING_STATUSES,
  VERDICT_STYLES,
  formatPrice,
  formatDate,
  formatDateShort,
  type Stage,
} from "@/lib/constants";
import type { Zone, Survey, Listing } from "@/lib/db/schema";
import type { EvaluateResult } from "@/lib/evaluate";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  ArrowLeft,
  Plus,
  X,
  BarChart3,
  TrendingDown,
  TrendingUp,
  Database,
  AlertTriangle,
  Trash2,
  ArrowUpDown,
  Calendar,
  Building2,
  Layers,
  Filter,
  SortAsc,
  SortDesc,
} from "lucide-react";

const EMPTY_SURVEY = {
  buildingName: "",
  areaPyeong: "",
  yearBuilt: "",
  floor: "",
  totalFloors: "",
  price: "",
  transactionType: "호가",
  surveyDate: new Date().toISOString().split("T")[0],
  source: "",
};

const EMPTY_LISTING = {
  buildingName: "",
  areaPyeong: "",
  yearBuilt: "",
  floor: "",
  totalFloors: "",
  askingPrice: "",
  source: "",
  notes: "",
};

type SortField = "surveyDate" | "pricePerPyeong" | "areaPyeong" | "buildingName" | "yearBuilt";
type SortDir = "asc" | "desc";

const CHART_COLORS = [
  "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e", "#f97316", "#eab308",
  "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6",
];

export default function ZoneDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [zone, setZone] = useState<Zone | null>(null);
  const [surveyList, setSurveys] = useState<Survey[]>([]);
  const [listingList, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const [surveyForm, setSurveyForm] = useState(EMPTY_SURVEY);
  const [showSurveyForm, setShowSurveyForm] = useState(false);
  const [listingForm, setListingForm] = useState(EMPTY_LISTING);
  const [evalResult, setEvalResult] = useState<EvaluateResult | null>(null);
  const [evaluating, setEvaluating] = useState(false);

  // Sort & filter state
  const [sortField, setSortField] = useState<SortField>("surveyDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filterType, setFilterType] = useState<string>("전체");

  const fetchData = useCallback(() => {
    Promise.all([
      fetch(`/api/zones/${id}`).then((r) => r.json()),
      fetch(`/api/surveys?zoneId=${id}`).then((r) => r.json()),
      fetch(`/api/listings?zoneId=${id}`).then((r) => r.json()),
    ])
      .then(([z, s, l]) => {
        setZone(z);
        setSurveys(s);
        setListings(l);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Sorted & filtered survey list
  const filteredSurveys = useMemo(() => {
    let list = [...surveyList];
    if (filterType !== "전체") {
      list = list.filter((s) => s.transactionType === filterType);
    }
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "surveyDate":
          cmp = (a.surveyDate || "").localeCompare(b.surveyDate || "");
          break;
        case "pricePerPyeong":
          cmp = a.pricePerPyeong - b.pricePerPyeong;
          break;
        case "areaPyeong":
          cmp = a.areaPyeong - b.areaPyeong;
          break;
        case "buildingName":
          cmp = (a.buildingName || "").localeCompare(b.buildingName || "");
          break;
        case "yearBuilt":
          cmp = (a.yearBuilt || 0) - (b.yearBuilt || 0);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [surveyList, sortField, sortDir, filterType]);

  // Summary stats
  const stats = useMemo(() => {
    if (surveyList.length === 0) return null;
    const ppps = surveyList.map((s) => s.pricePerPyeong);
    const sorted = [...ppps].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
    const avg = Math.round(ppps.reduce((a, b) => a + b, 0) / ppps.length);
    const min = Math.min(...ppps);
    const max = Math.max(...ppps);
    const buildings = new Set(surveyList.map((s) => s.buildingName).filter(Boolean)).size;
    const latestDate = surveyList
      .map((s) => s.surveyDate)
      .filter(Boolean)
      .sort()
      .reverse()[0];
    const oldestDate = surveyList
      .map((s) => s.surveyDate)
      .filter(Boolean)
      .sort()[0];
    return { median, avg, min, max, buildings, latestDate, oldestDate, count: surveyList.length };
  }, [surveyList]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-0.5 opacity-30" />;
    return sortDir === "asc" ? <SortAsc className="w-3 h-3 ml-0.5 text-primary" /> : <SortDesc className="w-3 h-3 ml-0.5 text-primary" />;
  };

  const addSurvey = async () => {
    await fetch("/api/surveys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...surveyForm, zoneId: id }),
    });
    setSurveyForm(EMPTY_SURVEY);
    setShowSurveyForm(false);
    fetchData();
  };

  const deleteSurvey = async (sid: number) => {
    if (!confirm("이 시세 데이터를 삭제하시겠습니까?")) return;
    await fetch(`/api/surveys/${sid}`, { method: "DELETE" });
    fetchData();
  };

  const evaluateAndSaveListing = async () => {
    setEvaluating(true);
    try {
      const evalRes = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zoneId: Number(id),
          areaPyeong: Number(listingForm.areaPyeong),
          yearBuilt: listingForm.yearBuilt ? Number(listingForm.yearBuilt) : undefined,
          floor: listingForm.floor ? Number(listingForm.floor) : undefined,
          askingPrice: Number(listingForm.askingPrice),
        }),
      });
      const result: EvaluateResult = await evalRes.json();
      setEvalResult(result);

      await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zoneId: Number(id),
          buildingName: listingForm.buildingName,
          areaPyeong: Number(listingForm.areaPyeong),
          yearBuilt: listingForm.yearBuilt ? Number(listingForm.yearBuilt) : null,
          floor: listingForm.floor ? Number(listingForm.floor) : null,
          totalFloors: listingForm.totalFloors ? Number(listingForm.totalFloors) : null,
          askingPrice: Number(listingForm.askingPrice),
          assessedPrice: result.assessedPrice,
          priceGapPercent: result.priceGapPercent,
          verdict: result.verdict,
          matchedSurveyCount: result.matchedCount,
          source: listingForm.source,
          notes: listingForm.notes,
        }),
      });
      fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setEvaluating(false);
    }
  };

  const updateListingStatus = async (lid: number, status: string) => {
    await fetch(`/api/listings/${lid}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchData();
  };

  const deleteListing = async (lid: number) => {
    if (!confirm("이 매물 평가를 삭제하시겠습니까?")) return;
    await fetch(`/api/listings/${lid}`, { method: "DELETE" });
    fetchData();
  };

  // === Chart data ===
  const timeSeriesData = useMemo(() => {
    return surveyList
      .filter((s) => s.surveyDate)
      .map((s) => ({
        date: s.surveyDate!,
        dateLabel: formatDateShort(s.surveyDate),
        pricePerPyeong: s.pricePerPyeong,
        buildingName: s.buildingName || "미상",
        areaPyeong: s.areaPyeong,
        price: s.price,
        transactionType: s.transactionType,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [surveyList]);

  const buildingData = useMemo(() => {
    const grouped: Record<string, number[]> = {};
    surveyList.forEach((s) => {
      const name = s.buildingName || "미상";
      if (!grouped[name]) grouped[name] = [];
      grouped[name].push(s.pricePerPyeong);
    });
    return Object.entries(grouped)
      .map(([name, ppps]) => ({
        name: name.length > 8 ? name.slice(0, 7) + "…" : name,
        fullName: name,
        avg: Math.round(ppps.reduce((a, b) => a + b, 0) / ppps.length),
        min: Math.min(...ppps),
        max: Math.max(...ppps),
        count: ppps.length,
      }))
      .sort((a, b) => b.avg - a.avg);
  }, [surveyList]);

  const yearData = useMemo(() => {
    const grouped: Record<string, number[]> = {};
    surveyList.filter((s) => s.yearBuilt).forEach((s) => {
      const decade = `${Math.floor(s.yearBuilt! / 10) * 10}년대`;
      if (!grouped[decade]) grouped[decade] = [];
      grouped[decade].push(s.pricePerPyeong);
    });
    return Object.entries(grouped)
      .map(([decade, ppps]) => ({
        decade,
        avg: Math.round(ppps.reduce((a, b) => a + b, 0) / ppps.length),
        count: ppps.length,
      }))
      .sort((a, b) => a.decade.localeCompare(b.decade));
  }, [surveyList]);

  const floorData = useMemo(() => {
    const grouped: Record<string, number[]> = {};
    surveyList.filter((s) => s.floor).forEach((s) => {
      const label = `${s.floor}층`;
      if (!grouped[label]) grouped[label] = [];
      grouped[label].push(s.pricePerPyeong);
    });
    return Object.entries(grouped)
      .map(([floor, ppps]) => ({
        floor,
        avg: Math.round(ppps.reduce((a, b) => a + b, 0) / ppps.length),
        count: ppps.length,
      }))
      .sort((a, b) => parseInt(a.floor) - parseInt(b.floor));
  }, [surveyList]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!zone) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">구역을 찾을 수 없습니다.</p>
        <Link href="/zones" className="text-primary underline mt-2 inline-block text-sm">
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Header */}
      <div>
        <Link
          href="/zones"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          구역 목록
        </Link>
        <div className="flex items-center gap-3 mt-3">
          <h1 className="text-2xl font-bold tracking-tight">{zone.name}</h1>
          <Badge
            variant="outline"
            className={STAGE_COLORS[zone.stage as Stage] || ""}
          >
            {zone.stage}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {zone.city} {zone.district}
          {zone.estimatedMoveIn && ` · 예상 입주 ${zone.estimatedMoveIn}`}
          {zone.estimatedHouseholds &&
            ` · ${zone.estimatedHouseholds.toLocaleString()}세대`}
        </p>
      </div>

      {/* Quick Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "중앙값", value: `${formatPrice(stats.median)}/평`, color: "text-primary" },
            { label: "평균", value: `${formatPrice(stats.avg)}/평`, color: "text-foreground" },
            { label: "범위", value: `${formatPrice(stats.min)} ~ ${formatPrice(stats.max)}`, color: "text-muted-foreground" },
            { label: "건물수", value: `${stats.buildings}개`, color: "text-foreground" },
            { label: "데이터 기간", value: stats.oldestDate && stats.latestDate ? `${formatDateShort(stats.oldestDate)} ~ ${formatDateShort(stats.latestDate)}` : "-", color: "text-muted-foreground" },
          ].map((item) => (
            <div key={item.label} className="p-3 rounded-xl bg-white/60 backdrop-blur-sm border border-border/30">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
              <p className={`text-sm font-bold mt-0.5 tabular-nums ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>
      )}

      <Tabs defaultValue="surveys">
        <TabsList className="grid w-full grid-cols-3 bg-white/60 backdrop-blur-sm">
          <TabsTrigger value="surveys" className="gap-1.5 data-[state=active]:shadow-sm">
            <BarChart3 className="w-3.5 h-3.5" />
            시세 조사 ({surveyList.length})
          </TabsTrigger>
          <TabsTrigger value="listings" className="gap-1.5 data-[state=active]:shadow-sm">
            <TrendingUp className="w-3.5 h-3.5" />
            매물 평가 ({listingList.length})
          </TabsTrigger>
          <TabsTrigger value="analysis" className="gap-1.5 data-[state=active]:shadow-sm">
            <Database className="w-3.5 h-3.5" />
            분석
          </TabsTrigger>
        </TabsList>

        {/* === 시세 조사 탭 === */}
        <TabsContent value="surveys" className="space-y-4 mt-4">
          {/* Add survey toggle */}
          {!showSurveyForm ? (
            <Button
              onClick={() => setShowSurveyForm(true)}
              variant="outline"
              className="w-full border-dashed border-2 border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50"
            >
              <Plus className="w-4 h-4 mr-2" />
              시세 데이터 추가
            </Button>
          ) : (
            <Card className="glass-card border-0 border-l-4 border-l-primary">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Plus className="w-4 h-4 text-primary" />
                    시세 데이터 추가
                  </CardTitle>
                  <button onClick={() => setShowSurveyForm(false)} className="p-1 rounded-lg hover:bg-accent">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-[11px] text-muted-foreground">건물명</Label>
                    <Input
                      placeholder="빌라명"
                      value={surveyForm.buildingName}
                      onChange={(e) => setSurveyForm({ ...surveyForm, buildingName: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">평형 *</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="예: 12.5"
                      value={surveyForm.areaPyeong}
                      onChange={(e) => setSurveyForm({ ...surveyForm, areaPyeong: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">가격 (만원) *</Label>
                    <Input
                      type="number"
                      placeholder="예: 28000"
                      value={surveyForm.price}
                      onChange={(e) => setSurveyForm({ ...surveyForm, price: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">거래일 *</Label>
                    <Input
                      type="date"
                      value={surveyForm.surveyDate}
                      onChange={(e) => setSurveyForm({ ...surveyForm, surveyDate: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">준공연도</Label>
                    <Input
                      type="number"
                      placeholder="예: 2003"
                      value={surveyForm.yearBuilt}
                      onChange={(e) => setSurveyForm({ ...surveyForm, yearBuilt: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">층</Label>
                    <Input
                      type="number"
                      placeholder="예: 3"
                      value={surveyForm.floor}
                      onChange={(e) => setSurveyForm({ ...surveyForm, floor: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">유형</Label>
                    <Select
                      value={surveyForm.transactionType}
                      onValueChange={(v) => setSurveyForm({ ...surveyForm, transactionType: v ?? "호가" })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TRANSACTION_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">출처</Label>
                    <Input
                      placeholder="네이버, 직방 등"
                      value={surveyForm.source}
                      onChange={(e) => setSurveyForm({ ...surveyForm, source: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>
                <Button
                  onClick={addSurvey}
                  disabled={!surveyForm.areaPyeong || !surveyForm.price}
                  className="w-full mt-4 gradient-primary border-0 hover:opacity-90 transition-opacity"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  추가
                </Button>
              </CardContent>
            </Card>
          )}

          {surveyList.length > 0 ? (
            <Card className="glass-card border-0 overflow-hidden">
              {/* Filter & sort toolbar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30 bg-muted/20">
                <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                <div className="flex gap-1.5">
                  {["전체", ...TRANSACTION_TYPES].map((t) => (
                    <button
                      key={t}
                      onClick={() => setFilterType(t)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                        filterType === t
                          ? "bg-primary text-white"
                          : "bg-white/60 text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <span className="ml-auto text-[11px] text-muted-foreground tabular-nums">
                  {filteredSurveys.length}건
                </span>
              </div>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead
                          className="font-semibold text-xs cursor-pointer hover:text-primary select-none"
                          onClick={() => toggleSort("buildingName")}
                        >
                          <span className="inline-flex items-center">건물명 <SortIcon field="buildingName" /></span>
                        </TableHead>
                        <TableHead
                          className="text-right font-semibold text-xs cursor-pointer hover:text-primary select-none"
                          onClick={() => toggleSort("surveyDate")}
                        >
                          <span className="inline-flex items-center justify-end">거래일 <SortIcon field="surveyDate" /></span>
                        </TableHead>
                        <TableHead
                          className="text-right font-semibold text-xs cursor-pointer hover:text-primary select-none"
                          onClick={() => toggleSort("areaPyeong")}
                        >
                          <span className="inline-flex items-center justify-end">평형 <SortIcon field="areaPyeong" /></span>
                        </TableHead>
                        <TableHead
                          className="text-right font-semibold text-xs cursor-pointer hover:text-primary select-none"
                          onClick={() => toggleSort("yearBuilt")}
                        >
                          <span className="inline-flex items-center justify-end">연식 <SortIcon field="yearBuilt" /></span>
                        </TableHead>
                        <TableHead className="text-right font-semibold text-xs">층</TableHead>
                        <TableHead className="text-right font-semibold text-xs">가격</TableHead>
                        <TableHead
                          className="text-right font-semibold text-xs cursor-pointer hover:text-primary select-none"
                          onClick={() => toggleSort("pricePerPyeong")}
                        >
                          <span className="inline-flex items-center justify-end">평당가 <SortIcon field="pricePerPyeong" /></span>
                        </TableHead>
                        <TableHead className="font-semibold text-xs">유형</TableHead>
                        <TableHead className="font-semibold text-xs">출처</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSurveys.map((s) => (
                        <TableRow key={s.id} className="hover:bg-accent/40 transition-colors group">
                          <TableCell className="font-medium text-sm">
                            {s.buildingName || "-"}
                          </TableCell>
                          <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                            {formatDate(s.surveyDate)}
                          </TableCell>
                          <TableCell className="text-right text-sm tabular-nums">
                            {s.areaPyeong}평
                          </TableCell>
                          <TableCell className="text-right text-sm tabular-nums">
                            {s.yearBuilt || "-"}
                          </TableCell>
                          <TableCell className="text-right text-sm tabular-nums">
                            {s.floor ? `${s.floor}층` : "-"}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-sm tabular-nums">
                            {formatPrice(s.price)}
                          </TableCell>
                          <TableCell className="text-right text-sm tabular-nums">
                            <span className="font-semibold text-primary">{formatPrice(s.pricePerPyeong)}</span>
                            <span className="text-muted-foreground">/평</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-[10px] font-normal ${
                              s.transactionType === "실거래" ? "border-green-300 text-green-700" :
                              s.transactionType === "호가" ? "border-blue-300 text-blue-700" :
                              "border-amber-300 text-amber-700"
                            }`}>
                              {s.transactionType}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-24 truncate">
                            {s.source || "-"}
                          </TableCell>
                          <TableCell>
                            <button
                              onClick={() => deleteSurvey(s.id)}
                              className="p-1 rounded-md hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="glass-card border-dashed border-2 border-border/60">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                <Database className="w-8 h-8 mx-auto mb-3 text-muted-foreground/40" />
                아직 시세 데이터가 없습니다. 위 버튼으로 추가해보세요.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* === 매물 평가 탭 === */}
        <TabsContent value="listings" className="space-y-4 mt-4">
          <Card className="glass-card border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                새 매물 평가
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <Label className="text-[11px] text-muted-foreground">건물명</Label>
                  <Input
                    placeholder="빌라명"
                    value={listingForm.buildingName}
                    onChange={(e) => setListingForm({ ...listingForm, buildingName: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">평형 *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="예: 12.5"
                    value={listingForm.areaPyeong}
                    onChange={(e) => setListingForm({ ...listingForm, areaPyeong: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">준공연도</Label>
                  <Input
                    type="number"
                    placeholder="예: 2003"
                    value={listingForm.yearBuilt}
                    onChange={(e) => setListingForm({ ...listingForm, yearBuilt: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">층</Label>
                  <Input
                    type="number"
                    placeholder="예: 3"
                    value={listingForm.floor}
                    onChange={(e) => setListingForm({ ...listingForm, floor: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">호가 (만원) *</Label>
                  <Input
                    type="number"
                    placeholder="예: 32000"
                    value={listingForm.askingPrice}
                    onChange={(e) => setListingForm({ ...listingForm, askingPrice: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">매물 출처</Label>
                  <Input
                    placeholder="부동산, 직방 등"
                    value={listingForm.source}
                    onChange={(e) => setListingForm({ ...listingForm, source: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div className="col-span-2 flex items-end">
                  <Button
                    onClick={evaluateAndSaveListing}
                    disabled={!listingForm.areaPyeong || !listingForm.askingPrice || evaluating}
                    className="w-full gradient-primary border-0 hover:opacity-90 transition-opacity"
                    size="lg"
                  >
                    {evaluating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        평가 중...
                      </>
                    ) : (
                      "평가하기"
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Evaluation result */}
          {evalResult && (
            <Card className="glass-card border-0 overflow-hidden animate-in">
              <div className={`h-1 w-full ${
                evalResult.verdict === "적정" ? "bg-green-500" :
                evalResult.verdict === "다소높음" ? "bg-yellow-500" :
                evalResult.verdict === "고가" ? "bg-red-500" :
                evalResult.verdict === "저렴" ? "bg-blue-500" :
                "bg-emerald-500"
              }`} />
              <CardContent className="py-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Badge className={`text-base px-4 py-1.5 ${VERDICT_STYLES[evalResult.verdict] || ""}`}>
                      {evalResult.verdict}
                    </Badge>
                    <span className={`text-2xl font-bold tabular-nums ${
                      evalResult.priceGapPercent > 0 ? "text-red-600" : "text-blue-600"
                    }`}>
                      {evalResult.priceGapPercent > 0 ? "+" : ""}
                      {evalResult.priceGapPercent}%
                    </span>
                  </div>
                  <button
                    onClick={() => setEvalResult(null)}
                    className="p-1.5 rounded-lg hover:bg-accent transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                {evalResult.warning && (
                  <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mb-4">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {evalResult.warning}
                  </div>
                )}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "호가 평당가", value: formatPrice(evalResult.askingPricePerPyeong) + "/평" },
                    { label: "시세 중앙값", value: formatPrice(evalResult.medianPricePerPyeong) + "/평" },
                    { label: "적정 추정가", value: formatPrice(evalResult.assessedPrice) },
                    { label: "비교 건수", value: evalResult.matchedCount + "건" },
                  ].map((item) => (
                    <div key={item.label} className="p-3 rounded-xl bg-muted/40 text-center">
                      <p className="text-[11px] text-muted-foreground">{item.label}</p>
                      <p className="text-sm font-bold mt-1 tabular-nums">{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Matched surveys with date */}
                {evalResult.matchedSurveys.length > 0 && (
                  <div className="mt-4 overflow-x-auto">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">비교 시세 상세</p>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/20">
                          <TableHead className="text-xs font-semibold">건물명</TableHead>
                          <TableHead className="text-xs font-semibold text-right">거래일</TableHead>
                          <TableHead className="text-xs font-semibold text-right">평형</TableHead>
                          <TableHead className="text-xs font-semibold text-right">층</TableHead>
                          <TableHead className="text-xs font-semibold text-right">가격</TableHead>
                          <TableHead className="text-xs font-semibold text-right">평당가</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {evalResult.matchedSurveys.map((s) => (
                          <TableRow key={s.id} className="hover:bg-accent/30">
                            <TableCell className="text-sm">{s.buildingName || "-"}</TableCell>
                            <TableCell className="text-right text-sm tabular-nums text-muted-foreground">{formatDate(s.surveyDate)}</TableCell>
                            <TableCell className="text-right text-sm tabular-nums">{s.areaPyeong}평</TableCell>
                            <TableCell className="text-right text-sm tabular-nums">{s.floor ? `${s.floor}층` : "-"}</TableCell>
                            <TableCell className="text-right text-sm font-semibold tabular-nums">{formatPrice(s.price)}</TableCell>
                            <TableCell className="text-right text-sm tabular-nums text-primary font-semibold">{formatPrice(s.pricePerPyeong)}/평</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Listing list */}
          {listingList.length > 0 ? (
            <div className="space-y-3">
              {listingList.map((l) => (
                <Card key={l.id} className="glass-card border-0 hover:shadow-md transition-all duration-200">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          {l.verdict && (
                            <Badge variant="outline" className={`text-[11px] ${VERDICT_STYLES[l.verdict] || ""}`}>
                              {l.verdict}
                            </Badge>
                          )}
                          <span className="font-medium text-sm">
                            {l.buildingName || "빌라"} · {l.areaPyeong}평
                            {l.yearBuilt && ` · ${l.yearBuilt}년`}
                            {l.floor && ` · ${l.floor}층`}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>호가 <span className="font-semibold text-foreground">{formatPrice(l.askingPrice)}</span></span>
                          {l.assessedPrice && <span>추정가 <span className="font-semibold text-foreground">{formatPrice(l.assessedPrice)}</span></span>}
                          {l.priceGapPercent !== null && (
                            <span className={`font-bold ${l.priceGapPercent > 0 ? "text-red-600" : "text-blue-600"}`}>
                              {l.priceGapPercent > 0 ? "+" : ""}{l.priceGapPercent}%
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          {l.source && <span>{l.source}</span>}
                          <span>{formatDate(l.createdAt?.split(" ")[0])}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={l.status}
                          onValueChange={(v) => v && updateListingStatus(l.id, v)}
                        >
                          <SelectTrigger className="w-24 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {LISTING_STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <button
                          onClick={() => deleteListing(l.id)}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="glass-card border-dashed border-2 border-border/60">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                <TrendingUp className="w-8 h-8 mx-auto mb-3 text-muted-foreground/40" />
                아직 평가한 매물이 없습니다.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* === 분석 탭 === */}
        <TabsContent value="analysis" className="space-y-4 mt-4">
          {surveyList.length > 0 ? (
            <>
              {/* Summary stats cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {
                    label: "평균 평당가",
                    value: stats ? formatPrice(stats.avg) : "-",
                    icon: BarChart3,
                    color: "from-violet-500 to-indigo-600",
                  },
                  {
                    label: "최저",
                    value: stats ? formatPrice(stats.min) : "-",
                    icon: TrendingDown,
                    color: "from-cyan-500 to-blue-600",
                  },
                  {
                    label: "최고",
                    value: stats ? formatPrice(stats.max) : "-",
                    icon: TrendingUp,
                    color: "from-amber-500 to-orange-600",
                  },
                  {
                    label: "데이터 수",
                    value: surveyList.length + "건",
                    icon: Database,
                    color: "from-emerald-500 to-green-600",
                  },
                ].map((item) => (
                  <Card key={item.label} className="glass-card border-0">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
                          <p className="text-xl font-bold mt-1.5 tabular-nums">{item.value}</p>
                        </div>
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                          <item.icon className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* 시세 추이 (시계열 산점도) */}
              {timeSeriesData.length >= 2 && (
                <Card className="glass-card border-0">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      시세 추이 (평당가)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <ScatterChart margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="dateLabel"
                          type="category"
                          allowDuplicatedCategory={false}
                          tick={{ fontSize: 11 }}
                          stroke="#9ca3af"
                        />
                        <YAxis
                          dataKey="pricePerPyeong"
                          tick={{ fontSize: 11 }}
                          stroke="#9ca3af"
                          tickFormatter={(v: number) => `${v}만`}
                        />
                        <RechartsTooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const d = payload[0].payload;
                            return (
                              <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-border/50 text-xs space-y-1">
                                <p className="font-semibold">{d.buildingName}</p>
                                <p className="text-muted-foreground">거래일: {formatDate(d.date)}</p>
                                <p>평당가: <span className="font-bold text-primary">{formatPrice(d.pricePerPyeong)}/평</span></p>
                                <p>총가격: {formatPrice(d.price)} · {d.areaPyeong}평</p>
                                <p className="text-muted-foreground">{d.transactionType}</p>
                              </div>
                            );
                          }}
                        />
                        <Scatter
                          data={timeSeriesData}
                          fill="#6366f1"
                          fillOpacity={0.7}
                          r={6}
                          stroke="#4f46e5"
                          strokeWidth={1}
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* 건물별 평균 평당가 */}
              {buildingData.length >= 2 && (
                <Card className="glass-card border-0">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary" />
                      건물별 평균 평당가
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={Math.max(200, buildingData.length * 50)}>
                      <BarChart data={buildingData} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={(v: number) => `${v}만`} />
                        <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} stroke="#9ca3af" />
                        <RechartsTooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const d = payload[0].payload;
                            return (
                              <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-border/50 text-xs space-y-1">
                                <p className="font-semibold">{d.fullName}</p>
                                <p>평균 평당가: <span className="font-bold text-primary">{formatPrice(d.avg)}/평</span></p>
                                <p className="text-muted-foreground">범위: {formatPrice(d.min)} ~ {formatPrice(d.max)}/평</p>
                                <p className="text-muted-foreground">데이터: {d.count}건</p>
                              </div>
                            );
                          }}
                        />
                        <Bar dataKey="avg" radius={[0, 4, 4, 0]}>
                          {buildingData.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.8} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 연식별 평당가 */}
                {yearData.length >= 2 && (
                  <Card className="glass-card border-0">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        연식별 평균 평당가
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={yearData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="decade" tick={{ fontSize: 10 }} stroke="#9ca3af" />
                          <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" tickFormatter={(v: number) => `${v}`} />
                          <RechartsTooltip
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null;
                              const d = payload[0].payload;
                              return (
                                <div className="bg-white/95 backdrop-blur-sm rounded-xl p-2.5 shadow-lg border border-border/50 text-xs">
                                  <p className="font-semibold">{d.decade}</p>
                                  <p>평균 평당가: <span className="font-bold text-primary">{formatPrice(d.avg)}/평</span></p>
                                  <p className="text-muted-foreground">{d.count}건</p>
                                </div>
                              );
                            }}
                          />
                          <Bar dataKey="avg" fill="#8b5cf6" radius={[4, 4, 0, 0]} fillOpacity={0.8} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* 층별 평당가 */}
                {floorData.length >= 2 && (
                  <Card className="glass-card border-0">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Layers className="w-4 h-4 text-primary" />
                        층별 평균 평당가
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={floorData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="floor" tick={{ fontSize: 10 }} stroke="#9ca3af" />
                          <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" tickFormatter={(v: number) => `${v}`} />
                          <RechartsTooltip
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null;
                              const d = payload[0].payload;
                              return (
                                <div className="bg-white/95 backdrop-blur-sm rounded-xl p-2.5 shadow-lg border border-border/50 text-xs">
                                  <p className="font-semibold">{d.floor}</p>
                                  <p>평균 평당가: <span className="font-bold text-primary">{formatPrice(d.avg)}/평</span></p>
                                  <p className="text-muted-foreground">{d.count}건</p>
                                </div>
                              );
                            }}
                          />
                          <Bar dataKey="avg" fill="#06b6d4" radius={[4, 4, 0, 0]} fillOpacity={0.8} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* 평형별 평당가 분포 (bar) */}
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">평형별 평당가 분포</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(
                      surveyList.reduce((acc, s) => {
                        const key = `${Math.round(s.areaPyeong)}평`;
                        if (!acc[key]) acc[key] = [];
                        acc[key].push(s.pricePerPyeong);
                        return acc;
                      }, {} as Record<string, number[]>)
                    )
                      .sort(([a], [b]) => parseInt(a) - parseInt(b))
                      .map(([pyeong, prices]) => {
                        const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
                        const max = Math.max(...surveyList.map((s) => s.pricePerPyeong));
                        const width = max > 0 ? (avg / max) * 100 : 0;
                        return (
                          <div key={pyeong} className="flex items-center gap-3">
                            <span className="w-12 text-xs font-semibold text-right tabular-nums">
                              {pyeong}
                            </span>
                            <div className="flex-1 bg-muted/50 rounded-full h-8 relative overflow-hidden">
                              <div
                                className="h-8 rounded-full gradient-primary flex items-center justify-end pr-3 transition-all duration-500"
                                style={{ width: `${Math.max(width, 12)}%` }}
                              >
                                <span className="text-[11px] text-white font-semibold tabular-nums">
                                  {formatPrice(avg)}
                                </span>
                              </div>
                            </div>
                            <span className="text-[11px] text-muted-foreground w-8 tabular-nums">
                              {prices.length}건
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="glass-card border-dashed border-2 border-border/60">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                <BarChart3 className="w-8 h-8 mx-auto mb-3 text-muted-foreground/40" />
                시세 데이터를 등록하면 분석을 볼 수 있습니다.
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
