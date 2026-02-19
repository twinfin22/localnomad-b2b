'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  XCircle,
  SkipForward,
  Download,
  Users,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { ImportExecutionResult } from '@/types';

interface ImportResultProps {
  result: ImportExecutionResult;
  fileName: string;
  onGoToStudents: () => void;
  onNewImport: () => void;
}

export const ImportResult = ({
  result,
  fileName,
  onGoToStudents,
  onNewImport,
}: ImportResultProps) => {
  const [showDetails, setShowDetails] = useState(false);

  const total = result.imported + result.skipped + result.failed + result.updated;
  const progressRatio = total > 0 ? result.imported / total : 0;

  const handleDownloadCsv = () => {
    const BOM = '\uFEFF';
    const header = '행번호,상태,오류내용';
    const rows = result.errors.map(
      (e) => `${e.rowIndex},실패,"${e.error}"`
    );
    const csv = BOM + header + '\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().slice(0, 10);
    a.download = `가져오기_결과_${fileName}_${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader className="text-center pb-2">
        <div className="flex justify-center mb-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle className="h-10 w-10 text-emerald-500" />
          </div>
        </div>
        <CardTitle className="text-xl">가져오기 완료</CardTitle>
        <p className="text-sm text-gray-500 mt-1">{fileName}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats row */}
        <div className="flex gap-4">
          {/* Imported */}
          <div className="flex-1 rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">
              {result.imported}
            </p>
            <p className="text-sm text-emerald-700 mt-1">등록</p>
          </div>

          {/* Skipped */}
          <div className="flex-1 rounded-lg bg-gray-50 border border-gray-200 p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <SkipForward className="h-4 w-4 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-600">
              {result.skipped}
            </p>
            <p className="text-sm text-gray-500 mt-1">건너뜀</p>
          </div>

          {/* Failed — only show if > 0 */}
          {result.failed > 0 && (
            <div className="flex-1 rounded-lg bg-red-50 border border-red-200 p-4 text-center">
              <div className="flex items-center justify-center gap-1">
                <XCircle className="h-4 w-4 text-red-400" />
              </div>
              <p className="text-2xl font-bold text-red-600">
                {result.failed}
              </p>
              <p className="text-sm text-red-700 mt-1">실패</p>
            </div>
          )}

          {/* Updated — only show if > 0 */}
          {result.updated > 0 && (
            <div className="flex-1 rounded-lg bg-blue-50 border border-blue-200 p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">
                {result.updated}
              </p>
              <p className="text-sm text-blue-700 mt-1">업데이트</p>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>등록 진행률</span>
            <span>{Math.round(progressRatio * 100)}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-emerald-500 transition-all"
              style={{ width: `${progressRatio * 100}%` }}
            />
          </div>
        </div>

        {/* Collapsible error details */}
        {result.failed > 0 && (
          <div className="rounded-md border border-red-200">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
            >
              <span>실패 상세 ({result.errors.length}건)</span>
              {showDetails ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            {showDetails && (
              <div className="border-t border-red-200 px-4 py-3 space-y-2">
                {result.errors.map((err, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 text-sm text-red-600"
                  >
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      <span className="font-medium">행 {err.rowIndex}:</span>{' '}
                      {err.error}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          {result.errors.length > 0 && (
            <Button variant="outline" onClick={handleDownloadCsv}>
              <Download className="mr-1 h-4 w-4" />
              결과 다운로드 (CSV)
            </Button>
          )}
          <Button
            onClick={onGoToStudents}
            className="bg-brand-600 hover:bg-brand-700"
          >
            <Users className="mr-1 h-4 w-4" />
            학생 목록으로 이동
          </Button>
          <Button variant="outline" onClick={onNewImport}>
            <FileSpreadsheet className="mr-1 h-4 w-4" />
            새 파일 가져오기
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
