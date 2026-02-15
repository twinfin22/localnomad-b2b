'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCalendarStore } from '@/store/calendar-store';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TrafficLight } from '@/components/students/traffic-light';
import { VISA_TYPE_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const FILTER_OPTIONS = [
  { value: '30', label: '30일 이내' },
  { value: '60', label: '60일 이내' },
  { value: '90', label: '90일 이내' },
  { value: 'all', label: '전체' },
] as const;

export function CalendarList() {
  const router = useRouter();
  const { events, listFilter, setListFilter } = useCalendarStore();

  // Flatten all events' students into a single sorted array
  const students = useMemo(() => {
    const allStudents = events.flatMap((event) =>
      event.students.map((student) => ({
        ...student,
        expiryDate: event.date,
      }))
    );

    // Sort by daysRemaining ascending (most urgent first)
    return allStudents.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [events]);

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <Tabs
        value={listFilter}
        onValueChange={(value) =>
          setListFilter(value as '30' | '60' | '90' | 'all')
        }
      >
        <TabsList>
          {FILTER_OPTIONS.map((option) => (
            <TabsTrigger key={option.value} value={option.value}>
              {option.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Student table */}
      {students.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>학과</TableHead>
                <TableHead>비자 유형</TableHead>
                <TableHead>만료일</TableHead>
                <TableHead>D-Day</TableHead>
                <TableHead>상태</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow
                  key={student.id}
                  onClick={() => router.push(`/students/${student.id}`)}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  <TableCell className="font-medium">
                    {student.nameKr || student.nameEn}
                  </TableCell>
                  <TableCell>{student.department}</TableCell>
                  <TableCell>
                    {VISA_TYPE_LABELS[student.visaType] ?? student.visaType}
                  </TableCell>
                  <TableCell>
                    {format(new Date(student.visaExpiry), 'yyyy.MM.dd')}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'font-semibold',
                        student.daysRemaining <= 30
                          ? 'text-red-600'
                          : student.daysRemaining <= 60
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                      )}
                    >
                      D-{student.daysRemaining}
                    </span>
                  </TableCell>
                  <TableCell>
                    <TrafficLight
                      status={student.trafficLight}
                      showLabel
                      size="sm"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex items-center justify-center h-48 text-gray-400 border rounded-lg">
          해당 기간에 만료 예정 학생이 없습니다.
        </div>
      )}
    </div>
  );
}
