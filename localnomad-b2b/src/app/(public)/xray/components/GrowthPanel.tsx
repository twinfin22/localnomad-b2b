'use client';

import { useEffect, useRef, useMemo } from 'react';
import type { UniversityProfile, MonthlyTrendsData } from '../lib/types';
import { getMonthlyTrends, getNationalTrend } from '../lib/data';
import { formatNumber, formatPercent } from '../lib/calculations';
import { trackPanelView, trackCtaClick } from '../lib/analytics';
import TrendLineChart from './charts/TrendLineChart';
import OpportunityMatrix from './charts/OpportunityMatrix';

interface Props {
  profile: UniversityProfile;
  universityName: string;
  onCtaClick: () => void;
}

export default function GrowthPanel({ profile, universityName, onCtaClick }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const trendsData = useMemo(() => getMonthlyTrends(), []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) trackPanelView('B'); },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Top 5 growth nationalities nationally
  const topGrowth = useMemo(() => {
    return Object.entries(trendsData.growthRates)
      .filter(([, info]) => info.growthPct >= 100 && info.jan2026 >= 100)
      .slice(0, 5);
  }, [trendsData]);

  // Build trend chart series for top growth nationalities
  const trendSeries = useMemo(() => {
    return topGrowth.map(([nat]) => ({
      name: nat,
      data: getNationalTrend(nat) ?? [],
    })).filter((s) => s.data.length > 0);
  }, [topGrowth]);

  // University's top nationality vs national average
  const topNat = Object.keys(profile.nationalities)[0] ?? '';
  const topNatPct = profile.topNationPct;
  const nationalGrowthInfo = trendsData.growthRates[topNat];

  // National average share of top nationality
  const topNatNational = nationalGrowthInfo
    ? Math.round((nationalGrowthInfo.jan2026 / Object.values(trendsData.growthRates).reduce((s, g) => s + g.jan2026, 0)) * 100 * 10) / 10
    : 0;

  return (
    <div ref={ref} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        Panel B: 성장 국적 & 기회
      </h2>

      {/* Your share vs national */}
      {topNat && (
        <div className="mb-8 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
          <p className="text-sm text-indigo-600 font-semibold mb-1">귀교 vs 전국</p>
          <p className="text-gray-800">
            귀교 <span className="font-bold">{topNat}</span> 비중{' '}
            <span className="text-indigo-600 font-bold">{formatPercent(topNatPct)}</span>
            {topNatNational > 0 && (
              <> vs 전국 평균 약 <span className="font-semibold">{formatPercent(topNatNational)}</span></>
            )}
          </p>
        </div>
      )}

      {/* Opportunity Nationalities */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          기회 국적 (전국 성장 ≥100%, 귀교 &lt;10명)
        </h3>
        <OpportunityMatrix
          opportunities={profile.opportunities ?? []}
          universityName={universityName}
        />
      </div>

      {/* National Trend Chart */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          전국 주요 성장 국적 추이 (D2+D4, 2022.01 ~ 2026.01)
        </h3>
        <TrendLineChart series={trendSeries} />
        <p className="text-xs text-gray-400 mt-2 text-center">
          출처: 법무부 출입국외국인정책본부 · D2(유학) + D4(어학연수) 기준
        </p>
      </div>

      {/* Top Growth Table */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          4년 성장률 상위 국적
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 font-semibold text-gray-600">국적</th>
                <th className="text-right py-2 px-3 font-semibold text-gray-600">2022.01</th>
                <th className="text-right py-2 px-3 font-semibold text-gray-600">2026.01</th>
                <th className="text-right py-2 px-3 font-semibold text-gray-600">성장률</th>
                <th className="text-right py-2 px-3 font-semibold text-gray-600">귀교</th>
              </tr>
            </thead>
            <tbody>
              {topGrowth.map(([nat, info]) => {
                const uniCount = profile.nationalities[nat] ?? 0;
                return (
                  <tr key={nat} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 px-3 text-gray-800">{nat}</td>
                    <td className="py-2 px-3 text-right text-gray-600">{formatNumber(info.jan2022)}</td>
                    <td className="py-2 px-3 text-right text-gray-600">{formatNumber(info.jan2026)}</td>
                    <td className="py-2 px-3 text-right font-semibold text-emerald-600">
                      +{formatPercent(info.growthPct, 0)}
                    </td>
                    <td className="py-2 px-3 text-right text-indigo-600 font-semibold">
                      {formatNumber(uniCount)}명
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Panel CTA */}
      <div className="pt-6 border-t border-gray-100 text-center">
        <p className="text-gray-600 mb-3">성장 국적 유치 전략 수립을 도와드립니다</p>
        <button
          onClick={() => {
            trackCtaClick(universityName, 'panel-b');
            onCtaClick();
          }}
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold
                     hover:bg-indigo-700 transition-colors"
        >
          파일럿 신청하기
        </button>
      </div>
    </div>
  );
}
