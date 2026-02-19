'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  autoMapColumns,
  SYSTEM_FIELD_LABELS,
  AVAILABLE_TARGET_FIELDS,
  getConfidenceLevel,
} from '@/lib/column-mapper';
import { ArrowRight, AlertTriangle, RotateCcw, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ColumnMapping as ColumnMappingType } from '@/types';

// Required fields that must be mapped
const REQUIRED_FIELDS = ['nameEn', 'visaType', 'visaExpiry', 'department', 'enrollmentStatus', 'programType'];

interface ColumnMappingProps {
  headers: string[];
  preview: string[][];
  onConfirm: (mappings: ColumnMappingType[]) => void;
  onReset: () => void;
}

const UNMAPPED_VALUE = '__unmapped__';

export const ColumnMapping = ({
  headers,
  preview,
  onConfirm,
  onReset,
}: ColumnMappingProps) => {
  const initialMappings = useMemo(() => autoMapColumns(headers), [headers]);
  const [mappings, setMappings] = useState<ColumnMappingType[]>(initialMappings);

  // Count mapped fields
  const mappedCount = mappings.filter((m) => m.targetField !== null).length;
  const totalCount = mappings.length;

  // Determine which target fields are currently in use
  const usedTargetFields = useMemo(
    () => new Set(mappings.filter((m) => m.targetField).map((m) => m.targetField!)),
    [mappings]
  );

  // Check for unmapped required fields
  const unmappedRequired = useMemo(
    () =>
      REQUIRED_FIELDS.filter(
        (field) => !mappings.some((m) => m.targetField === field)
      ),
    [mappings]
  );

  const hasUnmappedRequired = unmappedRequired.length > 0;

  // Handle select change for a mapping row
  const handleFieldChange = (index: number, value: string) => {
    setMappings((prev) =>
      prev.map((mapping, i) => {
        if (i !== index) return mapping;
        return {
          ...mapping,
          targetField: value === UNMAPPED_VALUE ? null : value,
          confidence: value === UNMAPPED_VALUE ? 0 : 100,
          isManuallySet: true,
        };
      })
    );
  };

  // Reset to initial auto-mapped state
  const handleReset = () => {
    setMappings(autoMapColumns(headers));
    onReset();
  };

  // Render confidence badge
  const renderConfidenceBadge = (mapping: ColumnMappingType) => {
    if (!mapping.targetField) {
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200">
          미매핑
        </Badge>
      );
    }

    const level = getConfidenceLevel(mapping.confidence);

    if (level === 'high') {
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
          높음 {mapping.confidence}%
        </Badge>
      );
    }

    if (level === 'medium') {
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200">
          보통 {mapping.confidence}%
        </Badge>
      );
    }

    return (
      <Badge className="bg-red-100 text-red-700 border-red-200">
        낮음 {mapping.confidence}%
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">컬럼 매핑</CardTitle>
        <p className="text-sm text-gray-500">
          엑셀 컬럼을 시스템 필드에 매핑합니다. 자동 매핑 결과를 확인하고
          필요시 수정하세요.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-brand-600">{mappedCount}</span>
            개 중{' '}
            <span className="font-semibold">{totalCount}</span>개 매핑됨
          </p>
        </div>

        {/* Required fields warning */}
        {hasUnmappedRequired && (
          <div className="flex items-start gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-800 border border-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              필수 필드가 매핑되지 않았습니다:{' '}
              {unmappedRequired
                .map((field) => SYSTEM_FIELD_LABELS[field])
                .join(', ')}
            </span>
          </div>
        )}

        {/* Mapping table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">엑셀 컬럼</TableHead>
                <TableHead className="w-[200px]">미리보기</TableHead>
                <TableHead className="w-[40px] text-center" />
                <TableHead className="w-[220px]">시스템 필드</TableHead>
                <TableHead className="w-[120px]">신뢰도</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappings.map((mapping, index) => (
                <TableRow key={index}>
                  {/* Source column name */}
                  <TableCell className="font-medium">
                    {mapping.sourceColumn}
                  </TableCell>

                  {/* Preview value from first data row */}
                  <TableCell className="text-gray-500 max-w-[200px] truncate">
                    {preview[0]?.[index] ?? '-'}
                  </TableCell>

                  {/* Arrow */}
                  <TableCell className="text-center">
                    <ArrowRight className="h-4 w-4 text-gray-400 mx-auto" />
                  </TableCell>

                  {/* Target field select */}
                  <TableCell>
                    <Select
                      value={mapping.targetField ?? UNMAPPED_VALUE}
                      onValueChange={(value) => handleFieldChange(index, value)}
                    >
                      <SelectTrigger
                        className={cn(
                          'w-full',
                          !mapping.targetField && 'text-gray-400'
                        )}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UNMAPPED_VALUE}>미매핑</SelectItem>
                        {AVAILABLE_TARGET_FIELDS.map((field) => {
                          const isUsedByOther =
                            usedTargetFields.has(field) &&
                            mapping.targetField !== field;
                          return (
                            <SelectItem
                              key={field}
                              value={field}
                              disabled={isUsedByOther}
                            >
                              {SYSTEM_FIELD_LABELS[field]}
                              {REQUIRED_FIELDS.includes(field) ? ' *' : ''}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </TableCell>

                  {/* Confidence badge */}
                  <TableCell>{renderConfidenceBadge(mapping)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="mr-1 h-4 w-4" />
            다시 매핑
          </Button>
          <Button
            onClick={() => onConfirm(mappings)}
            disabled={hasUnmappedRequired}
            className="bg-brand-600 hover:bg-brand-700"
          >
            <Check className="mr-1 h-4 w-4" />
            매핑 확인
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
