import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StudentDetailProps {
  studentId: string;
}

// 학생 상세 정보 뷰 (추후 API 연동)
export function StudentDetail({ studentId }: StudentDetailProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">학생 상세 정보</h1>
        <p className="text-sm text-gray-500 mt-1">학생 ID: {studentId}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-48 text-gray-400">
              학생 기본 정보가 여기에 표시됩니다.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>비자 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-48 text-gray-400">
              비자 및 체류 정보가 여기에 표시됩니다.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
