import { StudentForm } from '@/components/students/student-form';

// 새 학생 등록 페이지
export default function NewStudentPage() {
  return (
    <div className="space-y-6">
      <StudentForm mode="create" />
    </div>
  );
}
