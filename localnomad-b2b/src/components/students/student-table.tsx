'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
  VisibilityState,
} from '@tanstack/react-table';
import { Settings, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TrafficLight } from './traffic-light';
import { formatDate } from '@/lib/utils';
import {
  VISA_TYPE_LABELS,
  ENROLLMENT_STATUS_LABELS,
  VISA_STATUS_LABELS,
  INSURANCE_STATUS_LABELS,
} from '@/lib/constants';
import { useStudentStore } from '@/store/student-store';
import type { StudentWithTrafficLight } from '@/types';

// Enrollment status badge color mapping
const enrollmentBadgeClass: Record<string, string> = {
  ENROLLED: 'bg-emerald-100 text-emerald-700',
  ON_LEAVE: 'bg-amber-100 text-amber-700',
  EXPELLED: 'bg-red-100 text-red-700',
  WITHDRAWN: 'bg-red-100 text-red-700',
  UNREGISTERED: 'bg-red-100 text-red-700',
  GRADUATED: 'bg-blue-100 text-blue-700',
};

// Visa status badge color mapping
const visaBadgeClass: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  EXPIRING_SOON: 'bg-amber-100 text-amber-700',
  EXPIRED: 'bg-red-100 text-red-700',
  REVOKED: 'bg-red-100 text-red-700',
};

// Column header labels for visibility toggle
const COLUMN_LABELS: Record<string, string> = {
  trafficLight: '상태',
  nameKr: '이름(한글)',
  nameEn: '이름(영문)',
  nationality: '국적',
  department: '학과',
  visaType: '비자 유형',
  visaExpiry: '비자 만료일',
  enrollmentStatus: '학적 상태',
  visaStatus: '비자 상태',
  insuranceStatus: '보험',
  attendanceRate: '출석률',
};

