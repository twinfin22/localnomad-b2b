import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// 학생 등록/수정 폼 (추후 구현)
export function StudentForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>학생 정보 입력</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-96 text-gray-400">
          학생 등록/수정 폼이 여기에 표시됩니다.
        </div>
      </CardContent>
    </Card>
  );
}
