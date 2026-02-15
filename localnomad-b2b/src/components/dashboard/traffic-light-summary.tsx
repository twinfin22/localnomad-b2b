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
  borderColor: string;
  iconColor: string;
  countColor: string;
}

const TL_CARDS: TlCardConfig[] = [
  {
    status: 'RED',
    label: '긴급',
    icon: AlertOctagon,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    iconColor: 'text-red-600',
    countColor: 'text-red-700',
  },
  {
    status: 'YELLOW',
    label: '주의',
    icon: AlertTriangle,
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    iconColor: 'text-amber-600',
    countColor: 'text-amber-700',
  },
  {
    status: 'GREEN',
    label: '정상',
    icon: CheckCircle,
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    iconColor: 'text-emerald-600',
    countColor: 'text-emerald-700',
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
      {TL_CARDS.map((card) => {
        const count = summary[card.status];
        const Icon = card.icon;
        return (
          <Card
            key={card.status}
            className={`${card.bgColor} ${card.borderColor} cursor-pointer transition-shadow hover:shadow-md`}
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
