"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  STAGES,
  STAGE_COLORS,
  formatPrice,
  type Stage,
} from "@/lib/constants";
import {
  Plus,
  Pencil,
  Trash2,
  MapPin,
  BarChart3,
  Calendar,
  Users,
  ArrowRight,
} from "lucide-react";

interface ZoneRow {
  id: number;
  name: string;
  district: string;
  city: string;
  stage: string;
  estimatedMoveIn: string | null;
  estimatedHouseholds: number | null;
  notes: string | null;
  surveyCount: number;
  avgPricePerPyeong: number;
}

const EMPTY_FORM = {
  name: "",
  district: "",
  city: "서울",
  stage: "정비구역지정" as string,
  estimatedMoveIn: "",
  estimatedHouseholds: "",
  notes: "",
};

export default function ZonesPage() {
  const [zones, setZones] = useState<ZoneRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState<number | null>(null);

  const fetchZones = useCallback(() => {
    fetch("/api/zones")
      .then((r) => r.json())
      .then(setZones)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  const handleSubmit = async () => {
    const payload = {
      ...form,
      estimatedHouseholds: form.estimatedHouseholds
        ? Number(form.estimatedHouseholds)
        : null,
    };

    if (editId) {
      await fetch(`/api/zones/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/zones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setOpen(false);
    setForm(EMPTY_FORM);
    setEditId(null);
    fetchZones();
  };

  const openEdit = (zone: ZoneRow) => {
    setForm({
      name: zone.name,
      district: zone.district,
      city: zone.city,
      stage: zone.stage,
      estimatedMoveIn: zone.estimatedMoveIn || "",
      estimatedHouseholds: zone.estimatedHouseholds?.toString() || "",
      notes: zone.notes || "",
    });
    setEditId(zone.id);
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("이 구역을 삭제하시겠습니까? 관련 시세/매물 데이터도 모두 삭제됩니다."))
      return;
    await fetch(`/api/zones/${id}`, { method: "DELETE" });
    fetchZones();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">구역 관리</h1>
          <p className="text-sm text-muted-foreground mt-1">
            재개발 구역을 등록하고 시세를 관리하세요.
          </p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) {
              setForm(EMPTY_FORM);
              setEditId(null);
            }
          }}
        >
          <DialogTrigger
            render={
              <Button className="gradient-primary border-0 shadow-lg shadow-primary/25 hover:opacity-90 transition-opacity gap-2">
                <Plus className="w-4 h-4" />
                구역 추가
              </Button>
            }
          />
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg">
                {editId ? "구역 수정" : "새 구역 등록"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label className="text-xs font-medium">구역명 *</Label>
                <Input
                  placeholder="예: 한남3구역"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-xs font-medium">소재지 (구/동) *</Label>
                <Input
                  placeholder="예: 용산구 한남동"
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium">도시</Label>
                  <Input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium">진행 단계</Label>
                  <Select
                    value={form.stage}
                    onValueChange={(v) => setForm({ ...form, stage: v ?? "정비구역지정" })}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium">예상 입주시기</Label>
                  <Input
                    placeholder="예: 2029년"
                    value={form.estimatedMoveIn}
                    onChange={(e) => setForm({ ...form, estimatedMoveIn: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium">예상 세대수</Label>
                  <Input
                    type="number"
                    placeholder="예: 5200"
                    value={form.estimatedHouseholds}
                    onChange={(e) => setForm({ ...form, estimatedHouseholds: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium">메모</Label>
                <Textarea
                  placeholder="구역 관련 메모"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <Button
                onClick={handleSubmit}
                className="w-full gradient-primary border-0 shadow-md shadow-primary/20 hover:opacity-90 transition-opacity"
                disabled={!form.name || !form.district}
              >
                {editId ? "수정" : "등록"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {zones.length === 0 ? (
        <Card className="glass-card border-dashed border-2 border-primary/20">
          <CardContent className="py-16 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl gradient-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
              <MapPin className="w-7 h-7 text-white" />
            </div>
            <p className="font-semibold text-lg">구역을 등록해보세요</p>
            <p className="text-muted-foreground mt-1.5 text-sm">
              관심있는 재개발 구역을 추가하면 시세 관리와 매물 평가를 시작할 수 있습니다.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {zones.map((zone) => (
            <Card
              key={zone.id}
              className="glass-card border-0 group relative hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
            >
              <Link href={`/zones/${zone.id}`} className="block">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base group-hover:text-primary transition-colors">
                          {zone.name}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {zone.city} {zone.district}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${STAGE_COLORS[zone.stage as Stage] || ""}`}
                    >
                      {zone.stage}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <BarChart3 className="w-3.5 h-3.5" />
                      시세 {zone.surveyCount}건
                    </div>
                    {zone.avgPricePerPyeong > 0 && (
                      <span className="text-sm font-semibold tabular-nums">
                        {formatPrice(zone.avgPricePerPyeong)}/평
                      </span>
                    )}
                  </div>
                  {(zone.estimatedMoveIn || zone.estimatedHouseholds) && (
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      {zone.estimatedMoveIn && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {zone.estimatedMoveIn}
                        </span>
                      )}
                      {zone.estimatedHouseholds && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {zone.estimatedHouseholds.toLocaleString()}세대
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity pt-1">
                    상세 보기 <ArrowRight className="w-3 h-3 ml-1" />
                  </div>
                </CardContent>
              </Link>
              {/* Edit/Delete buttons */}
              <div className="absolute top-3 right-12 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    openEdit(zone);
                  }}
                  className="p-1.5 rounded-lg hover:bg-accent transition-colors"
                  title="수정"
                >
                  <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(zone.id);
                  }}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                  title="삭제"
                >
                  <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
