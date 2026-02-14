'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, Download } from 'lucide-react';

// 학생 목록 테이블 (TanStack Table 기반 — 추후 구현)
export function StudentTable() {
  return (
    <Card>
      <CardContent className="p-6">
        {/* 검색 + 액션 바 */}
        <div className="flex items-center justify-between mb-4">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="학생 이름, 학번으로 검색..." className="pl-10" />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              엑셀 내보내기
            </Button>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="h-4 w-4 mr-2" />
              학생 등록
            </Button>
          </div>
        </div>

        {/* 테이블 플레이스홀더 */}
        <div className="flex items-center justify-center h-96 border rounded-lg text-gray-400">
          TanStack Table 학생 목록이 여기에 표시됩니다.
        </div>
      </CardContent>
    </Card>
  );
}
