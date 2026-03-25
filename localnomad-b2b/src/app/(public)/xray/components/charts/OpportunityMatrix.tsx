'use client';

import type { OpportunityNationality } from '../../lib/types';
import { formatNumber } from '../../lib/calculations';

interface Props {
  opportunities: OpportunityNationality[];
  universityName: string;
}

export default function OpportunityMatrix({ opportunities, universityName }: Props) {
  if (opportunities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>현재 기회 국적이 없습니다.</p>
        <p className="text-sm mt-1">전국 성장률 ≥100% AND 귀교 재적 &lt;10명 기준</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {opportunities.map((opp) => (
        <div
          key={opp.nationality}
          className="flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-50 to-white
                     border border-emerald-100 rounded-xl"
        >
          <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-full
                          flex items-center justify-center">
            <span className="text-emerald-700 font-bold text-sm">
              +{Math.round(opp.nationalGrowthPct)}%
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900">{opp.nationality}</p>
            <p className="text-sm text-gray-500">
              전국 {formatNumber(opp.jan2022)} → {formatNumber(opp.jan2026)}명 (4년)
            </p>
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-lg font-bold text-indigo-600">{opp.universityCount}명</p>
            <p className="text-xs text-gray-400">{universityName}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
