'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Bell,
  AlertTriangle,
  Clock,
  FileWarning,
  Shield,
  Heart,
  FileText,
  Check,
  MessageCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useShallow } from 'zustand/react/shallow';
import { useAlertStore } from '@/store/alert-store';
import { ALERT_TYPE_LABELS } from '@/lib/constants';

// Map alert type to icon component
const ALERT_TYPE_ICONS: Record<string, typeof Clock> = {
  VISA_EXPIRY: Clock,
  FIMS_DEADLINE: FileWarning,
  ATTENDANCE_LOW: AlertTriangle,
  IEQAS_WARNING: Shield,
  INSURANCE_EXPIRY: Heart,
  DOCUMENT_REQUEST: FileText,
  CHAT_ESCALATION: MessageCircle,
};

// Map alert type to badge color classes
const ALERT_TYPE_BADGE_COLORS: Record<string, string> = {
  VISA_EXPIRY: 'bg-red-100 text-red-700',
  FIMS_DEADLINE: 'bg-red-100 text-red-700',
  ATTENDANCE_LOW: 'bg-amber-100 text-amber-700',
  IEQAS_WARNING: 'bg-amber-100 text-amber-700',
  INSURANCE_EXPIRY: 'bg-pink-100 text-pink-700',
  DOCUMENT_REQUEST: 'bg-blue-100 text-blue-700',
  CHAT_ESCALATION: 'bg-purple-100 text-purple-700',
};

export const NotificationPanel = () => {
  const router = useRouter();
  const {
    unreadCount,
    alerts,
    isLoading,
    isPanelOpen,
    setIsPanelOpen,
    fetchUnreadCount,
    fetchRecentAlerts,
    markAsRead,
    markAllAsRead,
    startPolling,
  } = useAlertStore(useShallow((s) => ({
    unreadCount: s.unreadCount,
    alerts: s.alerts,
    isLoading: s.isLoading,
    isPanelOpen: s.isPanelOpen,
    setIsPanelOpen: s.setIsPanelOpen,
    fetchUnreadCount: s.fetchUnreadCount,
    fetchRecentAlerts: s.fetchRecentAlerts,
    markAsRead: s.markAsRead,
    markAllAsRead: s.markAllAsRead,
    startPolling: s.startPolling,
  })));

  useEffect(() => {
    void fetchUnreadCount();
    void fetchRecentAlerts();
    const cleanup = startPolling();
    return cleanup;
  }, [fetchUnreadCount, fetchRecentAlerts, startPolling]);

  const handleAlertClick = useCallback((alertId: string, studentId: string | null) => {
    void markAsRead(alertId);
    if (studentId) {
      router.push(`/students/${studentId}`);
    }
  }, [markAsRead, router]);

  const displayCount = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <Popover open={isPanelOpen} onOpenChange={setIsPanelOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-gray-500" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full p-0 flex items-center justify-center text-[10px] bg-red-500 text-white border-2 border-white">
              {displayCount}
            </Badge>
          )}
          <span className="sr-only">알림</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[380px] p-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-900">알림</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs text-brand-600 hover:text-brand-700"
              onClick={() => void markAllAsRead()}
            >
              <Check className="mr-1 h-3 w-3" />
              모두 읽음
            </Button>
          )}
        </div>

        {/* Alert list */}
        <div className="max-h-[400px] overflow-y-auto">
          {isLoading && (
            <div className="space-y-1 p-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3 p-3">
                  <Skeleton className="h-5 w-5 mt-0.5 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24 rounded" />
                    <Skeleton className="h-3 w-full rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && alerts.length === 0 && (
            <div className="flex items-center justify-center py-12 text-sm text-gray-400">
              새로운 알림이 없습니다.
            </div>
          )}

          {!isLoading &&
            alerts.map((alert) => {
              const IconComponent =
                ALERT_TYPE_ICONS[alert.type] ?? AlertTriangle;
              const badgeColor =
                ALERT_TYPE_BADGE_COLORS[alert.type] ?? 'bg-gray-100 text-gray-700';
              const label = ALERT_TYPE_LABELS[alert.type] ?? alert.type;
              const timeAgo = formatDistanceToNow(new Date(alert.sentAt), {
                addSuffix: true,
                locale: ko,
              });
              const studentName =
                alert.student?.nameKr || alert.student?.nameEn || null;

              return (
                <button
                  key={alert.id}
                  type="button"
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                    !alert.isRead ? 'bg-brand-50/50' : ''
                  }`}
                  onClick={() => handleAlertClick(alert.id, alert.studentId)}
                >
                  <div className="mt-0.5 shrink-0">
                    <IconComponent className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={`text-[10px] px-1.5 py-0 ${badgeColor}`}
                      >
                        {label}
                      </Badge>
                      <span className="text-[11px] text-gray-400">
                        {timeAgo}
                      </span>
                    </div>
                    <p className="truncate text-sm text-gray-700">
                      {alert.message}
                    </p>
                    {studentName && (
                      <p className="mt-0.5 text-xs text-gray-400">
                        {studentName}
                      </p>
                    )}
                  </div>
                  {!alert.isRead && (
                    <div className="mt-2 shrink-0">
                      <div className="h-2 w-2 rounded-full bg-brand-500" />
                    </div>
                  )}
                </button>
              );
            })}
        </div>

        {/* Footer */}
        <div className="border-t px-4 py-2.5">
          <Link
            href="/alerts"
            className="block text-center text-xs font-medium text-brand-600 hover:text-brand-700"
            onClick={() => setIsPanelOpen(false)}
          >
            모든 알림 보기
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
};
