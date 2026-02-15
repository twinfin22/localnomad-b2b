'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { ArrowLeft, Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TrafficLight } from '@/components/students/traffic-light';
import { StudentTimeline } from '@/components/students/student-timeline';
import { DeleteStudentDialog } from '@/components/students/delete-student-dialog';
import {
  ENROLLMENT_STATUS_LABELS,
  VISA_STATUS_LABELS,
  VISA_TYPE_LABELS,
  INSURANCE_STATUS_LABELS,
  PROGRAM_TYPE_LABELS,
  TRAFFIC_LIGHT_LABELS,
} from '@/lib/constants';
import type { StudentDetailResponse, TrafficLightStatus } from '@/types';

interface StudentDetailProps {
  studentId: string;
}

// Traffic light badge color
const TL_BADGE_CLASS: Record<TrafficLightStatus, string> = {
  GREEN: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  YELLOW: 'bg-amber-100 text-amber-700 border-amber-200',
  RED: 'bg-red-100 text-red-700 border-red-200',
};

// Format date for display, handle null
const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '-';
  try {
    return format(new Date(dateStr), 'yyyy-MM-dd');
  } catch {
    return '-';
  }
};

// Info row helper
const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between py-2 border-b border-border/50 last:border-0">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-medium text-foreground text-right">
      {value ?? '-'}
    </span>
  </div>
);

