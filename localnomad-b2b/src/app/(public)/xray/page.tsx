'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import UniversitySearch from './components/UniversitySearch';
import NationalityPanel from './components/NationalityPanel';
import GrowthPanel from './components/GrowthPanel';
import PilotCTA from './components/PilotCTA';
import { getUniversityProfile } from './lib/data';
import { trackPageView, extractUtmParams } from './lib/analytics';
import type { UniversityProfile } from './lib/types';

export default function XRayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">로딩 중...</p>
      </div>
    }>
      <XRayContent />
    </Suspense>
  );
}

function XRayContent() {
  const searchParams = useSearchParams();
  const initialUniv = searchParams.get('univ')
    ? decodeURIComponent(searchParams.get('univ')!)
    : undefined;

  const [selectedUniversity, setSelectedUniversity] = useState<string | null>(null);
  const [profile, setProfile] = useState<UniversityProfile | null>(null);
  const [showCTA, setShowCTA] = useState(false);

  // Track page view on mount
  useEffect(() => {
    const { utmSource } = extractUtmParams(searchParams);
    trackPageView(initialUniv, utmSource);
  }, [searchParams, initialUniv]);

  const handleSelect = useCallback((name: string) => {
    setSelectedUniversity(name);
    const p = getUniversityProfile(name);
    setProfile(p);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-6 md:py-8">
          <div className="text-center mb-8">
            <p className="text-sm font-semibold text-indigo-600 tracking-wide uppercase mb-2">
              VisaCampus
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              유학생 X-Ray
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              우리 대학 유학생 국적 편중도, 성장 국적, 유치 기회를 한눈에 분석합니다.
            </p>
          </div>
          <UniversitySearch
            selectedUniversity={selectedUniversity}
            onSelect={handleSelect}
            initialUniv={initialUniv}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {!selectedUniversity && (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">위에서 대학을 검색하여 X-Ray 리포트를 확인하세요.</p>
          </div>
        )}

        {selectedUniversity && !profile && (
          <div className="text-center py-16">
            <div className="inline-flex items-center gap-2 px-6 py-4 bg-amber-50 border border-amber-200 rounded-xl">
              <span className="text-amber-600 font-semibold">데이터 준비 중입니다</span>
            </div>
            <p className="text-gray-500 mt-3 text-sm">
              {selectedUniversity}의 상세 데이터는 현재 준비 중입니다.
            </p>
          </div>
        )}

        {selectedUniversity && profile && (
          <>
            {/* Panel A: Nationality X-Ray */}
            <NationalityPanel
              profile={profile}
              universityName={selectedUniversity}
              onCtaClick={() => setShowCTA(true)}
            />

            {/* Panel B: Growth Nationalities */}
            <GrowthPanel
              profile={profile}
              universityName={selectedUniversity}
              onCtaClick={() => setShowCTA(true)}
            />
          </>
        )}

        {/* Sticky Bottom CTA Banner */}
        {selectedUniversity && profile && !showCTA && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
            <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">{selectedUniversity}</span>의 유학생 관리, VisaCampus가 도와드립니다.
              </p>
              <button
                onClick={() => setShowCTA(true)}
                className="px-5 py-2 bg-indigo-600 text-white text-sm rounded-lg font-semibold
                           hover:bg-indigo-700 transition-colors whitespace-nowrap"
              >
                파일럿 신청
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Attribution Footer */}
      <footer className="bg-white border-t border-gray-100 mt-16 pb-20">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="text-center text-xs text-gray-400 space-y-2">
            <p className="font-semibold text-gray-500">공공누리 제1유형 출처표시</p>
            <p>
              이 서비스는 공공데이터포털(data.go.kr)의 공공데이터를 활용하였습니다.
            </p>
            <p>
              법무부 출입국외국인정책본부 - 유학생관리정보 데이터 ·
              법무부 - 월별 외국인 유학생 국적(지역)별 현황 ·
              한국교육개발원(KEDI) - 외국인 유학생 현황 ·
              교육부 대학알리미 - 대학주요정보 ·
              법무부 - 체류외국인 통계
            </p>
            <p className="mt-4 text-gray-300">
              &copy; 2026 VisaCampus. 데이터 기준일: 2025.12.31
            </p>
          </div>
        </div>
      </footer>

      {/* CTA Modal */}
      <PilotCTA
        universityName={selectedUniversity ?? ''}
        isOpen={showCTA}
        onClose={() => setShowCTA(false)}
      />
    </div>
  );
}
