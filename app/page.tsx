"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDateShort, VERDICT_STYLES, STAGE_COLORS, type Stage } from "@/lib/constants";
import {
  MapPin,
  BarChart3,
  ClipboardCheck,
  Star,
  ArrowUpRight,
  TrendingUp,
  Plus,
  Calendar,
} from "lucide-react";

interface DashboardStats {
  zoneCount: number;
  surveyCount: number;
  listingCount: number;
  watchCount: number;
  zoneRanking: {
    id: number;
    name: string;
    district: string;
    city: string;
    stage: string;
    avgPricePerPyeong: number;
    surveyCount: number;
    latestSurveyDate: string | null;
  }[];
  recentListings: {
    id: number;
    zoneId: number;
    zoneName: string;
    buildingName: string | null;
    areaPyeong: number;
    askingPrice: number;
    verdict: string | null;
    createdAt: string;
  }[];
}

const STAT_CARDS = [
  { key: "zoneCount", label: "등록 구역", icon: MapPin, color: "from-violet-500 to-indigo-600" },
  { key: "surveyCount", label: "시세 데이터", icon: BarChart3, color: "from-cyan-500 to-blue-600" },
  { key: "listingCount", label: "매물 평가", icon: ClipboardCheck, color: "from-amber-500 to-orange-600" },
  { key: "watchCount", label: "관심 매물", icon: Star, color: "from-rose-500 to-pink-600" },
] as const;

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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

  if (!stats) return null;

  return (
    <div className="space-y-8 pb-20 md:pb-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">대시보드</h1>
        <p className="text-muted-foreground mt-1">전체 구역 현황과 최근 활동을 한눈에 확인하세요.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ key, label, icon: Icon, color }) => (
          <Card key={key} className="glass-card overflow-hidden group hover:shadow-lg transition-all duration-300 border-0">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {label}
                  </p>
                  <p className="text-3xl font-bold mt-2 tracking-tight">
                    {stats[key as keyof DashboardStats] as number}
                  </p>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg shadow-black/5 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Zone ranking */}
        <Card className="glass-card border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                구역별 평균 평당가
              </CardTitle>
              <Link
                href="/zones"
                className="text-xs text-primary hover:underline font-medium flex items-center gap-0.5"
              >
                전체 보기 <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {stats.zoneRanking.length > 0 ? (
              <div className="space-y-2">
                {stats.zoneRanking.map((zone, i) => (
                  <Link
                    key={zone.id}
                    href={`/zones/${zone.id}`}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-accent/60 transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                        i === 0 ? "bg-amber-100 text-amber-700" :
                        i === 1 ? "bg-gray-100 text-gray-600" :
                        i === 2 ? "bg-orange-100 text-orange-700" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {i + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm group-hover:text-primary transition-colors">
                            {zone.name}
                          </p>
                          <Badge variant="outline" className={`text-[9px] py-0 px-1.5 ${STAGE_COLORS[zone.stage as Stage] || ""}`}>
                            {zone.stage}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                          <span>{zone.city} {zone.district}</span>
                          <span>·</span>
                          <span>시세 {zone.surveyCount}건</span>
                          {zone.latestSurveyDate && (
                            <>
                              <span>·</span>
                              <span className="flex items-center gap-0.5">
                                <Calendar className="w-3 h-3" />
                                {formatDateShort(zone.latestSurveyDate)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="font-semibold text-sm tabular-nums">
                      {formatPrice(zone.avgPricePerPyeong)}/평
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                등록된 구역이 없습니다.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent listings */}
        <Card className="glass-card border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-primary" />
                최근 매물 평가
              </CardTitle>
              <Link
                href="/evaluate"
                className="text-xs text-primary hover:underline font-medium flex items-center gap-0.5"
              >
                새 평가 <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {stats.recentListings.length > 0 ? (
              <div className="space-y-2">
                {stats.recentListings.map((listing) => (
                  <Link
                    key={listing.id}
                    href={`/zones/${listing.zoneId}`}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-accent/60 transition-all duration-200 group"
                  >
                    <div>
                      <p className="font-medium text-sm group-hover:text-primary transition-colors">
                        {listing.zoneName}
                        {listing.buildingName && (
                          <span className="text-muted-foreground font-normal">
                            {" "}· {listing.buildingName}
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {listing.areaPyeong}평 · 호가{" "}
                        {formatPrice(listing.askingPrice)}
                      </p>
                    </div>
                    {listing.verdict && (
                      <Badge
                        variant="outline"
                        className={`text-[11px] ${VERDICT_STYLES[listing.verdict] || ""}`}
                      >
                        {listing.verdict}
                      </Badge>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                아직 평가 내역이 없습니다.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {stats.zoneCount === 0 && (
        <Card className="glass-card border-dashed border-2 border-primary/20">
          <CardContent className="py-14 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl gradient-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
              <Plus className="w-7 h-7 text-white" />
            </div>
            <p className="font-semibold text-lg">시작해볼까요?</p>
            <p className="text-muted-foreground mt-1.5 text-sm">
              관심 재개발 구역을 등록하고 시세를 조사해보세요.
            </p>
            <Link
              href="/zones"
              className="inline-flex items-center gap-2 mt-5 px-6 py-2.5 gradient-primary text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity shadow-lg shadow-primary/25"
            >
              <Plus className="w-4 h-4" />
              구역 등록하기
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
