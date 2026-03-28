import type {
  UniversityProfile,
  MonthlyTrendsData,
  UniversitySearchItem,
} from './types';

// Universities (84KB) stays eager — needed for instant search
import universitiesJson from '@/data/xray/universities.json';
const universities = universitiesJson as UniversitySearchItem[];

// Lazy-loaded data (nationality-profiles 970KB, monthly-trends 717KB)
let _nationalityProfiles: Record<string, UniversityProfile> | null = null;
let _monthlyTrends: MonthlyTrendsData | null = null;

export async function loadNationalityProfiles() {
  if (!_nationalityProfiles) {
    const mod = await import('@/data/xray/nationality-profiles.json');
    _nationalityProfiles = mod.default as Record<string, UniversityProfile>;
  }
  return _nationalityProfiles;
}

async function loadMonthlyTrends() {
  if (!_monthlyTrends) {
    const mod = await import('@/data/xray/monthly-trends.json');
    _monthlyTrends = mod.default as MonthlyTrendsData;
  }
  return _monthlyTrends;
}

export async function getUniversityProfile(name: string): Promise<UniversityProfile | null> {
  const profiles = await loadNationalityProfiles();
  return profiles[name] ?? null;
}

export async function getMonthlyTrends(): Promise<MonthlyTrendsData> {
  return loadMonthlyTrends();
}

export async function getNationalTrend(nationality: string) {
  const trends = await loadMonthlyTrends();
  return trends.timeSeries[nationality] ?? null;
}

export async function getGrowthRate(nationality: string) {
  const trends = await loadMonthlyTrends();
  return trends.growthRates[nationality] ?? null;
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
