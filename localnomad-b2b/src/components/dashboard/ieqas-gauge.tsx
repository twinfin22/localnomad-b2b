'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface IeqasGaugeProps {
  overstayRate: number;
}

// IEQAS 불법체류율 게이지 — 0~5% 범위 가시화
export function IeqasGauge({ overstayRate }: IeqasGaugeProps) {
  // Clamp position to 0–100% (max display range: 5%)
  const position = Math.min(Math.max((overstayRate / 5) * 100, 0), 100);

  // Rate color based on threshold
  const rateColor =
    overstayRate < 1
      ? 'text-emerald-600'
      : overstayRate < 2
        ? 'text-amber-600'
        : 'text-red-600';

  // Status message
  const statusMessage =
    overstayRate < 1
      ? 'IEQAS 우수 인증 기준 충족'
      : overstayRate < 2
        ? 'IEQAS 기본 인증 기준 충족'
        : 'IEQAS 기본 인증 기준 초과 \u2014 즉시 대응 필요';

  // Threshold positions (percentage of gauge width)
  const threshold1Pct = (1 / 5) * 100; // 20% — 우수 인증
  const threshold2Pct = (2 / 5) * 100; // 40% — 기본 인증

  return (
    <Card>
      <CardHeader>
        <CardTitle>IEQAS 불법체류율</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Gauge bar with gradient zones */}
        <div className="relative h-8 rounded-full overflow-hidden flex">
          {/* Green zone: 0-1% (0-20%) */}
          <div
            className="h-full bg-emerald-400"
            style={{ width: `${threshold1Pct}%` }}
          />
          {/* Yellow zone: 1-2% (20-40%) */}
          <div
            className="h-full bg-amber-400"
            style={{ width: `${threshold2Pct - threshold1Pct}%` }}
          />
          {/* Red zone: 2-5% (40-100%) */}
          <div className="h-full bg-red-400 flex-1" />

          {/* Threshold marker at 1% */}
          <div
            className="absolute inset-y-0 w-0.5 bg-white/70"
            style={{ left: `${threshold1Pct}%` }}
          />
          {/* Threshold marker at 2% */}
          <div
            className="absolute inset-y-0 w-0.5 bg-white/70"
            style={{ left: `${threshold2Pct}%` }}
          />

          {/* Current rate marker */}
          <div
            className="absolute inset-y-0 flex items-center"
            style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
          >
            <div className="w-1.5 h-full bg-indigo-600 rounded-full shadow-md" />
          </div>
        </div>

        {/* Scale labels */}
        <div className="relative text-xs text-gray-500 h-5">
          <span className="absolute left-0">0%</span>
          <span
            className="absolute text-emerald-600 font-medium"
            style={{ left: `${threshold1Pct}%`, transform: 'translateX(-50%)' }}
          >
            우수 1%
          </span>
          <span
            className="absolute text-amber-600 font-medium"
            style={{ left: `${threshold2Pct}%`, transform: 'translateX(-50%)' }}
          >
            기본 2%
          </span>
          <span className="absolute right-0">5%</span>
        </div>

        {/* Current rate display */}
        <p className={`text-center text-2xl font-bold ${rateColor}`}>
          {overstayRate.toFixed(1)}%
        </p>
        <p className="text-center text-sm text-gray-500">
          현재 불법체류율 \u2014 {statusMessage}
        </p>
      </CardContent>
    </Card>
  );
}
