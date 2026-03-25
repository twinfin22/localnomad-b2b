// ── Nationality Profile (per university) ──
export interface UniversityProfile {
  total: number;
  nationalities: Record<string, number>;
  genders: { 남: number; 여: number };
  programs: Record<string, number>;
  hhi: number;
  topNationPct: number;
  nNationalities: number;
  kediAvailable: boolean;
  totalEnrollment?: number;
  opportunities?: OpportunityNationality[];
  kedi?: KediProfile;
}

export interface OpportunityNationality {
  nationality: string;
  nationalGrowthPct: number;
  jan2022: number;
  jan2026: number;
  universityCount: number;
}

// ── Monthly Trends ──
export interface MonthlyDataPoint {
  year: number;
  month: number;
  count: number;
}

export interface GrowthRate {
  jan2022: number;
  jan2026: number;
  growthPct: number;
}

export interface MonthlyTrendsData {
  timeSeries: Record<string, MonthlyDataPoint[]>;
  growthRates: Record<string, GrowthRate>;
  meta: {
    startYear: number;
    startMonth: number;
    endYear: number;
    endMonth: number;
    visaTypes: string;
    totalNationalities: number;
  };
}

// ── KEDI Profile ──
export interface KediProfile {
  topikSatisfactionRate: number;
  dormitoryRate: number;
  dormitoryTotal: number;
  dormitoryAccepted: number;
  totalStudents: number;
  tuition: number;
  employmentRate: number;
  region: string;
}

// ── Search Index ──
export interface UniversitySearchItem {
  name: string;
  total: number;
  region: string;
  hasData: boolean;
  kediAvailable: boolean;
}

// ── CTA Form ──
export interface PilotApplicationForm {
  name: string;
  email: string;
  phone: string;
  org: string;
  role: string;
  challenge: string;
  source: 'xray';
}

// ── HHI Levels ──
export type HHILevel = '분산' | '주의' | '위험';
