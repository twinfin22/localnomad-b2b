import { StudentForm } from '@/components/students/student-form';

// 학생 정보 수정 페이지
export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <StudentForm mode="edit" studentId={id} />
    </div>
  );
}
