'use client';

import { useEffect, useState } from 'react';
import { Users, AlertTriangle, TrendingUp, Bell } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCountUp } from '@/hooks/use-count-up';
import type { LucideIcon } from 'lucide-react';

interface SummaryCardsProps {
  overstayRate?: number;
}

interface DashboardSummaryData {
  totalStudents: number;
  overstayRate: number;
  unreadAlerts: number;
  upcomingVisaExpiries: Array<{ count: number; period: string }>;
}

interface CardItem {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  borderColor: string;
}

// 대시보드 요약 카드 4개 — API에서 실시간 데이터 조회
export function SummaryCards({ overstayRate }: SummaryCardsProps) {
  const [data, setData] = useState<DashboardSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Counter animations — called unconditionally (React hooks rules)
  const totalCount = useCountUp(data?.totalStudents ?? 0);
  const visaCount = useCountUp(
    data?.upcomingVisaExpiries.find((v) => v.period === '30일 이내')?.count ?? 0,
  );
  const alertCount = useCountUp(data?.unreadAlerts ?? 0);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch('/api/dashboard/summary');
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = await res.json();
        if (!json.success) {
          throw new Error(json.error || '데이터를 불러올 수 없습니다.');
        }
        setData(json.data);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : '데이터를 불러올 수 없습니다.';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-7 w-16" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        요약 데이터를 불러오는 중 오류가 발생했습니다: {error}
      </div>
    );
  }

  if (!data) return null;

  const displayRate = overstayRate ?? data.overstayRate;

  const rateDescription =
    displayRate < 1
      ? 'IEQAS 우수 인증 기준 충족'
      : displayRate < 2
        ? 'IEQAS 기본 인증 기준 충족'
        : 'IEQAS 기본 인증 기준 초과';

  const summaryCards: CardItem[] = [
    {
      title: '전체 학생',
      value: totalCount.toLocaleString(),
      description: '등록된 유학생 수',
      icon: Users,
      iconColor: 'text-brand-600',
      iconBg: 'bg-brand-50',
      borderColor: 'border-l-brand-500',
    },
    {
      title: '비자 만료 임박',
      value: String(visaCount),
      description: '30일 이내 만료 예정',
      icon: AlertTriangle,
      iconColor: 'text-warning-600',
      iconBg: 'bg-warning-50',
      borderColor: 'border-l-warning-600',
    },
    {
      title: '불법체류율',
      value:
        displayRate !== undefined && displayRate !== null
          ? `${displayRate.toFixed(1)}%`
          : '\u2014',
      description: rateDescription,
      icon: TrendingUp,
      iconColor:
        displayRate < 1
          ? 'text-success-600'
          : displayRate < 2
            ? 'text-warning-600'
            : 'text-danger-600',
      iconBg:
        displayRate < 1
          ? 'bg-success-50'
          : displayRate < 2
            ? 'bg-warning-50'
            : 'bg-danger-50',
      borderColor:
        displayRate < 1
          ? 'border-l-success-600'
          : displayRate < 2
            ? 'border-l-warning-600'
            : 'border-l-danger-600',
    },
    {
      title: '미확인 알림',
      value: String(alertCount),
      description: '확인이 필요한 알림',
      icon: Bell,
      iconColor: data.unreadAlerts > 0 ? 'text-danger-600' : 'text-gray-400',
      iconBg: data.unreadAlerts > 0 ? 'bg-danger-50' : 'bg-gray-50',
      borderColor:
        data.unreadAlerts > 0 ? 'border-l-danger-600' : 'border-l-gray-300',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {summaryCards.map((item, i) => (
        <Card
          key={item.title}
          className={`border-l-4 ${item.borderColor} animate-fade-up`}
          style={{ animationDelay: `${i * 75}ms` }}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`rounded-lg p-3 ${item.iconBg}`}>
                <item.icon className={`h-6 w-6 ${item.iconColor}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{item.title}</p>
                <p className="text-2xl font-bold tracking-tight text-gray-900">
                  {item.value}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {item.description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
