import type { UniversityProfile, HHILevel, OpportunityNationality } from './types';

export function getHHILevel(hhi: number): HHILevel {
  if (hhi > 0.5) return '위험';
  if (hhi > 0.3) return '주의';
  return '분산';
}

export function getHHIColor(level: HHILevel): string {
  switch (level) {
    case '위험': return 'text-red-600 bg-red-50 border-red-200';
    case '주의': return 'text-amber-600 bg-amber-50 border-amber-200';
    case '분산': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  }
}

export function getHHIEmoji(level: HHILevel): string {
  switch (level) {
    case '위험': return '🔴';
    case '주의': return '🟡';
    case '분산': return '🟢';
  }
}

export function getConcentrationMessage(profile: UniversityProfile): string {
  const topNat = Object.keys(profile.nationalities)[0];
  const pct = profile.topNationPct;
  const level = getHHILevel(profile.hhi);

  if (level === '위험') {
    return `${topNat} 의존도 ${pct}% — 비자 정책 변경 시 높은 리스크`;
  }
  if (level === '주의') {
    return `${topNat} 비중 ${pct}% — 국적 다변화 검토 권장`;
  }
  return `상위 국적 ${pct}% — 비교적 균형 잡힌 구성`;
}

export function getOpportunityMessage(opp: OpportunityNationality, univName: string): string {
  return `${opp.nationality} 전국 +${Math.round(opp.nationalGrowthPct)}%, ${univName} ${opp.universityCount}명`;
}

export function formatNumber(n: number): string {
  return n.toLocaleString('ko-KR');
}

export function formatPercent(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`;
}

// National average for comparison
export function getNationalAverage(
  nationalityName: string,
  allProfiles: Record<string, UniversityProfile>
): number {
  let total = 0;
  let natTotal = 0;
  for (const profile of Object.values(allProfiles)) {
    total += profile.total;
    natTotal += profile.nationalities[nationalityName] ?? 0;
  }
  return total > 0 ? Math.round((natTotal / total) * 100 * 10) / 10 : 0;
}
