'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Clock,
  FileWarning,
  Shield,
  Heart,
  FileText,
  Bell,
  ChevronLeft,
  ChevronRight,
  Zap,
  CheckCheck,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
import { Skeleton } from '@/components/ui/skeleton';
import { ALERT_TYPE_LABELS } from '@/lib/constants';
import { useAlertStore } from '@/store/alert-store';

// Alert type from API response
interface AlertData {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  sentAt: string;
  studentId: string | null;
  student: { nameKr: string | null; nameEn: string } | null;
}

interface AlertMeta {
  total: number;
  page: number;
  limit: number;
}

// Map alert type to icon component
const ALERT_TYPE_ICONS: Record<string, typeof Clock> = {
  VISA_EXPIRY: Clock,
  FIMS_DEADLINE: FileWarning,
  ATTENDANCE_LOW: AlertTriangle,
  IEQAS_WARNING: Shield,
  INSURANCE_EXPIRY: Heart,
  DOCUMENT_REQUEST: FileText,
};

// Map alert type to badge color classes
const ALERT_TYPE_BADGE_COLORS: Record<string, string> = {
  VISA_EXPIRY: 'bg-red-100 text-red-700',
  FIMS_DEADLINE: 'bg-red-100 text-red-700',
  ATTENDANCE_LOW: 'bg-amber-100 text-amber-700',
  IEQAS_WARNING: 'bg-amber-100 text-amber-700',
  INSURANCE_EXPIRY: 'bg-pink-100 text-pink-700',
  DOCUMENT_REQUEST: 'bg-blue-100 text-blue-700',
};

const PAGE_LIMIT = 20;

// Skeleton loader for table rows
const TableSkeleton = () => (
  <>
    {Array.from({ length: 5 }).map((_, i) => (
      <TableRow key={i}>
        <TableCell>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </TableCell>
        <TableCell>
          <div className="space-y-1">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-64" />
          </div>
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-24" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-20" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-5 w-16 rounded-full" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-8 w-20 rounded" />
        </TableCell>
      </TableRow>
    ))}
  </>
);

