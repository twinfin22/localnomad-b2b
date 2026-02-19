'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
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
      <PageHeader
        title="학생 관리"
        subtitle="등록된 유학생 목록을 조회하고 관리합니다."
        actions={
          <Link href="/students/new">
            <Button className="bg-brand-600 hover:bg-brand-700">
              <Plus className="h-4 w-4 mr-2" />
              새 학생 등록
            </Button>
          </Link>
        }
      />

      <FiltersWithSuspense />
      <StudentTable />
    </div>
  );
}
