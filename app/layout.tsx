import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "재개발 시세분석기",
  description: "재개발 구역 빌라 시세 조사 및 매물 평가 도구",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex gradient-surface">
        <Sidebar />
        <main className="flex-1 min-h-screen">
          <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto animate-in">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
