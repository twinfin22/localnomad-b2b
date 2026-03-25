import type {
  UniversityProfile,
  MonthlyTrendsData,
  UniversitySearchItem,
} from './types';

import nationalityProfilesJson from '@/data/xray/nationality-profiles.json';
import monthlyTrendsJson from '@/data/xray/monthly-trends.json';
import universitiesJson from '@/data/xray/universities.json';

// Type assertions for JSON imports
const nationalityProfiles = nationalityProfilesJson as Record<string, UniversityProfile>;
const monthlyTrends = monthlyTrendsJson as MonthlyTrendsData;
const universities = universitiesJson as UniversitySearchItem[];

export function getUniversityProfile(name: string): UniversityProfile | null {
  return nationalityProfiles[name] ?? null;
}

export function getMonthlyTrends(): MonthlyTrendsData {
  return monthlyTrends;
}

export function getNationalTrend(nationality: string) {
  return monthlyTrends.timeSeries[nationality] ?? null;
}

export function getGrowthRate(nationality: string) {
  return monthlyTrends.growthRates[nationality] ?? null;
}

export function getAllUniversities(): UniversitySearchItem[] {
  return universities;
}

export function searchUniversities(query: string): UniversitySearchItem[] {
  if (!query.trim()) return universities.slice(0, 10);

  const q = query.trim().toLowerCase();

  // Hangul chosung extraction for 초성 search
  const isChosung = /^[ㄱ-ㅎ]+$/.test(q);

  return universities
    .filter((u) => {
      if (isChosung) {
        const nameChosung = extractChosung(u.name);
        return nameChosung.includes(q);
      }
      return u.name.toLowerCase().includes(q);
    })
    .slice(0, 10);
}

// ── Hangul 초성 extraction ──
const CHOSUNG_LIST = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
];
const HANGUL_START = 0xAC00;
const HANGUL_END = 0xD7A3;

function extractChosung(str: string): string {
  return Array.from(str)
    .map((ch) => {
      const code = ch.charCodeAt(0);
      if (code >= HANGUL_START && code <= HANGUL_END) {
        const index = Math.floor((code - HANGUL_START) / 588);
        return CHOSUNG_LIST[index];
      }
      return ch.toLowerCase();
    })
    .join('');
}