export function StudentDetail({ studentId }: StudentDetailProps) {
  const { data: session } = useSession();
  const [student, setStudent] = useState<StudentDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [piiRevealed, setPiiRevealed] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const userRole = session?.user?.role;
  const canEdit = userRole === 'ADMIN' || userRole === 'MANAGER';
  const canDelete = userRole === 'ADMIN';

  const fetchStudent = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/students/${studentId}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || '학생 정보를 불러올 수 없습니다.');
      }

      setStudent(data.data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : '학생 정보를 불러올 수 없습니다.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchStudent();
  }, [fetchStudent]);

  if (loading) {
    return <DetailSkeleton />;
  }

  if (error || !student) {
    return (
      <div className="space-y-4">
        <Link
          href="/students"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          목록으로
        </Link>
        <Card>
          <CardContent className="flex items-center justify-center h-48">
            <p className="text-sm text-destructive">
              {error || '학생 정보를 불러올 수 없습니다.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayName = student.nameKr || student.nameEn;

  // Mask PII values on client side (default masked)
  const maskValue = (value: string | null): string => {
    if (!value) return '-';
    if (piiRevealed) return value;
    if (value.length <= 2) return '****';
    return value.slice(0, 2) + '****';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/students"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            목록으로
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
            <TrafficLight status={student.trafficLight} size="lg" />
            <Badge
              variant="outline"
              className={TL_BADGE_CLASS[student.trafficLight]}
            >
              {TRAFFIC_LIGHT_LABELS[student.trafficLight]}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/students/${studentId}/edit`}>
                <Pencil className="size-4" />
                수정
              </Link>
            </Button>
          )}
          {canDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="size-4" />
              삭제
            </Button>
          )}
        </div>
      </div>

      {/* 3-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: 2 columns of info cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* 기본 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <InfoRow label="영문 이름" value={student.nameEn} />
                <InfoRow label="한글 이름" value={student.nameKr} />
                <InfoRow label="국적" value={student.nationality} />
                <InfoRow
                  label="등록자"
                  value={student.createdByName}
                />
                <InfoRow
                  label="등록일"
                  value={formatDate(student.createdAt)}
                />
                <InfoRow
                  label="수정일"
                  value={formatDate(student.updatedAt)}
                />
              </div>
            </CardContent>
          </Card>

          {/* 비자 정보 + Traffic Light reasons */}
          <Card>
            <CardHeader>
              <CardTitle>비자 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <InfoRow
                  label="비자 유형"
                  value={VISA_TYPE_LABELS[student.visaType] || student.visaType}
                />
                <InfoRow
                  label="비자 상태"
                  value={VISA_STATUS_LABELS[student.visaStatus] || student.visaStatus}
                />
                <InfoRow
                  label="체류 만료일"
                  value={formatDate(student.visaExpiry)}
                />
                <InfoRow
                  label="시간제취업 허가"
                  value={student.partTimePermit ? '있음' : '없음'}
                />
                {student.partTimePermit && (
                  <InfoRow
                    label="허가 만료일"
                    value={formatDate(student.partTimePermitExpiry)}
                  />
                )}
              </div>
              {/* Traffic light reasons */}
              {student.trafficLightReasons.length > 0 &&
                student.trafficLight !== 'GREEN' && (
                  <div className="mt-4 p-3 rounded-lg bg-muted/50">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      상태 사유
                    </p>
                    <ul className="space-y-1">
                      {student.trafficLightReasons.map((reason, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-foreground flex items-center gap-2"
                        >
                          <span
                            className={`size-1.5 rounded-full shrink-0 ${
                              student.trafficLight === 'RED'
                                ? 'bg-red-500'
                                : 'bg-amber-500'
                            }`}
                          />
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </CardContent>
          </Card>

          {/* 학적 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>학적 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <InfoRow
                  label="학적 상태"
                  value={
                    ENROLLMENT_STATUS_LABELS[student.enrollmentStatus] ||
                    student.enrollmentStatus
                  }
                />
                <InfoRow
                  label="과정 유형"
                  value={
                    PROGRAM_TYPE_LABELS[student.programType] ||
                    student.programType
                  }
                />
                <InfoRow label="소속 학과" value={student.department} />
                <InfoRow label="학기" value={student.semester} />
                <InfoRow
                  label="출석률"
                  value={
                    student.attendanceRate !== null
                      ? `${student.attendanceRate}%`
                      : null
                  }
                />
                <InfoRow
                  label="평균 학점"
                  value={student.gpa !== null ? `${student.gpa}` : null}
                />
              </div>
            </CardContent>
          </Card>

          {/* 보험 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>보험 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <InfoRow
                  label="보험 상태"
                  value={
                    INSURANCE_STATUS_LABELS[student.insuranceStatus] ||
                    student.insuranceStatus
                  }
                />
                <InfoRow
                  label="보험 만료일"
                  value={formatDate(student.insuranceExpiry)}
                />
              </div>
            </CardContent>
          </Card>

          {/* 연락처 */}
          <Card>
            <CardHeader>
              <CardTitle>연락처</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <InfoRow label="전화번호" value={student.phone} />
                <InfoRow label="이메일" value={student.email} />
                <InfoRow label="카카오톡 ID" value={student.kakaoId} />
                <InfoRow label="비상 연락처" value={student.emergencyContact} />
              </div>
            </CardContent>
          </Card>

          {/* 체류지 */}
          <Card>
            <CardHeader>
              <CardTitle>체류지</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <InfoRow label="주소" value={student.address} />
                <InfoRow
                  label="체류지 신고"
                  value={student.addressReported ? '완료' : '미신고'}
                />
                <InfoRow
                  label="주소 변경일"
                  value={formatDate(student.addressChangeDate)}
                />
              </div>
            </CardContent>
          </Card>

          {/* 개인정보 (PII) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>개인정보</span>
                {student.canReadPii && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPiiRevealed((prev) => !prev)}
                  >
                    {piiRevealed ? (
                      <>
                        <EyeOff className="size-4" />
                        숨기기
                      </>
                    ) : (
                      <>
                        <Eye className="size-4" />
                        보기
                      </>
                    )}
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <InfoRow
                  label="여권번호"
                  value={maskValue(student.passportNumber)}
                />
                <InfoRow
                  label="여권 만료일"
                  value={formatDate(student.passportExpiry)}
                />
                <InfoRow
                  label="외국인등록번호"
                  value={maskValue(student.arcNumber)}
                />
              </div>
            </CardContent>
          </Card>

          {/* 메모 */}
          {student.notes && (
            <Card>
              <CardHeader>
                <CardTitle>메모</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {student.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Timeline */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>활동 기록</CardTitle>
            </CardHeader>
            <CardContent>
              <StudentTimeline timeline={student.timeline} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete dialog */}
      <DeleteStudentDialog
        studentId={studentId}
        studentName={displayName}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
    </div>
  );
}

// Skeleton loading state
function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-6 w-12" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-24" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="flex justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-20" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-3 w-3 rounded-full shrink-0" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
