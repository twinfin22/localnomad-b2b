'use client';

import { useEffect, useRef, useState, memo } from 'react';
import type { UniversityProfile } from '../lib/types';
import { getPeerComparison, type PeerComparison } from '../lib/peers';
import { formatNumber, formatPercent } from '../lib/calculations';
import { trackPanelView, trackCtaClick } from '../lib/analytics';

interface Props {
  profile: UniversityProfile;
  universityName: string;
  onCtaClick: () => void;
}

interface BarProps {
  label: string;
  unit: string;
  selected: number;
  peerAvg: number;
  nationalAvg: number;
  maxValue?: number;
  lowerIsBetter?: boolean;
}

function BulletChart({ label, unit, selected, peerAvg, nationalAvg, maxValue, lowerIsBetter }: BarProps) {
  const max = maxValue ?? Math.max(selected, peerAvg, nationalAvg, 1) * 1.3;
  const scale = (v: number) => Math.min((v / max) * 100, 100);

  const displayVal = lowerIsBetter
    ? Math.round(selected).toLocaleString('ko-KR')
    : selected.toFixed(1);

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-baseline">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <span className="text-sm font-bold tabular-nums text-blue-800">
          {displayVal}{unit}
        </span>
      </div>
      {/* Bullet bar */}
      <div className="relative h-8 bg-gray-100 rounded overflow-hidden">
        {/* National avg range background */}
        <div
          className="absolute inset-y-0 left-0 bg-gray-200 rounded"
          style={{ width: `${scale(Math.max(nationalAvg, peerAvg) * 1.15)}%` }}
        />
        {/* Peer avg range */}
        <div
          className="absolute inset-y-1 left-0 bg-gray-300/70 rounded"
          style={{ width: `${scale(peerAvg)}%` }}
        />
        {/* Selected university (primary bar) */}
        <div
          className="absolute inset-y-2 left-0 bg-blue-600 rounded"
          style={{ width: `${scale(selected)}%` }}
        />
        {/* National avg marker line */}
        <div
          className="absolute inset-y-0 w-0.5 bg-emerald-600"
          style={{ left: `${scale(nationalAvg)}%` }}
          title={`전국 평균: ${nationalAvg.toFixed(1)}${unit}`}
        />
      </div>
      {/* Legend row */}
      <div className="flex justify-between text-xs text-gray-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-2 bg-blue-600 rounded" /> 귀교
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-2 bg-gray-300 rounded" /> Peer {peerAvg.toFixed(1)}{unit}
          </span>
        </div>
        <span className="flex items-center gap-1 text-emerald-600">
          <span className="inline-block w-2 h-3 bg-emerald-600 rounded" /> 전국 {nationalAvg.toFixed(1)}{unit}
        </span>
      </div>
    </div>
  );
}

function ComparisonPanel({ profile, universityName, onCtaClick }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<PeerComparison | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // GA4 panel view tracking
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) trackPanelView('C'); },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Load peer comparison data
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    (async () => {
      try {
        const result = await getPeerComparison(universityName);
        if (!cancelled) setData(result);
      } catch {
        console.error('Failed to load peer comparison');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [universityName]);

  const selectedTuition = data ? data.selected.kedi.tuition : 0;
  const selectedForeignRatio = data ? data.selected.foreignRatio : 0;

  return (
    <div ref={ref} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        Panel C: 유사 대학 비교
      </h2>

      {isLoading && (
        <div className="h-[400px] bg-gray-50 rounded-xl animate-pulse" />
      )}

      {!isLoading && !data && (
        <div className="text-center py-8 text-gray-500">
          <p>비교 데이터를 불러올 수 없습니다.</p>
        </div>
      )}

      {!isLoading && data && (
        <>
          {/* Peer group header */}
          <div className="mb-8 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <p className="text-sm text-indigo-600 font-semibold">
              {data.isRegional
                ? `${data.selected.kedi.region} · 유사 규모 대학 ${data.peers.length}개교`
                : `전국 유사 규모 대학 ${data.peers.length}개교`
              }
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {data.isRegional
                ? '같은 지역, 재학생 수 ±30% 기준'
                : '지역 내 비교 대학이 부족하여 전국 기준으로 비교합니다'
              }
            </p>
          </div>

          {/* 4 comparison bars */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <BulletChart
              label="TOPIK 충족률"
              unit=""
              selected={profile.kedi!.topikSatisfactionRate}
              peerAvg={data.peerAvg.topikSatisfactionRate}
              nationalAvg={data.nationalAvg.topikSatisfactionRate}
              maxValue={100}
            />
            <BulletChart
              label="기숙사 수용률"
              unit=""
              selected={profile.kedi!.dormitoryRate}
              peerAvg={data.peerAvg.dormitoryRate}
              nationalAvg={data.nationalAvg.dormitoryRate}
              maxValue={100}
            />
            <BulletChart
              label="외국인 비율"
              unit=""
              selected={selectedForeignRatio}
              peerAvg={data.peerAvg.foreignRatio}
              nationalAvg={data.nationalAvg.foreignRatio}
              maxValue={Math.max(selectedForeignRatio, data.peerAvg.foreignRatio, data.nationalAvg.foreignRatio, 1) * 1.5}
            />
            <BulletChart
              label="평균 등록금"
              unit="만원"
              selected={selectedTuition}
              peerAvg={data.peerAvg.tuition}
              nationalAvg={data.nationalAvg.tuition}
              lowerIsBetter
            />
          </div>

          {/* Peer university list */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              비교 대학 목록
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-semibold text-gray-600">대학명</th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-600">재학생</th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-600">유학생</th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-600">TOPIK</th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-600">등록금</th>
                  </tr>
                </thead>
                <tbody>
                  {data.peers.map((peer) => (
                    <tr key={peer.name} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2 px-3 text-gray-800">{peer.name}</td>
                      <td className="py-2 px-3 text-right text-gray-600">
                        {formatNumber(peer.kedi.totalStudents)}
                      </td>
                      <td className="py-2 px-3 text-right text-gray-600">
                        {formatNumber(peer.foreignStudents)}명
                      </td>
                      <td className="py-2 px-3 text-right text-gray-600">
                        {formatPercent(peer.kedi.topikSatisfactionRate)}
                      </td>
                      <td className="py-2 px-3 text-right text-gray-600">
                        {formatNumber(Math.round(peer.kedi.tuition / 10))}만원
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              출처: 한국교육개발원(KEDI) · 교육부 대학알리미 · 기숙사는 학위과정 기준
            </p>
          </div>

          {/* Panel CTA */}
          <div className="pt-6 border-t border-gray-100 text-center">
            <p className="text-gray-600 mb-3">경쟁 대학 분석을 바탕으로 유치 전략을 세워드립니다</p>
            <button
              onClick={() => {
                trackCtaClick(universityName, 'panel-c');
                onCtaClick();
              }}
              className="px-6 py-3 bg-amber-500 text-white rounded-xl font-semibold
                         hover:bg-amber-600 transition-colors"
            >
              파일럿 신청하기
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default memo(ComparisonPanel);
