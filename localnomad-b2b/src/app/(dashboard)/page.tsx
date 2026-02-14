import { SummaryCards } from '@/components/dashboard/summary-cards';
import { RecentAlerts } from '@/components/dashboard/recent-alerts';

// 대시보드 메인 페이지 — 요약 카드 + 최근 알림
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <p className="text-sm text-gray-500 mt-1">유학생 비자 관리 현황을 한눈에 확인하세요.</p>
      </div>

      {/* 요약 카드 4개 */}
      <SummaryCards />

      {/* 최근 알림 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentAlerts />

        {/* IEQAS 불법체류율 게이지 (목업) */}
        <div className="rounded-lg border bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">IEQAS 불법체류율</h3>
          <div className="space-y-4">
            {/* 게이지 바 */}
            <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-400 to-amber-400 rounded-full"
                style={{ width: '36%' }}
              />
              {/* 현재 수치 마커 */}
              <div
                className="absolute inset-y-0 flex items-center"
                style={{ left: '36%' }}
              >
                <div className="w-1 h-full bg-indigo-600" />
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>0%</span>
              <span className="text-emerald-600 font-medium">우수 1%</span>
              <span className="text-amber-600 font-medium">기본 2%</span>
              <span>5%</span>
            </div>
            <p className="text-center text-2xl font-bold text-indigo-600">1.8%</p>
            <p className="text-center text-sm text-gray-500">현재 불법체류율 — IEQAS 기본 인증 기준 충족</p>
          </div>
        </div>
      </div>
    </div>
  );
}
