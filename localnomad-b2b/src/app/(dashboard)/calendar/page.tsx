import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// 비자 캘린더 페이지 — 비자 만료일 시각화
export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">비자 캘린더</h1>
        <p className="text-sm text-gray-500 mt-1">학생별 비자 만료일을 캘린더로 확인합니다.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>비자 만료 캘린더</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96 text-gray-400">
            캘린더 뷰가 여기에 표시됩니다.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
