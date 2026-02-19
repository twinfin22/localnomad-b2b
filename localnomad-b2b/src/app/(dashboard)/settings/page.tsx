import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';

// 설정 페이지 — 대학 설정, 알림 설정
export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="설정"
        subtitle="대학 정보, 알림 설정, 계정 관리를 합니다."
      />
      <Card>
        <CardHeader>
          <CardTitle>대학 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96 text-gray-400">
            설정 항목이 여기에 표시됩니다.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
