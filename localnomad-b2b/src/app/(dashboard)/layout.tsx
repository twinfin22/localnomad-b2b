'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { MobileNav } from '@/components/layout/mobile-nav';

// 대시보드 레이아웃: 좌측 사이드바(240px) + 상단 헤더(64px) + 메인 콘텐츠
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 데스크톱 사이드바 */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-60 lg:flex-col">
        <Sidebar />
      </aside>

      {/* 모바일 네비게이션 */}
      <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />

      {/* 메인 콘텐츠 영역 */}
      <div className="lg:pl-60">
        <Header onMobileMenuClick={() => setMobileNavOpen(true)} />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
