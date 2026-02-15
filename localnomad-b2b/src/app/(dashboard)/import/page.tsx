'use client';

import { useState } from 'react';
import { FileUpload } from '@/components/import/file-upload';
import { ColumnMapping } from '@/components/import/column-mapping';
import { cn } from '@/lib/utils';
import { FileSpreadsheet, Columns3 } from 'lucide-react';
import { toast } from 'sonner';
import type { ParseResult, ColumnMapping as ColumnMappingType } from '@/types';

type ImportStep = 'upload' | 'mapping';

export default function ImportPage() {
  const [step, setStep] = useState<ImportStep>('upload');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);

  const handleParsed = (result: ParseResult) => {
    setParseResult(result);
    setStep('mapping');
  };

  const handleConfirm = (mappings: ColumnMappingType[]) => {
    // For now, show success toast (validation + execution deferred to later phase)
    const mappedCount = mappings.filter((m) => m.targetField !== null).length;
    toast.success(
      `${mappedCount}개 필드가 매핑되었습니다. 데이터 검증 및 등록 기능은 추후 제공됩니다.`
    );
  };

  const handleReset = () => {
    setStep('upload');
    setParseResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">데이터 가져오기</h1>
        <p className="text-sm text-gray-500 mt-1">
          엑셀 또는 CSV 파일을 업로드하여 학생 데이터를 일괄 등록합니다.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-4">
        <StepBadge
          number={1}
          label="파일 업로드"
          icon={<FileSpreadsheet className="h-4 w-4" />}
          isActive={step === 'upload'}
          isCompleted={step === 'mapping'}
        />
        <div className="h-px w-8 bg-gray-300" />
        <StepBadge
          number={2}
          label="컬럼 매핑"
          icon={<Columns3 className="h-4 w-4" />}
          isActive={step === 'mapping'}
          isCompleted={false}
        />
      </div>

      {/* File info summary when in mapping step */}
      {step === 'mapping' && parseResult && (
        <div className="rounded-md bg-indigo-50 px-4 py-3 text-sm text-indigo-800 border border-indigo-200">
          <span className="font-medium">{parseResult.fileName}</span>
          {' '}&mdash; {parseResult.totalRows.toLocaleString()}건
        </div>
      )}

      {/* Step content */}
      {step === 'upload' && <FileUpload onParsed={handleParsed} />}
      {step === 'mapping' && parseResult && (
        <ColumnMapping
          headers={parseResult.headers}
          preview={parseResult.preview}
          onConfirm={handleConfirm}
          onReset={handleReset}
        />
      )}
    </div>
  );
}

// Step indicator badge component
interface StepBadgeProps {
  number: number;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  isCompleted: boolean;
}

const StepBadge = ({ number, label, icon, isActive, isCompleted }: StepBadgeProps) => {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-indigo-600 text-white'
          : isCompleted
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-gray-100 text-gray-500'
      )}
    >
      <span
        className={cn(
          'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
          isActive
            ? 'bg-white text-indigo-600'
            : isCompleted
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-300 text-white'
        )}
      >
        {number}
      </span>
      {icon}
      {label}
    </div>
  );
};
