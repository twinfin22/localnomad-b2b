import { Sidebar } from '@/components/layout/sidebar';
import { DashboardShell } from '@/components/layout/dashboard-shell';

// 대시보드 레이아웃: 좌측 사이드바(240px) + 상단 헤더(64px) + 메인 콘텐츠
// Server Component — interactive parts are in DashboardShell (client)
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 데스크톱 사이드바 */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-60 lg:flex-col">
        <Sidebar />
      </aside>

      <DashboardShell>{children}</DashboardShell>
    </div>
  );
}
