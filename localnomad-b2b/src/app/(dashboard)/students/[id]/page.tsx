import { StudentDetail } from '@/components/students/student-detail';

// 학생 상세 페이지
export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <StudentDetail studentId={id} />
    </div>
  );
}
