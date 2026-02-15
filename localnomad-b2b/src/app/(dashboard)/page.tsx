'use client';

import { SummaryCards } from '@/components/dashboard/summary-cards';
import { TrafficLightSummary } from '@/components/dashboard/traffic-light-summary';
import { RecentAlerts } from '@/components/dashboard/recent-alerts';
import { IeqasGauge } from '@/components/dashboard/ieqas-gauge';

// 대시보드 메인 페이지 — 요약 카드 + 트래픽 라이트 + 최근 알림 + IEQAS 게이지
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <p className="text-sm text-gray-500 mt-1">
          유학생 비자 관리 현황을 한눈에 확인하세요.
        </p>
      </div>

      {/* 요약 카드 4개 */}
      <SummaryCards />

      {/* 트래픽 라이트 요약 (긴급 / 주의 / 정상) */}
      <TrafficLightSummary />

      {/* 최근 알림 + IEQAS 불법체류율 게이지 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentAlerts />
        <IeqasGauge overstayRate={0} />
      </div>
    </div>
  );
}