export default function AlertsPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [meta, setMeta] = useState<AlertMeta>({ total: 0, page: 1, limit: PAGE_LIMIT });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

  const { unreadCount, fetchUnreadCount, markAsRead, markAllAsRead } =
    useAlertStore();

  const fetchAlerts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(PAGE_LIMIT));

      if (activeTab === 'unread') {
        params.set('isRead', 'false');
      }

      if (typeFilter !== 'ALL') {
        params.set('type', typeFilter);
      }

      const response = await fetch(`/api/alerts?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const json = await response.json();
      if (!json.success) {
        throw new Error(json.error || '알림 목록 조회에 실패했습니다.');
      }

      setAlerts(json.data ?? []);
      setMeta(json.meta ?? { total: 0, page: 1, limit: PAGE_LIMIT });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : '알림을 불러오는 중 오류가 발생했습니다.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [page, activeTab, typeFilter]);

  useEffect(() => {
    void fetchAlerts();
    void fetchUnreadCount();
  }, [fetchAlerts, fetchUnreadCount]);

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'all' | 'unread');
    setPage(1);
  };

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value);
    setPage(1);
  };

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isRead: true } : a)),
    );
    void fetchUnreadCount();
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
    void fetchUnreadCount();
  };

  const handleRowClick = (alert: AlertData) => {
    if (!alert.isRead) {
      void handleMarkAsRead(alert.id);
    }
    if (alert.studentId) {
      router.push(`/students/${alert.studentId}`);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/alerts/generate', { method: 'POST' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const json = await response.json();
      if (!json.success) {
        throw new Error(json.error || '알림 생성에 실패했습니다.');
      }
      toast.success(
        `알림 ${json.data.generated}건 생성 완료 (${json.data.skipped}건 스킵)`,
      );
      void fetchAlerts();
      void fetchUnreadCount();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : '알림 생성에 실패했습니다.';
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(meta.total / PAGE_LIMIT));

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">알림</h1>
          <p className="mt-1 text-sm text-gray-500">
            비자 만료, 출석률 저조, FIMS 기한 등 주요 알림을 확인합니다.
          </p>
        </div>
        <Button
          onClick={() => void handleGenerate()}
          disabled={isGenerating}
          className="bg-brand-600 hover:bg-brand-700"
        >
          <Zap className="mr-2 h-4 w-4" />
          {isGenerating ? '생성 중...' : '알림 생성'}
        </Button>
      </div>

      {/* Tabs + Filter */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="flex items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="all">전체</TabsTrigger>
            <TabsTrigger value="unread">
              읽지 않음
              {unreadCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1.5 bg-red-100 text-red-700 text-[10px] px-1.5 py-0"
                >
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            {activeTab === 'unread' && alerts.some((a) => !a.isRead) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleMarkAllAsRead()}
              >
                <CheckCheck className="mr-1.5 h-4 w-4" />
                모두 읽음 처리
              </Button>
            )}
            <Select value={typeFilter} onValueChange={handleTypeFilterChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="유형 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체 유형</SelectItem>
                {Object.entries(ALERT_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* All tab */}
        <TabsContent value="all" className="mt-4">
          <AlertTable
            alerts={alerts}
            isLoading={isLoading}
            error={error}
            onRowClick={handleRowClick}
            onMarkAsRead={handleMarkAsRead}
          />
        </TabsContent>

        {/* Unread tab */}
        <TabsContent value="unread" className="mt-4">
          <AlertTable
            alerts={alerts}
            isLoading={isLoading}
            error={error}
            onRowClick={handleRowClick}
            onMarkAsRead={handleMarkAsRead}
          />
        </TabsContent>
      </Tabs>

      {/* Pagination */}
      {!isLoading && !error && meta.total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            총 {meta.total}건 중 {(page - 1) * PAGE_LIMIT + 1}~
            {Math.min(page * PAGE_LIMIT, meta.total)}건
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              이전
            </Button>
            <span className="text-sm text-gray-600">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              다음
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Extracted table component for reuse between tabs
interface AlertTableProps {
  alerts: AlertData[];
  isLoading: boolean;
  error: string | null;
  onRowClick: (alert: AlertData) => void;
  onMarkAsRead: (id: string) => Promise<void>;
}

const AlertTable = ({
  alerts,
  isLoading,
  error,
  onRowClick,
  onMarkAsRead,
}: AlertTableProps) => {
  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-red-500">
            <AlertTriangle className="mb-2 h-8 w-8" />
            <p className="text-sm">알림을 불러오는 데 실패했습니다.</p>
            <p className="mt-1 text-xs text-gray-400">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[140px]">유형</TableHead>
              <TableHead>내용</TableHead>
              <TableHead className="w-[120px]">대상 학생</TableHead>
              <TableHead className="w-[140px]">발송일</TableHead>
              <TableHead className="w-[80px]">상태</TableHead>
              <TableHead className="w-[100px]">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableSkeleton />}

            {!isLoading && alerts.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <Bell className="mb-2 h-8 w-8" />
                    <p className="text-sm">알림이 없습니다.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              alerts.map((alert) => {
                const IconComponent =
                  ALERT_TYPE_ICONS[alert.type] ?? AlertTriangle;
                const badgeColor =
                  ALERT_TYPE_BADGE_COLORS[alert.type] ??
                  'bg-gray-100 text-gray-700';
                const label = ALERT_TYPE_LABELS[alert.type] ?? alert.type;
                const timeAgo = formatDistanceToNow(new Date(alert.sentAt), {
                  addSuffix: true,
                  locale: ko,
                });
                const absoluteDate = format(
                  new Date(alert.sentAt),
                  'yyyy.MM.dd HH:mm',
                );
                const studentName =
                  alert.student?.nameKr || alert.student?.nameEn || '-';

                return (
                  <TableRow
                    key={alert.id}
                    className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                      !alert.isRead ? 'bg-brand-50/40' : ''
                    }`}
                    onClick={() => onRowClick(alert)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4 text-gray-400" />
                        <Badge
                          variant="secondary"
                          className={`text-[11px] ${badgeColor}`}
                        >
                          {label}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium text-gray-900">
                        {alert.title}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">
                        {alert.message}
                      </p>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-700">
                        {studentName}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm text-gray-700">{timeAgo}</p>
                        <p className="text-[11px] text-gray-400">
                          {absoluteDate}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {alert.isRead ? (
                        <Badge
                          variant="secondary"
                          className="bg-gray-100 text-gray-500"
                        >
                          읽음
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-amber-100 text-amber-700"
                        >
                          미확인
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {!alert.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-brand-600 hover:text-brand-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            void onMarkAsRead(alert.id);
                          }}
                        >
                          읽음 처리
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
