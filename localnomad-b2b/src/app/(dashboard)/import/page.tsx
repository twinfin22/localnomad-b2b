'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileUpload } from '@/components/import/file-upload';
import { ColumnMapping } from '@/components/import/column-mapping';
import { ImportValidation } from '@/components/import/import-validation';
import { ImportResult } from '@/components/import/import-result';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  FileSpreadsheet,
  Columns3,
  CheckCircle,
  FileCheck,
  Loader2,
} from 'lucide-react';
import type {
  ParseResult,
  ColumnMapping as ColumnMappingType,
  ImportValidationResult,
  ImportExecutionResult,
} from '@/types';

type ImportStep = 'upload' | 'mapping' | 'validation' | 'result';

const STEP_ORDER: ImportStep[] = ['upload', 'mapping', 'validation', 'result'];

const getStepIndex = (step: ImportStep): number => STEP_ORDER.indexOf(step);

export default function ImportPage() {
  const router = useRouter();

  const [step, setStep] = useState<ImportStep>('upload');
  const [parseResult, setParseResult] = useState<
    (ParseResult & { allData?: string[][] }) | null
  >(null);
  const [validationResult, setValidationResult] =
    useState<ImportValidationResult | null>(null);
  const [executionResult, setExecutionResult] =
    useState<ImportExecutionResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  // Step 1: File parsed
  const handleParsed = (result: ParseResult & { allData?: string[][] }) => {
    setParseResult(result);
    setStep('mapping');
  };

  // Step 2: Column mappings confirmed -> validate
  const handleConfirm = async (confirmedMappings: ColumnMappingType[]) => {
    if (!parseResult) return;

    setIsValidating(true);

    try {
      const response = await fetch('/api/import/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: parseResult.fileName,
          mappings: confirmedMappings,
          data: parseResult.allData,
          headers: parseResult.headers,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        toast.error(result.error || '데이터 검증 중 오류가 발생했습니다.');
        return;
      }

      setValidationResult(result.data);
      setStep('validation');
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(`데이터 검증 실패: ${error.message}`);
      } else {
        toast.error('데이터 검증 중 오류가 발생했습니다.');
      }
    } finally {
      setIsValidating(false);
    }
  };

  // Step 3: Execute import
  const handleExecute = async (
    duplicateAction: 'skip' | 'overwrite' | 'manual'
  ) => {
    if (!parseResult || !validationResult) return;

    setIsExecuting(true);

    try {
      const response = await fetch('/api/import/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: parseResult.fileName,
          validRows: validationResult.validRows,
          duplicateRows:
            duplicateAction === 'overwrite'
              ? validationResult.duplicateRows
              : [],
          duplicateAction,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        toast.error(result.error || '가져오기 실행 중 오류가 발생했습니다.');
        return;
      }

      setExecutionResult(result.data);
      setStep('result');
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(`가져오기 실패: ${error.message}`);
      } else {
        toast.error('가져오기 실행 중 오류가 발생했습니다.');
      }
    } finally {
      setIsExecuting(false);
    }
  };

  // Reset everything
  const handleNewImport = () => {
    setStep('upload');
    setParseResult(null);

    setValidationResult(null);
    setExecutionResult(null);
    setIsValidating(false);
    setIsExecuting(false);
  };

  const handleReset = () => {
    setStep('upload');
    setParseResult(null);

    setValidationResult(null);
    setExecutionResult(null);
  };

  const handleGoToStudents = () => {
    router.push('/students');
  };

  const currentStepIndex = getStepIndex(step);

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
          isCompleted={currentStepIndex > 0}
        />
        <div className="h-px w-8 bg-gray-300" />
        <StepBadge
          number={2}
          label="컬럼 매핑"
          icon={<Columns3 className="h-4 w-4" />}
          isActive={step === 'mapping'}
          isCompleted={currentStepIndex > 1}
        />
        <div className="h-px w-8 bg-gray-300" />
        <StepBadge
          number={3}
          label="데이터 검증"
          icon={<CheckCircle className="h-4 w-4" />}
          isActive={step === 'validation'}
          isCompleted={currentStepIndex > 2}
        />
        <div className="h-px w-8 bg-gray-300" />
        <StepBadge
          number={4}
          label="완료"
          icon={<FileCheck className="h-4 w-4" />}
          isActive={step === 'result'}
          isCompleted={false}
        />
      </div>

      {/* File info summary when in mapping or validation step */}
      {(step === 'mapping' || step === 'validation') && parseResult && (
        <div className="rounded-md bg-indigo-50 px-4 py-3 text-sm text-indigo-800 border border-indigo-200">
          <span className="font-medium">{parseResult.fileName}</span>
          {' '}&mdash; {parseResult.totalRows.toLocaleString()}건
        </div>
      )}

      {/* Step content */}
      {step === 'upload' && <FileUpload onParsed={handleParsed} />}

      {step === 'mapping' && parseResult && (
        <div className="relative">
          {isValidating && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-lg bg-white/80 backdrop-blur-sm">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <p className="mt-3 text-sm font-medium text-indigo-600">
                데이터 검증 중...
              </p>
            </div>
          )}
          <ColumnMapping
            headers={parseResult.headers}
            preview={parseResult.preview}
            onConfirm={handleConfirm}
            onReset={handleReset}
          />
        </div>
      )}

      {step === 'validation' && validationResult && parseResult && (
        <ImportValidation
          validationResult={validationResult}
          fileName={parseResult.fileName}
          onExecute={handleExecute}
          onBack={() => setStep('mapping')}
          isExecuting={isExecuting}
        />
      )}

      {step === 'result' && executionResult && parseResult && (
        <ImportResult
          result={executionResult}
          fileName={parseResult.fileName}
          onGoToStudents={handleGoToStudents}
          onNewImport={handleNewImport}
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

const StepBadge = ({
  number,
  label,
  icon,
  isActive,
  isCompleted,
}: StepBadgeProps) => {
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
