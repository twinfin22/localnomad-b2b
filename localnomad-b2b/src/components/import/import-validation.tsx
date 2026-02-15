'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import type { ImportValidationResult, ImportValidatedRow } from '@/types';

interface ImportValidationProps {
  validationResult: ImportValidationResult;
  fileName: string;
  onExecute: (duplicateAction: 'skip' | 'overwrite' | 'manual') => void;
  onBack: () => void;
  isExecuting: boolean;
}

const StatusBadge = ({ row }: { row: ImportValidatedRow }) => {
  if (row.errors.length > 0) {
    return (
      <Badge className="bg-red-100 text-red-700 border-red-200">
        <XCircle className="mr-1 h-3 w-3" />
        오류
      </Badge>
    );
  }
  if (row.duplicate) {
    return (
      <Badge className="bg-amber-100 text-amber-700 border-amber-200">
        <AlertTriangle className="mr-1 h-3 w-3" />
        중복
      </Badge>
    );
  }
  return (
    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
      <CheckCircle className="mr-1 h-3 w-3" />
      정상
    </Badge>
  );
};

const MATCH_FIELD_LABELS: Record<string, string> = {
  passportNumber: '여권번호',
  arcNumber: '외국인등록번호',
  nameAndNationality: '이름+국적',
};

const RowTable = ({ rows }: { rows: ImportValidatedRow[] }) => {
  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-gray-400">
        해당하는 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">행번호</TableHead>
            <TableHead className="w-[150px]">이름</TableHead>
            <TableHead className="w-[150px]">학과</TableHead>
            <TableHead className="w-[120px]">비자유형</TableHead>
            <TableHead className="w-[100px]">상태</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.rowIndex}>
              <TableCell className="text-gray-500">{row.rowIndex}</TableCell>
              <TableCell className="font-medium">
                {(row.data.nameEn as string) || '-'}
              </TableCell>
              <TableCell>{(row.data.department as string) || '-'}</TableCell>
              <TableCell>{(row.data.visaType as string) || '-'}</TableCell>
              <TableCell>
                <StatusBadge row={row} />
              </TableCell>
            </TableRow>
          ))}
          {/* Inline error/duplicate detail rows */}
          {rows.map((row) => {
            if (row.errors.length > 0) {
              return (
                <TableRow key={`err-${row.rowIndex}`} className="bg-red-50">
                  <TableCell />
                  <TableCell colSpan={4} className="text-sm text-red-600">
                    {row.errors.map((e, i) => (
                      <span key={i}>
                        {e.field}: {e.message}
                        {i < row.errors.length - 1 && ' / '}
                      </span>
                    ))}
                  </TableCell>
                </TableRow>
              );
            }
            if (row.duplicate) {
              return (
                <TableRow key={`dup-${row.rowIndex}`} className="bg-amber-50">
                  <TableCell />
                  <TableCell colSpan={4} className="text-sm text-amber-600">
                    기존 학생과 중복 (
                    {MATCH_FIELD_LABELS[row.duplicate.matchField] ||
                      row.duplicate.matchField}
                    ): {row.duplicate.existingNameEn}
                  </TableCell>
                </TableRow>
              );
            }
            return null;
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export const ImportValidation = ({
  validationResult,
  fileName,
  onExecute,
  onBack,
  isExecuting,
}: ImportValidationProps) => {
  const [duplicateAction, setDuplicateAction] = useState<'skip' | 'overwrite'>(
    'skip'
  );

  const { summary, validRows, errorRows, duplicateRows } = validationResult;
  const allRows = [...validRows, ...errorRows, ...duplicateRows].sort(
    (a, b) => a.rowIndex - b.rowIndex
  );

  const canExecute =
    summary.valid > 0 || (duplicateAction === 'overwrite' && summary.duplicates > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">데이터 검증 결과</CardTitle>
        <p className="text-sm text-gray-500">{fileName}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary banner */}
        <div className="rounded-md bg-gray-50 px-4 py-3 text-sm border border-gray-200">
          총{' '}
          <span className="font-semibold">{summary.total}건</span> 중 &mdash;{' '}
          <span className="font-semibold text-emerald-600">
            정상 {summary.valid}건
          </span>
          ,{' '}
          <span className="font-semibold text-red-600">
            오류 {summary.errors}건
          </span>
          ,{' '}
          <span className="font-semibold text-amber-600">
            중복 {summary.duplicates}건
          </span>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">전체 ({summary.total})</TabsTrigger>
            <TabsTrigger value="valid">정상 ({summary.valid})</TabsTrigger>
            <TabsTrigger value="errors">오류 ({summary.errors})</TabsTrigger>
            <TabsTrigger value="duplicates">
              중복 ({summary.duplicates})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <RowTable rows={allRows} />
          </TabsContent>

          <TabsContent value="valid" className="mt-4">
            <RowTable rows={validRows} />
          </TabsContent>

          <TabsContent value="errors" className="mt-4">
            <RowTable rows={errorRows} />
          </TabsContent>

          <TabsContent value="duplicates" className="mt-4">
            <RowTable rows={duplicateRows} />
          </TabsContent>
        </Tabs>

        {/* Duplicate resolution section */}
        {duplicateRows.length > 0 && (
          <div className="rounded-md bg-amber-50 p-4 border border-amber-200 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              중복 데이터 처리 방법
            </div>
            <Select
              value={duplicateAction}
              onValueChange={(value) =>
                setDuplicateAction(value as 'skip' | 'overwrite')
              }
            >
              <SelectTrigger className="w-full max-w-md bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="skip">
                  기존 데이터 유지 (건너뛰기)
                </SelectItem>
                <SelectItem value="overwrite">
                  새 데이터로 덮어쓰기
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex justify-between pt-2">
          <Button variant="outline" onClick={onBack} disabled={isExecuting}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            돌아가기
          </Button>
          <Button
            onClick={() => onExecute(duplicateAction)}
            disabled={!canExecute || isExecuting}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isExecuting ? (
              <>
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                가져오는 중...
              </>
            ) : (
              '가져오기 실행'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
