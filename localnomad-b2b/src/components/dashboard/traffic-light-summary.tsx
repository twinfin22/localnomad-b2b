'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertOctagon, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { LucideIcon } from 'lucide-react';
import type { TrafficLightStatus } from '@/types';

interface TlSummary {
  GREEN: number;
  YELLOW: number;
  RED: number;
  total: number;
}

interface TlCardConfig {
  status: TrafficLightStatus;
  label: string;
  icon: LucideIcon;
  bgColor: string;
  leftBorder: string;
  iconColor: string;
  countColor: string;
}

const TL_CARDS: TlCardConfig[] = [
  {
    status: 'RED',
    label: '긴급',
    icon: AlertOctagon,
    bgColor: 'bg-danger-50',
    leftBorder: 'border-l-danger-600',
    iconColor: 'text-danger-600',
    countColor: 'text-danger-700',
  },
  {
    status: 'YELLOW',
    label: '주의',
    icon: AlertTriangle,
    bgColor: 'bg-warning-50',
    leftBorder: 'border-l-warning-600',
    iconColor: 'text-warning-600',
    countColor: 'text-warning-700',
  },
  {
    status: 'GREEN',
    label: '정상',
    icon: CheckCircle,
    bgColor: 'bg-success-50',
    leftBorder: 'border-l-success-600',
    iconColor: 'text-success-600',
    countColor: 'text-success-700',
  },
];

// 트래픽 라이트 요약 카드 (RED / YELLOW / GREEN)
export function TrafficLightSummary() {
  const router = useRouter();
  const [summary, setSummary] = useState<TlSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrafficLight = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch('/api/students/traffic-light');
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = await res.json();
        if (!json.success) {
          throw new Error(json.error || '데이터를 불러올 수 없습니다.');
        }
        setSummary(json.data.summary);
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : '트래픽 라이트 데이터를 불러올 수 없습니다.';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrafficLight();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-8 w-12" />
                  <Skeleton className="h-4 w-16" />
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
        트래픽 라이트 데이터를 불러오는 중 오류가 발생했습니다: {error}
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {TL_CARDS.map((card, i) => {
        const count = summary[card.status];
        const Icon = card.icon;
        return (
          <Card
            key={card.status}
            className={`${card.bgColor} border-l-4 ${card.leftBorder} cursor-pointer transition-shadow hover:shadow-md animate-fade-up`}
            style={{ animationDelay: `${i * 75}ms` }}
            onClick={() =>
              router.push(`/students?trafficLight=${card.status}`)
            }
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Icon className={`h-10 w-10 ${card.iconColor}`} />
                <div>
                  <p className={`text-3xl font-bold ${card.countColor}`}>
                    {count}
                  </p>
                  <p className={`text-sm font-medium ${card.iconColor}`}>
                    {card.label}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
