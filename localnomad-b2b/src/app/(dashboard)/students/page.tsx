import { StudentTable } from '@/components/students/student-table';

// 학생 관리 페이지 — 학생 목록 테이블
export default function StudentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">학생 관리</h1>
          <p className="text-sm text-gray-500 mt-1">등록된 유학생 목록을 조회하고 관리합니다.</p>
        </div>
      </div>
      <StudentTable />
    </div>
  );
}
