'use client';

import { Suspense, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import UniversitySearch from './UniversitySearch';
import NationalityPanel from './NationalityPanel';
import GrowthPanel from './GrowthPanel';
import ComparisonPanel from './ComparisonPanel';
import PilotCTA from './PilotCTA';
import { getUniversityProfile } from '../lib/data';
import { trackPageView, extractUtmParams } from '../lib/analytics';
import type { UniversityProfile } from '../lib/types';
import { useEffect } from 'react';

function XRayInner() {
  const searchParams = useSearchParams();
  const initialUniv = searchParams.get('univ')
    ? decodeURIComponent(searchParams.get('univ')!)
    : undefined;

  const [selectedUniversity, setSelectedUniversity] = useState<string | null>(null);
  const [profile, setProfile] = useState<UniversityProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCTA, setShowCTA] = useState(false);

  // Track page view on mount
  useEffect(() => {
    const { utmSource } = extractUtmParams(searchParams);
    trackPageView(initialUniv, utmSource);
  }, [searchParams, initialUniv]);

  const handleSelect = useCallback(async (name: string) => {
    setSelectedUniversity(name);
    setIsLoading(true);
    setError(null);
    try {
      const p = await getUniversityProfile(name);
      setProfile(p);
    } catch {
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCtaOpen = useCallback(() => setShowCTA(true), []);
  const handleCtaClose = useCallback(() => setShowCTA(false), []);

  return (
    <>
      {/* Search */}
      <div className="max-w-5xl mx-auto px-4 pb-6 md:pb-8">
        <UniversitySearch
          selectedUniversity={selectedUniversity}
          onSelect={handleSelect}
          initialUniv={initialUniv}
        />
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {!selectedUniversity && (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">위에서 대학을 검색하여 X-Ray 리포트를 확인하세요.</p>
          </div>
        )}

        {selectedUniversity && isLoading && (
          <div className="text-center py-16">
            <div className="inline-flex items-center gap-2 px-6 py-4 bg-gray-50 border border-gray-200 rounded-xl">
              <span className="text-gray-600 font-semibold">데이터 로딩 중...</span>
            </div>
          </div>
        )}

        {selectedUniversity && error && (
          <div className="text-center py-16">
            <div className="inline-flex items-center gap-2 px-6 py-4 bg-red-50 border border-red-200 rounded-xl">
              <span className="text-red-600 font-semibold">{error}</span>
            </div>
            <p className="text-gray-500 mt-3 text-sm">페이지를 새로고침 후 다시 시도해주세요.</p>
          </div>
        )}

        {selectedUniversity && !isLoading && !error && !profile && (
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
              onCtaClick={handleCtaOpen}
            />

            {/* Panel B: Growth Nationalities */}
            <GrowthPanel
              profile={profile}
              universityName={selectedUniversity}
              onCtaClick={handleCtaOpen}
            />

            {/* Panel C: Peer Comparison (only if KEDI data available) */}
            {profile.kediAvailable && profile.kedi && (
              <ComparisonPanel
                profile={profile}
                universityName={selectedUniversity}
                onCtaClick={handleCtaOpen}
              />
            )}
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
                onClick={handleCtaOpen}
                className="px-5 py-2 bg-amber-500 text-white text-sm rounded-lg font-semibold
                           hover:bg-amber-600 transition-colors whitespace-nowrap"
              >
                파일럿 신청
              </button>
            </div>
          </div>
        )}
      </main>

      {/* CTA Modal */}
      <PilotCTA
        universityName={selectedUniversity ?? ''}
        isOpen={showCTA}
        onClose={handleCtaClose}
      />
    </>
  );
}

export default function XRayContent() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-16">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    }>
      <XRayInner />
    </Suspense>
  );
}
