import type { UniversityProfile, KediProfile } from './types';
import { loadNationalityProfiles } from './data';

export interface PeerUniversity {
  name: string;
  kedi: KediProfile;
  foreignStudents: number;
  foreignRatio: number; // %
}

export interface PeerComparison {
  selected: PeerUniversity;
  peers: PeerUniversity[];
  isRegional: boolean; // false = cross-region fallback
  peerAvg: ComparisonMetrics;
  nationalAvg: ComparisonMetrics;
}

export interface ComparisonMetrics {
  topikSatisfactionRate: number;
  dormitoryRate: number;
  foreignRatio: number;
  tuition: number; // 만원
}

function buildPeerEntry(name: string, profile: UniversityProfile): PeerUniversity | null {
  if (!profile.kedi || !profile.kediAvailable) return null;
  const totalStudents = profile.kedi.totalStudents;
  if (totalStudents <= 0) return null;
  return {
    name,
    kedi: profile.kedi,
    foreignStudents: profile.total,
    foreignRatio: Math.round((profile.total / totalStudents) * 1000) / 10,
  };
}

function calcAverage(peers: PeerUniversity[]): ComparisonMetrics {
  if (peers.length === 0) {
    return { topikSatisfactionRate: 0, dormitoryRate: 0, foreignRatio: 0, tuition: 0 };
  }
  const sum = peers.reduce(
    (acc, p) => ({
      topik: acc.topik + p.kedi.topikSatisfactionRate,
      dorm: acc.dorm + p.kedi.dormitoryRate,
      foreign: acc.foreign + p.foreignRatio,
      tuition: acc.tuition + p.kedi.tuition,
    }),
    { topik: 0, dorm: 0, foreign: 0, tuition: 0 }
  );
  const n = peers.length;
  return {
    topikSatisfactionRate: Math.round((sum.topik / n) * 10) / 10,
    dormitoryRate: Math.round((sum.dorm / n) * 10) / 10,
    foreignRatio: Math.round((sum.foreign / n) * 10) / 10,
    tuition: Math.round(sum.tuition / n / 10), // 천원 → 만원
  };
}

export async function getPeerComparison(name: string): Promise<PeerComparison | null> {
  const profiles = await loadNationalityProfiles();
  const selected = profiles[name];
  if (!selected?.kedi || !selected.kediAvailable) return null;

  const selectedEntry = buildPeerEntry(name, selected);
  if (!selectedEntry) return null;

  const selectedSize = selected.kedi.totalStudents;
  const selectedRegion = selected.kedi.region;

  // Build all KEDI-available entries
  const allKedi: PeerUniversity[] = [];
  for (const [uniName, profile] of Object.entries(profiles)) {
    if (uniName === name) continue;
    const entry = buildPeerEntry(uniName, profile);
    if (entry) allKedi.push(entry);
  }

  // Regional peer selection
  const regionalPeers = allKedi.filter((p) => p.kedi.region === selectedRegion);

  // Try ±30%, then ±50%
  let peers = regionalPeers.filter(
    (p) => p.kedi.totalStudents >= selectedSize * 0.7 && p.kedi.totalStudents <= selectedSize * 1.3
  );

  if (peers.length < 3) {
    peers = regionalPeers.filter(
      (p) => p.kedi.totalStudents >= selectedSize * 0.5 && p.kedi.totalStudents <= selectedSize * 1.5
    );
  }

  // Cross-region fallback: nationally by closest size
  let isRegional = true;
  if (peers.length < 3) {
    isRegional = false;
    peers = [...allKedi]
      .sort((a, b) => Math.abs(a.kedi.totalStudents - selectedSize) - Math.abs(b.kedi.totalStudents - selectedSize))
      .slice(0, 5);
  }

  // Cap at 8
  peers = peers.slice(0, 8);

  // Averages
  const peerAvg = calcAverage(peers);
  const nationalAvg = calcAverage(allKedi);

  // Fix selected tuition to 만원
  const selectedWithTuition: PeerUniversity = {
    ...selectedEntry,
    kedi: { ...selectedEntry.kedi, tuition: Math.round(selectedEntry.kedi.tuition / 10) },
  };

  return {
    selected: selectedWithTuition,
    peers,
    isRegional,
    peerAvg,
    nationalAvg,
  };
}
