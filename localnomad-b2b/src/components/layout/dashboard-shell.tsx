'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Header } from '@/components/layout/header';
import { MobileNav } from '@/components/layout/mobile-nav';

// Lazy load ChatWidget — starts collapsed, rarely used on initial load
const ChatWidget = dynamic(
  () => import('@/components/chat/chat-widget').then((m) => ({ default: m.ChatWidget })),
  { ssr: false },
);

// Client wrapper for interactive parts of the dashboard layout
// Keeps the parent layout as a Server Component
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <>
      {/* 모바일 네비게이션 */}
      <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />

      {/* 메인 콘텐츠 영역 */}
      <div className="lg:pl-60">
        <Header onMobileMenuClick={() => setMobileNavOpen(true)} />
        <main className="p-6">
          {children}
        </main>
      </div>

      {/* AI 상담 채팅 위젯 */}
      <ChatWidget />
    </>
  );
}
