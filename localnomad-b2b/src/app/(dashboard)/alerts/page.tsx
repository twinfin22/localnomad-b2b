import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// 알림 페이지 — 전체 알림 목록
export default function AlertsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">알림</h1>
        <p className="text-sm text-gray-500 mt-1">비자 만료, 출석률 저조, FIMS 기한 등 주요 알림을 확인합니다.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>알림 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96 text-gray-400">
            알림 목록이 여기에 표시됩니다.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
