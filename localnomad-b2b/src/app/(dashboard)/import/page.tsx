import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// 데이터 임포트 페이지 — 엑셀/CSV 업로드
export default function ImportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">데이터 임포트</h1>
        <p className="text-sm text-gray-500 mt-1">엑셀 또는 CSV 파일로 학생 데이터를 일괄 등록합니다.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>파일 업로드</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96 text-gray-400">
            파일 업로드 영역이 여기에 표시됩니다.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
