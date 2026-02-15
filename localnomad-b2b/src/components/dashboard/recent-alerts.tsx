'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Clock, FileWarning, Shield, Heart, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ALERT_TYPE_LABELS } from '@/lib/constants';

// Alert type from API response
interface AlertData {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  sentAt: string;
  student: { nameKr: string | null; nameEn: string } | null;
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

// Skeleton loader for a single alert row
const AlertSkeleton = () => (
  <div className="flex items-start gap-3 p-3">
    <Skeleton className="h-5 w-5 mt-0.5 rounded" />
    <div className="flex-1 space-y-2">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-3 w-12" />
      </div>
      <Skeleton className="h-4 w-full" />
    </div>
  </div>
);

export const RecentAlerts = () => {
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch('/api/alerts?limit=5');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const json = await response.json();
        if (!json.success) {
          throw new Error(json.error || '알림 조회에 실패했습니다.');
        }
        setAlerts(json.data);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : '알림을 불러오는 중 오류가 발생했습니다.';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchAlerts();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>최근 알림</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <>
            <AlertSkeleton />
            <AlertSkeleton />
            <AlertSkeleton />
            <AlertSkeleton />
            <AlertSkeleton />
          </>
        )}

        {!isLoading && error && (
          <div className="flex items-center justify-center py-8 text-sm text-red-500">
            <AlertTriangle className="h-4 w-4 mr-2" />
            알림을 불러오는 데 실패했습니다.
          </div>
        )}

        {!isLoading && !error && alerts.length === 0 && (
          <div className="flex items-center justify-center py-8 text-sm text-gray-400">
            알림이 없습니다.
          </div>
        )}

        {!isLoading &&
          !error &&
          alerts.map((alert) => {
            const IconComponent = ALERT_TYPE_ICONS[alert.type] ?? AlertTriangle;
            const badgeColor =
              ALERT_TYPE_BADGE_COLORS[alert.type] ?? 'bg-gray-100 text-gray-700';
            const label = ALERT_TYPE_LABELS[alert.type] ?? alert.type;
            const timeAgo = formatDistanceToNow(new Date(alert.sentAt), {
              addSuffix: true,
              locale: ko,
            });

            return (
              <div
                key={alert.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="mt-0.5">
                  <IconComponent className="h-5 w-5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className={badgeColor}>
                      {label}
                    </Badge>
                    <span className="text-xs text-gray-400">{timeAgo}</span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{alert.message}</p>
                </div>
              </div>
            );
          })}
      </CardContent>
    </Card>
  );
};
