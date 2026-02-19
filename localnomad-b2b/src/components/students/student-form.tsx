'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import {
  VISA_TYPE_LABELS,
  VISA_STATUS_LABELS,
  ENROLLMENT_STATUS_LABELS,
  PROGRAM_TYPE_LABELS,
  INSURANCE_STATUS_LABELS,
} from '@/lib/constants';
import type { StudentFormData, ApiResponse, StudentDetailResponse } from '@/types';

// Initial empty form state
const INITIAL_FORM_DATA: StudentFormData = {
  nameEn: '',
  nameKr: '',
  nationality: '',
  visaType: '',
  visaExpiry: '',
  visaStatus: 'ACTIVE',
  enrollmentStatus: 'ENROLLED',
  programType: '',
  department: '',
  semester: '',
  attendanceRate: '',
  gpa: '',
  passportNumber: '',
  passportExpiry: '',
  arcNumber: '',
  insuranceStatus: 'NONE',
  insuranceExpiry: '',
  phone: '',
  email: '',
  kakaoId: '',
  emergencyContact: '',
  address: '',
  addressReported: false,
  addressChangeDate: '',
  partTimePermit: false,
  partTimePermitExpiry: '',
  notes: '',
};

// Required field keys matching the API validation
const REQUIRED_FIELDS: (keyof StudentFormData)[] = [
  'nameEn',
  'nationality',
  'visaType',
  'visaExpiry',
  'enrollmentStatus',
  'programType',
  'department',
];

// Korean labels for required field validation messages
const FIELD_LABELS: Record<string, string> = {
  nameEn: '영문 이름',
  nationality: '국적',
  visaType: '비자 유형',
  visaExpiry: '비자 만료일',
  enrollmentStatus: '학적 상태',
  programType: '과정 구분',
  department: '소속 학과',
};

interface StudentFormProps {
  mode: 'create' | 'edit';
  studentId?: string;
}

