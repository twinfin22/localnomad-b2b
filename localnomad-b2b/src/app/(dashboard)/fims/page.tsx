import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// FIMS 관리 페이지 — 변동신고 대기열
export default function FimsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">FIMS 관리</h1>
        <p className="text-sm text-gray-500 mt-1">FIMS 변동신고 및 정기보고를 관리합니다.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>변동신고 대기열</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96 text-gray-400">
            FIMS 변동신고 대기열이 여기에 표시됩니다.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