export function StudentTable() {
  const router = useRouter();
  const students = useStudentStore((s) => s.students);
  const total = useStudentStore((s) => s.total);
  const isLoading = useStudentStore((s) => s.isLoading);
  const error = useStudentStore((s) => s.error);
  const page = useStudentStore((s) => s.page);
  const limit = useStudentStore((s) => s.limit);
  const filters = useStudentStore((s) => s.filters);
  const fetchStudents = useStudentStore((s) => s.fetchStudents);
  const setPage = useStudentStore((s) => s.setPage);
  const setFilter = useStudentStore((s) => s.setFilter);

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  // Fetch students on mount
  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle sort click
  const handleSort = (columnId: string) => {
    if (filters.sortBy === columnId) {
      setFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setFilter('sortBy', columnId);
      // sortOrder will reset via a separate call — set both together
    }
  };

  // Render sort icon for a column
  const renderSortIcon = (columnId: string) => {
    if (filters.sortBy !== columnId) {
      return <ArrowUpDown className="h-3.5 w-3.5 ml-1 text-gray-400" />;
    }
    return filters.sortOrder === 'asc' ? (
      <ArrowUp className="h-3.5 w-3.5 ml-1 text-indigo-600" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 ml-1 text-indigo-600" />
    );
  };

  // Column definitions
  const columns = useMemo<ColumnDef<StudentWithTrafficLight>[]>(
    () => [
      {
        id: 'trafficLight',
        header: '상태',
        size: 60,
        cell: ({ row }) => (
          <TrafficLight status={row.original.trafficLight} size="sm" />
        ),
      },
      {
        accessorKey: 'nameKr',
        id: 'nameKr',
        header: '이름(한글)',
        size: 120,
        cell: ({ row }) => (
          <span className="font-medium text-gray-900">
            {row.original.nameKr ?? '\u2014'}
          </span>
        ),
      },
      {
        accessorKey: 'nameEn',
        id: 'nameEn',
        header: '이름(영문)',
        size: 160,
        cell: ({ row }) => (
          <span className="text-gray-700">{row.original.nameEn}</span>
        ),
      },
      {
        accessorKey: 'nationality',
        id: 'nationality',
        header: '국적',
        size: 100,
        cell: ({ row }) => row.original.nationality,
      },
      {
        accessorKey: 'department',
        id: 'department',
        header: '학과',
        size: 140,
        cell: ({ row }) => row.original.department,
      },
      {
        accessorKey: 'visaType',
        id: 'visaType',
        header: '비자 유형',
        size: 140,
        cell: ({ row }) =>
          VISA_TYPE_LABELS[row.original.visaType] ?? row.original.visaType,
      },
      {
        accessorKey: 'visaExpiry',
        id: 'visaExpiry',
        header: '비자 만료일',
        size: 120,
        cell: ({ row }) => formatDate(row.original.visaExpiry),
      },
      {
        accessorKey: 'enrollmentStatus',
        id: 'enrollmentStatus',
        header: '학적 상태',
        size: 100,
        cell: ({ row }) => {
          const status = row.original.enrollmentStatus;
          return (
            <Badge
              variant="ghost"
              className={enrollmentBadgeClass[status] ?? 'bg-gray-100 text-gray-700'}
            >
              {ENROLLMENT_STATUS_LABELS[status] ?? status}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'visaStatus',
        id: 'visaStatus',
        header: '비자 상태',
        size: 100,
        cell: ({ row }) => {
          const status = row.original.visaStatus;
          return (
            <Badge
              variant="ghost"
              className={visaBadgeClass[status] ?? 'bg-gray-100 text-gray-700'}
            >
              {VISA_STATUS_LABELS[status] ?? status}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'insuranceStatus',
        id: 'insuranceStatus',
        header: '보험',
        size: 90,
        cell: ({ row }) =>
          INSURANCE_STATUS_LABELS[row.original.insuranceStatus] ??
          row.original.insuranceStatus,
      },
      {
        accessorKey: 'attendanceRate',
        id: 'attendanceRate',
        header: '출석률',
        size: 80,
        cell: ({ row }) => {
          const rate = row.original.attendanceRate;
          return rate === null || rate === undefined ? '\u2014' : `${rate}%`;
        },
      },
    ],
    [],
  );

  const table = useReactTable({
    data: students,
    columns,
    state: {
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: 'onChange',
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.ceil(total / limit),
  });

  // Pagination calculations
  const totalPages = Math.ceil(total / limit);
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  const canPrevious = page > 1;
  const canNext = page < totalPages;

  // Loading skeleton
  if (isLoading && students.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {Array.from({ length: 11 }).map((_, i) => (
                  <TableHead key={i}>
                    <Skeleton className="h-4 w-20" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 8 }).map((_, rowIdx) => (
                <TableRow key={rowIdx}>
                  {Array.from({ length: 11 }).map((_, colIdx) => (
                    <TableCell key={colIdx}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-40 text-red-500">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        {/* Column visibility toggle */}
        <div className="flex items-center justify-end px-4 py-2 border-b">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4 mr-1" />
                컬럼 설정
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>표시할 컬럼 선택</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table.getAllLeafColumns().map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {COLUMN_LABELS[column.id] ?? column.id}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Table */}
        <Table style={{ width: table.getCenterTotalSize() }}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className="relative select-none"
                  >
                    {header.isPlaceholder ? null : (
                      <button
                        type="button"
                        className="flex items-center cursor-pointer hover:text-gray-900"
                        onClick={() => handleSort(header.column.id)}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {renderSortIcon(header.column.id)}
                      </button>
                    )}
                    {/* Column resize handle */}
                    <div
                      onMouseDown={header.getResizeHandler()}
                      onTouchStart={header.getResizeHandler()}
                      className={`absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none ${
                        header.column.getIsResizing()
                          ? 'bg-indigo-500'
                          : 'hover:bg-gray-300'
                      }`}
                    />
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-40 text-center text-gray-400"
                >
                  등록된 학생이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() =>
                    router.push(`/students/${row.original.id}`)
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <span className="text-sm text-gray-500">
              총 {total}명 중 {start}-{end}명 표시
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!canPrevious}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                이전
              </Button>
              <span className="text-sm text-gray-700 px-2">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!canNext}
                onClick={() => setPage(page + 1)}
              >
                다음
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
