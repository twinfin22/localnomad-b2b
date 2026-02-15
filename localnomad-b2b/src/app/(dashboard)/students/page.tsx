'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StudentFilters } from '@/components/students/student-filters';
import { StudentTable } from '@/components/students/student-table';

// StudentFilters uses useSearchParams, which requires a Suspense boundary
function FiltersWithSuspense() {
  return (
    <Suspense fallback={<div className="h-10" />}>
      <StudentFilters />
    </Suspense>
  );
}

// 학생 관리 페이지 — 학생 목록 테이블
export default function StudentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">학생 관리</h1>
          <p className="text-sm text-gray-500 mt-1">
            등록된 유학생 목록을 조회하고 관리합니다.
          </p>
        </div>
        <Link href="/students/new">
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4 mr-2" />
            새 학생 등록
          </Button>
        </Link>
      </div>

      <FiltersWithSuspense />
      <StudentTable />
    </div>
  );
}