export function StudentForm({ mode, studentId }: StudentFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<StudentFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<Partial<Record<keyof StudentFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(mode === 'edit');

  // Edit mode: fetch existing student data on mount
  useEffect(() => {
    if (mode !== 'edit' || !studentId) return;

    const fetchStudent = async () => {
      try {
        const res = await fetch(`/api/students/${studentId}`);
        const json: ApiResponse<StudentDetailResponse> = await res.json();

        if (!json.success || !json.data) {
          toast.error(json.error || '학생 정보를 불러올 수 없습니다.');
          router.push('/students');
          return;
        }

        const s = json.data;
        setFormData({
          nameEn: s.nameEn,
          nameKr: s.nameKr ?? '',
          nationality: s.nationality,
          visaType: s.visaType,
          visaExpiry: s.visaExpiry ? s.visaExpiry.slice(0, 10) : '',
          visaStatus: s.visaStatus,
          enrollmentStatus: s.enrollmentStatus,
          programType: s.programType,
          department: s.department,
          semester: s.semester ?? '',
          attendanceRate: s.attendanceRate != null ? String(s.attendanceRate) : '',
          gpa: s.gpa != null ? String(s.gpa) : '',
          passportNumber: s.passportNumber ?? '',
          passportExpiry: s.passportExpiry ? s.passportExpiry.slice(0, 10) : '',
          arcNumber: s.arcNumber ?? '',
          insuranceStatus: s.insuranceStatus,
          insuranceExpiry: s.insuranceExpiry ? s.insuranceExpiry.slice(0, 10) : '',
          phone: s.phone ?? '',
          email: s.email ?? '',
          kakaoId: s.kakaoId ?? '',
          emergencyContact: s.emergencyContact ?? '',
          address: s.address ?? '',
          addressReported: s.addressReported,
          addressChangeDate: s.addressChangeDate ? s.addressChangeDate.slice(0, 10) : '',
          partTimePermit: s.partTimePermit,
          partTimePermitExpiry: s.partTimePermitExpiry ? s.partTimePermitExpiry.slice(0, 10) : '',
          notes: s.notes ?? '',
        });
      } catch {
        toast.error('학생 정보를 불러오는 중 오류가 발생했습니다.');
        router.push('/students');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudent();
  }, [mode, studentId, router]);

  // Update a text/date field
  const handleChange = (field: keyof StudentFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error on change
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Update a boolean field (checkbox)
  const handleCheckbox = (field: keyof StudentFormData, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [field]: checked }));
  };

  // Validate required fields
  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof StudentFormData, string>> = {};

    for (const field of REQUIRED_FIELDS) {
      const value = formData[field];
      if (value === '' || value === null || value === undefined) {
        const label = FIELD_LABELS[field] || field;
        newErrors[field] = `${label}은(는) 필수 항목입니다.`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Build the request body, converting numeric strings to numbers
  const buildRequestBody = () => {
    const body: Record<string, unknown> = { ...formData };

    // Convert numeric fields
    if (formData.attendanceRate !== '') {
      body.attendanceRate = parseFloat(formData.attendanceRate);
    } else {
      body.attendanceRate = null;
    }

    if (formData.gpa !== '') {
      body.gpa = parseFloat(formData.gpa);
    } else {
      body.gpa = null;
    }

    // Convert empty strings to null for optional fields
    const optionalStringFields: (keyof StudentFormData)[] = [
      'nameKr',
      'passportNumber',
      'passportExpiry',
      'arcNumber',
      'insuranceExpiry',
      'phone',
      'email',
      'kakaoId',
      'emergencyContact',
      'address',
      'addressChangeDate',
      'partTimePermitExpiry',
      'notes',
      'semester',
    ];

    for (const field of optionalStringFields) {
      if (body[field] === '') {
        body[field] = null;
      }
    }

    return body;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const body = buildRequestBody();
      const url =
        mode === 'create' ? '/api/students' : `/api/students/${studentId}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const json: ApiResponse<unknown> = await res.json();

      if (!json.success) {
        toast.error(json.error || '저장에 실패했습니다.');
        return;
      }

      toast.success(
        mode === 'create'
          ? '학생이 등록되었습니다.'
          : '학생 정보가 수정되었습니다.'
      );
      router.push('/students');
    } catch {
      toast.error('서버 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="size-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/students')}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="text-2xl font-bold">
          {mode === 'create' ? '새 학생 등록' : '학생 정보 수정'}
        </h1>
      </div>

      {/* Section 1: 기본 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="영문 이름"
              required
              error={errors.nameEn}
            >
              <Input
                value={formData.nameEn}
                onChange={(e) => handleChange('nameEn', e.target.value)}
                placeholder="예: HONG GILDONG"
              />
            </FormField>

            <FormField label="한글 이름">
              <Input
                value={formData.nameKr}
                onChange={(e) => handleChange('nameKr', e.target.value)}
                placeholder="예: 홍길동"
              />
            </FormField>

            <FormField
              label="국적"
              required
              error={errors.nationality}
            >
              <Input
                value={formData.nationality}
                onChange={(e) => handleChange('nationality', e.target.value)}
                placeholder="예: 베트남"
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: 비자 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>비자 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="비자 유형"
              required
              error={errors.visaType}
            >
              <Select
                value={formData.visaType}
                onValueChange={(v) => handleChange('visaType', v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="선택..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(VISA_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField
              label="비자 만료일"
              required
              error={errors.visaExpiry}
            >
              <Input
                type="date"
                value={formData.visaExpiry}
                onChange={(e) => handleChange('visaExpiry', e.target.value)}
              />
            </FormField>

            <FormField label="비자 상태">
              <Select
                value={formData.visaStatus}
                onValueChange={(v) => handleChange('visaStatus', v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="선택..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(VISA_STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: 학적 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>학적 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="학적 상태"
              required
              error={errors.enrollmentStatus}
            >
              <Select
                value={formData.enrollmentStatus}
                onValueChange={(v) => handleChange('enrollmentStatus', v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="선택..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ENROLLMENT_STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField
              label="과정 구분"
              required
              error={errors.programType}
            >
              <Select
                value={formData.programType}
                onValueChange={(v) => handleChange('programType', v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="선택..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PROGRAM_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField
              label="소속 학과"
              required
              error={errors.department}
            >
              <Input
                value={formData.department}
                onChange={(e) => handleChange('department', e.target.value)}
                placeholder="예: 컴퓨터공학과"
              />
            </FormField>

            <FormField label="학기">
              <Input
                value={formData.semester}
                onChange={(e) => handleChange('semester', e.target.value)}
                placeholder="예: 2024-1"
              />
            </FormField>

            <FormField label="출석률 (%)">
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.attendanceRate}
                onChange={(e) => handleChange('attendanceRate', e.target.value)}
                placeholder="예: 95.50"
              />
            </FormField>

            <FormField label="평균 학점">
              <Input
                type="number"
                step="0.01"
                min="0"
                max="4.5"
                value={formData.gpa}
                onChange={(e) => handleChange('gpa', e.target.value)}
                placeholder="예: 3.50"
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* Section 4: 개인정보 */}
      <Card>
        <CardHeader>
          <CardTitle>개인정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="여권번호">
              <Input
                value={formData.passportNumber}
                onChange={(e) => handleChange('passportNumber', e.target.value)}
                placeholder="예: M12345678"
              />
            </FormField>

            <FormField label="여권 만료일">
              <Input
                type="date"
                value={formData.passportExpiry}
                onChange={(e) => handleChange('passportExpiry', e.target.value)}
              />
            </FormField>

            <FormField label="외국인등록번호">
              <Input
                value={formData.arcNumber}
                onChange={(e) => handleChange('arcNumber', e.target.value)}
                placeholder="예: 123456-1234567"
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* Section 5: 보험 */}
      <Card>
        <CardHeader>
          <CardTitle>보험</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="보험 상태">
              <Select
                value={formData.insuranceStatus}
                onValueChange={(v) => handleChange('insuranceStatus', v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="선택..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(INSURANCE_STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="보험 만료일">
              <Input
                type="date"
                value={formData.insuranceExpiry}
                onChange={(e) => handleChange('insuranceExpiry', e.target.value)}
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* Section 6: 연락처 */}
      <Card>
        <CardHeader>
          <CardTitle>연락처</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="전화번호">
              <Input
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="예: 010-1234-5678"
              />
            </FormField>

            <FormField label="이메일">
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="예: student@example.com"
              />
            </FormField>

            <FormField label="카카오톡 ID">
              <Input
                value={formData.kakaoId}
                onChange={(e) => handleChange('kakaoId', e.target.value)}
                placeholder="예: kakao_id"
              />
            </FormField>

            <FormField label="비상 연락처">
              <Input
                value={formData.emergencyContact}
                onChange={(e) => handleChange('emergencyContact', e.target.value)}
                placeholder="예: 부모 연락처"
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* Section 7: 체류지 */}
      <Card>
        <CardHeader>
          <CardTitle>체류지</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="체류지 주소">
              <Input
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="예: 서울시 강남구..."
              />
            </FormField>

            <FormField label="체류지 변경 신고일">
              <Input
                type="date"
                value={formData.addressChangeDate}
                onChange={(e) => handleChange('addressChangeDate', e.target.value)}
              />
            </FormField>

            <div className="flex items-center gap-2 pt-6">
              <input
                id="addressReported"
                type="checkbox"
                checked={formData.addressReported}
                onChange={(e) => handleCheckbox('addressReported', e.target.checked)}
                className="size-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <Label htmlFor="addressReported">체류지 신고 완료</Label>
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                id="partTimePermit"
                type="checkbox"
                checked={formData.partTimePermit}
                onChange={(e) => handleCheckbox('partTimePermit', e.target.checked)}
                className="size-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <Label htmlFor="partTimePermit">시간제 취업 허가</Label>
            </div>

            <FormField label="시간제 취업 허가 만료일">
              <Input
                type="date"
                value={formData.partTimePermitExpiry}
                onChange={(e) => handleChange('partTimePermitExpiry', e.target.value)}
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* Section 8: 메모 */}
      <Card>
        <CardHeader>
          <CardTitle>메모</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="학생 관련 메모를 입력하세요..."
            rows={4}
            className="w-full"
          />
        </CardContent>
      </Card>

      {/* Footer: action buttons */}
      <div className="flex items-center justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => router.push('/students')}
          disabled={isSubmitting}
        >
          취소
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-brand-600 hover:bg-brand-700 text-white"
        >
          {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
          저장
        </Button>
      </div>
    </div>
  );
}

// Reusable form field wrapper with label, required indicator, and error message
function FormField({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {children}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
