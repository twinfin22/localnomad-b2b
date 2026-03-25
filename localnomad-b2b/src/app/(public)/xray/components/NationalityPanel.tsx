'use client';

import { useEffect, useRef } from 'react';
import type { UniversityProfile } from '../lib/types';
import {
  getHHILevel, getHHIColor, getHHIEmoji,
  getConcentrationMessage, formatNumber, formatPercent,
} from '../lib/calculations';
import { trackPanelView, trackCtaClick } from '../lib/analytics';
import NationalityDonut from './charts/NationalityDonut';

interface Props {
  profile: UniversityProfile;
  universityName: string;
  onCtaClick: () => void;
}

export default function NationalityPanel({ profile, universityName, onCtaClick }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) trackPanelView('A'); },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const hhiLevel = getHHILevel(profile.hhi);
  const hhiColor = getHHIColor(hhiLevel);
  const topNationality = Object.keys(profile.nationalities)[0] ?? '';

  // Gender bar data
  const maleRatio = profile.total > 0 ? (profile.genders['남'] / profile.total) * 100 : 50;

  // Program breakdown
  const programEntries = Object.entries(profile.programs).sort(([, a], [, b]) => b - a);

  return (
    <div ref={ref} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        Panel A: 국적 X-Ray
      </h2>

      {/* HHI Badge + Message */}
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-4 ${hhiColor}`}>
        <span>{getHHIEmoji(hhiLevel)}</span>
        <span className="font-semibold">편중도: {hhiLevel}</span>
        <span className="text-sm">(HHI {profile.hhi.toFixed(3)})</span>
      </div>
      <p className="text-gray-700 mb-8">{getConcentrationMessage(profile)}</p>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Donut Chart */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            국적 분포
          </h3>
          <NationalityDonut nationalities={profile.nationalities} total={profile.total} />
          <p className="text-center text-sm text-gray-500 mt-2">
            총 {formatNumber(profile.total)}명 · {profile.nNationalities}개국
          </p>
        </div>

        {/* Details */}
        <div className="space-y-6">
          {/* Top nationalities list */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              상위 국적
            </h3>
            <div className="space-y-2">
              {Object.entries(profile.nationalities).slice(0, 5).map(([nat, count]) => (
                <div key={nat} className="flex items-center justify-between">
                  <span className="text-gray-800">{nat}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${(count / profile.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-500 w-20 text-right">
                      {formatNumber(count)}명 ({formatPercent((count / profile.total) * 100)})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gender */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              성별 비율
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-sm text-blue-600 w-20">남 {formatPercent(maleRatio)}</span>
              <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden flex">
                <div className="h-full bg-blue-400" style={{ width: `${maleRatio}%` }} />
                <div className="h-full bg-pink-400" style={{ width: `${100 - maleRatio}%` }} />
              </div>
              <span className="text-sm text-pink-600 w-20 text-right">여 {formatPercent(100 - maleRatio)}</span>
            </div>
          </div>

          {/* Programs */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              과정별 현황
            </h3>
            <div className="flex flex-wrap gap-2">
              {programEntries.map(([program, count]) => (
                <span
                  key={program}
                  className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                >
                  {program} <span className="font-semibold">{formatNumber(count)}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Foreign ratio (if totalEnrollment available) */}
          {profile.totalEnrollment && profile.totalEnrollment > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                외국인 비율
              </h3>
              <p className="text-2xl font-bold text-indigo-600">
                {formatPercent((profile.total / profile.totalEnrollment) * 100)}
              </p>
              <p className="text-sm text-gray-500">
                전체 재학생 {formatNumber(profile.totalEnrollment)}명 중 {formatNumber(profile.total)}명
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Panel CTA */}
      <div className="mt-8 pt-6 border-t border-gray-100 text-center">
        <p className="text-gray-600 mb-3">국적 다변화 전략이 필요하시다면</p>
        <button
          onClick={() => {
            trackCtaClick(universityName, 'panel-a');
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
