'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, type PieLabelRenderProps } from 'recharts';

const COLORS = ['#4f46e5', '#7c3aed', '#2563eb', '#0891b2', '#059669', '#d97706', '#dc2626', '#6b7280'];

interface Props {
  nationalities: Record<string, number>;
  total: number;
}

export default function NationalityDonut({ nationalities, total }: Props) {
  const entries = Object.entries(nationalities);
  const top5 = entries.slice(0, 5);
  const otherCount = entries.slice(5).reduce((sum, [, count]) => sum + count, 0);

  const data = [
    ...top5.map(([name, count]) => ({
      name,
      value: count,
      pct: ((count / total) * 100).toFixed(1),
    })),
    ...(otherCount > 0 ? [{
      name: '기타',
      value: otherCount,
      pct: ((otherCount / total) * 100).toFixed(1),
    }] : []),
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={110}
          paddingAngle={2}
          dataKey="value"
          label={(props: PieLabelRenderProps) => {
            const name = props.name ?? '';
            const percent = typeof props.percent === 'number' ? props.percent : 0;
            return `${name} ${(percent * 100).toFixed(1)}%`;
          }}
          labelLine={{ strokeWidth: 1 }}
        >
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => [
            `${Number(value).toLocaleString('ko-KR')}명 (${((Number(value) / total) * 100).toFixed(1)}%)`,
            String(name),
          ]}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
