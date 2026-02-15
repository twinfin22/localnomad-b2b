'use client';

import { useState, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, X, FileSpreadsheet, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ParseResult } from '@/types';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_EXTENSIONS = ['.xlsx', '.xls', '.csv', '.tsv'];

interface FileUploadProps {
  onParsed: (result: ParseResult) => void;
}

// Format file size to human-readable string
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Get file extension in lowercase
const getFileExtension = (fileName: string): string => {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1) return '';
  return fileName.slice(lastDot).toLowerCase();
};

export const FileUpload = ({ onParsed }: FileUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate file before accepting
  const validateFile = useCallback((selectedFile: File): string | null => {
    const ext = getFileExtension(selectedFile.name);
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return '지원하지 않는 파일 형식입니다. (.xlsx, .xls, .csv, .tsv만 가능)';
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      return '파일 크기가 50MB를 초과합니다.';
    }
    return null;
  }, []);

  // Handle file selection (from input or drop)
  const handleFileSelect = useCallback(
    (selectedFile: File) => {
      setError(null);
      const validationError = validateFile(selectedFile);
      if (validationError) {
        setError(validationError);
        setFile(null);
        return;
      }
      setFile(selectedFile);
    },
    [validateFile]
  );

  // Input change handler
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        handleFileSelect(selectedFile);
      }
    },
    [handleFileSelect]
  );

  // Drag-and-drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const droppedFile = e.dataTransfer.files?.[0];
      if (droppedFile) {
        handleFileSelect(droppedFile);
      }
    },
    [handleFileSelect]
  );

  // Reset file selection
  const handleRemoveFile = useCallback(() => {
    setFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Upload file to parse API
  const handleUpload = useCallback(async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/import/parse', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || '파일 업로드 중 오류가 발생했습니다.');
        return;
      }

      onParsed(result.data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('파일 업로드 중 오류가 발생했습니다.');
      }
    } finally {
      setIsUploading(false);
    }
  }, [file, onParsed]);

  return (
    <Card>
      <CardContent className="p-6">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv,.tsv"
          onChange={handleInputChange}
          className="hidden"
        />

        {/* Drop zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors',
            isDragOver
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-gray-300 hover:border-gray-400',
            file && 'border-solid border-gray-200 bg-gray-50'
          )}
        >
          {!file ? (
            // Default state: no file selected
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
                <Upload className="h-8 w-8 text-indigo-600" />
              </div>
              <p className="mt-4 text-sm text-gray-600">
                파일을 드래그하여 놓거나
              </p>
              <Button
                variant="outline"
                className="mt-2"
                onClick={() => fileInputRef.current?.click()}
              >
                파일 선택
              </Button>
              <p className="mt-3 text-xs text-gray-400">
                지원 형식: .xlsx, .xls, .csv, .tsv (최대 50MB)
              </p>
            </>
          ) : (
            // File selected state
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                <FileSpreadsheet className="h-8 w-8 text-emerald-600" />
              </div>
              <p className="mt-4 text-sm font-medium text-gray-900">
                {file.name}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {formatFileSize(file.size)} &middot;{' '}
                {getFileExtension(file.name).toUpperCase().replace('.', '')}
              </p>
            </>
          )}
        </div>

        {/* Error display */}
        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        )}

        {/* Action buttons */}
        {file && (
          <div className="mt-4 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleRemoveFile}
              disabled={isUploading}
            >
              <X className="mr-1 h-4 w-4" />
              파일 제거
            </Button>
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  분석 중...
                </>
              ) : (
                <>
                  <Upload className="mr-1 h-4 w-4" />
                  업로드 및 분석
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
