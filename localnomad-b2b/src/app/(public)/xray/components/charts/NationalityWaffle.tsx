'use client';

interface Props {
  nationalities: Record<string, number>;
  total: number;
}

const COLORS = [
  'bg-blue-600',    // 1st nationality
  'bg-violet-500',  // 2nd
  'bg-sky-500',     // 3rd
  'bg-teal-500',    // 4th
  'bg-orange-500',  // 5th
  'bg-gray-300',    // 기타
];

export default function NationalityWaffle({ nationalities, total }: Props) {
  const entries = Object.entries(nationalities);
  const top5 = entries.slice(0, 5);
  const otherCount = entries.slice(5).reduce((sum, [, count]) => sum + count, 0);

  // Build 100-cell array
  const cells: number[] = [];
  let remaining = 100;

  top5.forEach(([, count], i) => {
    const pct = Math.round((count / total) * 100);
    const cellCount = Math.min(pct, remaining);
    for (let j = 0; j < cellCount; j++) cells.push(i);
    remaining -= cellCount;
  });

  // Fill remainder with 기타
  while (cells.length < 100) cells.push(5);

  // Legend data
  const legend = [
    ...top5.map(([name, count], i) => ({
      name,
      pct: ((count / total) * 100).toFixed(1),
      count,
      color: COLORS[i],
    })),
    ...(otherCount > 0 ? [{
      name: '기타',
      pct: ((otherCount / total) * 100).toFixed(1),
      count: otherCount,
      color: COLORS[5],
    }] : []),
  ];

  return (
    <div>
      {/* 10x10 Grid */}
      <div className="grid grid-cols-10 gap-1 w-fit mx-auto">
        {cells.map((colorIdx, i) => (
          <div
            key={i}
            className={`w-5 h-5 md:w-6 md:h-6 rounded-sm ${COLORS[colorIdx]} transition-colors`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-4">
        {legend.map((item) => (
          <div key={item.name} className="flex items-center gap-1.5 text-sm">
            <span className={`inline-block w-3 h-3 rounded-sm ${item.color}`} />
            <span className="text-gray-700">{item.name}</span>
            <span className="text-gray-500 tabular-nums">{item.pct}%</span>
          </div>
        ))}
      </div>

      {/* Total */}
      <p className="text-center text-sm text-gray-500 mt-2">
        총 <span className="font-semibold tabular-nums">{total.toLocaleString('ko-KR')}</span>명
      </p>
    </div>
  );
}
