'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import type { MonthlyDataPoint } from '../../lib/types';

const COLORS = ['#4f46e5', '#dc2626', '#059669', '#d97706', '#7c3aed'];

interface TrendSeries {
  name: string;
  data: MonthlyDataPoint[];
}

interface Props {
  series: TrendSeries[];
}

export default function TrendLineChart({ series }: Props) {
  if (series.length === 0) return null;

  // Build unified time axis from first series
  const timeLabels = series[0].data.map((d) => `${d.year}.${String(d.month).padStart(2, '0')}`);

  // Build chart data: each row = { label, nationality1: count, nationality2: count, ... }
  const chartData = timeLabels.map((label, i) => {
    const row: Record<string, string | number> = { label };
    for (const s of series) {
      row[s.name] = s.data[i]?.count ?? 0;
    }
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11 }}
          interval={5}
        />
        <YAxis
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
        />
        <Tooltip
          formatter={(value, name) => [
            `${Number(value).toLocaleString('ko-KR')}명`,
            String(name),
          ]}
        />
        <Legend />
        {series.map((s, i) => (
          <Line
            key={s.name}
            type="monotone"
            dataKey={s.name}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
