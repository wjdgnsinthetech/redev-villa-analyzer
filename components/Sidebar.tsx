"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MapPin, Zap, Calculator, GitCompareArrows, Download } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "대시보드", icon: LayoutDashboard },
  { href: "/zones", label: "구역 관리", icon: MapPin },
  { href: "/evaluate", label: "빠른 평가", icon: Zap },
  { href: "/invest", label: "수익률 분석", icon: Calculator },
  { href: "/compare", label: "구역 비교", icon: GitCompareArrows },
  { href: "/import", label: "실거래가 가져오기", icon: Download },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r border-border/60 bg-white/80 backdrop-blur-sm shrink-0">
        <div className="p-5 pb-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-foreground">
                시세분석기
              </span>
              <p className="text-[10px] text-muted-foreground leading-none mt-0.5">
                재개발 빌라 시세 & 평가
              </p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "gradient-primary text-white shadow-md shadow-primary/25"
                    : "text-muted-foreground hover:bg-accent/80 hover:text-foreground"
                }`}
              >
                <Icon
                  className={`w-[18px] h-[18px] transition-transform duration-200 ${
                    isActive ? "" : "group-hover:scale-110"
                  }`}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mx-3 mb-3 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/10">
          <p className="text-xs font-medium text-primary">Quick Tip</p>
          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
            시세 데이터가 많을수록 평가 정확도가 높아집니다.
          </p>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-border/40 z-50 flex safe-area-pb">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-primary" : ""}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
