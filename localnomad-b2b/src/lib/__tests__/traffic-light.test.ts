import { describe, it, expect } from 'vitest';
import { calculateTrafficLight, calculateTrafficLightBatch } from '@/lib/traffic-light';
import type { TrafficLightInput } from '@/types';

// Fixed reference date for all tests
const NOW = new Date('2026-03-01');

/**
 * Returns a default GREEN-status input. Override specific fields to trigger
 * YELLOW or RED conditions.
 */
const makeInput = (overrides: Partial<TrafficLightInput> = {}): TrafficLightInput => ({
  visaExpiry: '2026-06-01', // 92 days away — safely GREEN
  visaStatus: 'ACTIVE',
  enrollmentStatus: 'ENROLLED',
  attendanceRate: 85,
  insuranceStatus: 'ACTIVE',
  addressReported: true,
  partTimePermit: false,
  partTimePermitExpiry: null,
  fimsReports: undefined,
  ...overrides,
});

// ──────────────────────────────────────────────
// GREEN status
// ──────────────────────────────────────────────
describe('GREEN status', () => {
  it('1. normal student with all good values returns GREEN with reason "정상"', () => {
    const result = calculateTrafficLight(makeInput(), NOW);
    expect(result.status).toBe('GREEN');
    expect(result.reasons).toEqual(['정상']);
  });

  it('2. visa 90 days away with 85% attendance returns GREEN', () => {
    const result = calculateTrafficLight(
      makeInput({ visaExpiry: '2026-05-30', attendanceRate: 85 }),
      NOW,
    );
    expect(result.status).toBe('GREEN');
    expect(result.reasons).toEqual(['정상']);
  });

  it('3. no FIMS reports returns GREEN', () => {
    const result = calculateTrafficLight(
      makeInput({ fimsReports: undefined }),
      NOW,
    );
    expect(result.status).toBe('GREEN');
    expect(result.reasons).toEqual(['정상']);
  });
});

// ──────────────────────────────────────────────
// RED status
// ──────────────────────────────────────────────
describe('RED status', () => {
  it('4. visa expiring within 30 days returns RED with days remaining', () => {
    // 20 days from now = 2026-03-21
    const result = calculateTrafficLight(
      makeInput({ visaExpiry: '2026-03-21' }),
      NOW,
    );
    expect(result.status).toBe('RED');
    expect(result.reasons).toEqual(
      expect.arrayContaining([expect.stringMatching(/비자 만료 20일 전/)]),
    );
  });

  it('5. visa already expired (past date) returns RED', () => {
    const result = calculateTrafficLight(
      makeInput({ visaExpiry: '2026-02-28' }),
      NOW,
    );
    expect(result.status).toBe('RED');
    expect(result.reasons).toEqual(
      expect.arrayContaining(['비자가 만료되었습니다']),
    );
  });

  it('6. visaStatus EXPIRED returns RED', () => {
    const result = calculateTrafficLight(
      makeInput({ visaStatus: 'EXPIRED' }),
      NOW,
    );
    expect(result.status).toBe('RED');
    expect(result.reasons).toEqual(
      expect.arrayContaining(['비자가 만료되었습니다']),
    );
  });

  it('7. EXPELLED enrollment returns RED with label "제적"', () => {
    const result = calculateTrafficLight(
      makeInput({ enrollmentStatus: 'EXPELLED' }),
      NOW,
    );
    expect(result.status).toBe('RED');
    expect(result.reasons).toEqual(
      expect.arrayContaining(['학적 상태: 제적']),
    );
  });

  it('8. WITHDRAWN enrollment returns RED with label "자퇴"', () => {
    const result = calculateTrafficLight(
      makeInput({ enrollmentStatus: 'WITHDRAWN' }),
      NOW,
    );
    expect(result.status).toBe('RED');
    expect(result.reasons).toEqual(
      expect.arrayContaining(['학적 상태: 자퇴']),
    );
  });

  it('9. UNREGISTERED enrollment returns RED with label "미등록"', () => {
    const result = calculateTrafficLight(
      makeInput({ enrollmentStatus: 'UNREGISTERED' }),
      NOW,
    );
    expect(result.status).toBe('RED');
    expect(result.reasons).toEqual(
      expect.arrayContaining(['학적 상태: 미등록']),
    );
  });

  it('10. attendance below 50% returns RED', () => {
    const result = calculateTrafficLight(
      makeInput({ attendanceRate: 35 }),
      NOW,
    );
    expect(result.status).toBe('RED');
    expect(result.reasons).toEqual(
      expect.arrayContaining(['출석률 35% (50% 미만)']),
    );
  });

  it('11. FIMS report deadline within 3 days returns RED', () => {
    const result = calculateTrafficLight(
      makeInput({
        fimsReports: [{ status: 'PENDING', deadline: '2026-03-03' }],
      }),
      NOW,
    );
    expect(result.status).toBe('RED');
    expect(result.reasons).toEqual(
      expect.arrayContaining([expect.stringMatching(/FIMS 변동신고 기한 2일 이내/)]),
    );
  });
});

// ──────────────────────────────────────────────
// YELLOW status
// ──────────────────────────────────────────────
describe('YELLOW status', () => {
  it('12. visa expiring in 31-60 days returns YELLOW', () => {
    // 45 days from now = 2026-04-15
    const result = calculateTrafficLight(
      makeInput({ visaExpiry: '2026-04-15' }),
      NOW,
    );
    expect(result.status).toBe('YELLOW');
    expect(result.reasons).toEqual(
      expect.arrayContaining([expect.stringMatching(/비자 만료 45일 전/)]),
    );
  });

  it('13. ON_LEAVE enrollment returns YELLOW with "휴학 중"', () => {
    const result = calculateTrafficLight(
      makeInput({ enrollmentStatus: 'ON_LEAVE' }),
      NOW,
    );
    expect(result.status).toBe('YELLOW');
    expect(result.reasons).toEqual(
      expect.arrayContaining(['휴학 중']),
    );
  });

  it('14. insurance EXPIRING returns YELLOW with "건강보험 만료 임박"', () => {
    const result = calculateTrafficLight(
      makeInput({ insuranceStatus: 'EXPIRING' }),
      NOW,
    );
    expect(result.status).toBe('YELLOW');
    expect(result.reasons).toEqual(
      expect.arrayContaining(['건강보험 만료 임박']),
    );
  });

  it('15. insurance EXPIRED returns YELLOW with "건강보험 만료"', () => {
    const result = calculateTrafficLight(
      makeInput({ insuranceStatus: 'EXPIRED' }),
      NOW,
    );
    expect(result.status).toBe('YELLOW');
    expect(result.reasons).toEqual(
      expect.arrayContaining(['건강보험 만료']),
    );
  });

  it('16. attendance between 50-70% returns YELLOW', () => {
    const result = calculateTrafficLight(
      makeInput({ attendanceRate: 65 }),
      NOW,
    );
    expect(result.status).toBe('YELLOW');
    expect(result.reasons).toEqual(
      expect.arrayContaining(['출석률 65% (70% 미만)']),
    );
  });

  it('17. address not reported returns YELLOW', () => {
    const result = calculateTrafficLight(
      makeInput({ addressReported: false }),
      NOW,
    );
    expect(result.status).toBe('YELLOW');
    expect(result.reasons).toEqual(
      expect.arrayContaining(['체류지 변경 미신고']),
    );
  });

  it('18. part-time permit expiring within 30 days returns YELLOW', () => {
    const result = calculateTrafficLight(
      makeInput({
        partTimePermit: true,
        partTimePermitExpiry: '2026-03-20', // 19 days away
      }),
      NOW,
    );
    expect(result.status).toBe('YELLOW');
    expect(result.reasons).toEqual(
      expect.arrayContaining(['시간제취업 허가 만료 임박']),
    );
  });
});

// ──────────────────────────────────────────────
// Priority & edge cases
// ──────────────────────────────────────────────
describe('Priority & edge cases', () => {
  it('19. both RED and YELLOW conditions present returns RED status', () => {
    const result = calculateTrafficLight(
      makeInput({
        visaExpiry: '2026-03-15', // 14 days — RED
        enrollmentStatus: 'ON_LEAVE', // YELLOW
        insuranceStatus: 'EXPIRING', // YELLOW
      }),
      NOW,
    );
    expect(result.status).toBe('RED');
    // Red reason present
    expect(result.reasons).toEqual(
      expect.arrayContaining([expect.stringMatching(/비자 만료 14일 전/)]),
    );
    // Yellow reasons are NOT included in RED result (engine only returns redReasons)
    expect(result.reasons).not.toEqual(
      expect.arrayContaining(['휴학 중']),
    );
  });

  it('20. multiple RED reasons are all listed', () => {
    const result = calculateTrafficLight(
      makeInput({
        visaExpiry: '2026-02-20', // expired — RED
        visaStatus: 'EXPIRED', // RED
        enrollmentStatus: 'EXPELLED', // RED
        attendanceRate: 30, // RED
      }),
      NOW,
    );
    expect(result.status).toBe('RED');
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        '비자가 만료되었습니다', // from daysToExpiry <= 0
        '학적 상태: 제적',
        '출석률 30% (50% 미만)',
      ]),
    );
    // visaStatus EXPIRED also pushes "비자가 만료되었습니다" (can appear twice)
    expect(result.reasons.filter((r) => r === '비자가 만료되었습니다').length).toBe(2);
  });

  it('21. null attendanceRate generates no attendance reason', () => {
    const result = calculateTrafficLight(
      makeInput({ attendanceRate: null }),
      NOW,
    );
    expect(result.status).toBe('GREEN');
    expect(result.reasons).toEqual(['정상']);
    // No attendance-related string in reasons
    expect(result.reasons.some((r) => r.includes('출석률'))).toBe(false);
  });

  it('22. empty fimsReports array generates no FIMS reason', () => {
    const result = calculateTrafficLight(
      makeInput({ fimsReports: [] }),
      NOW,
    );
    expect(result.status).toBe('GREEN');
    expect(result.reasons.some((r) => r.includes('FIMS'))).toBe(false);
  });

  it('23a. exactly 30 days to visa expiry returns RED', () => {
    // 2026-03-01 + 30 days = 2026-03-31
    const result = calculateTrafficLight(
      makeInput({ visaExpiry: '2026-03-31' }),
      NOW,
    );
    expect(result.status).toBe('RED');
    expect(result.reasons).toEqual(
      expect.arrayContaining(['비자 만료 30일 전']),
    );
  });

  it('23b. exactly 31 days to visa expiry returns YELLOW', () => {
    // 2026-03-01 + 31 days = 2026-04-01
    const result = calculateTrafficLight(
      makeInput({ visaExpiry: '2026-04-01' }),
      NOW,
    );
    expect(result.status).toBe('YELLOW');
    expect(result.reasons).toEqual(
      expect.arrayContaining(['비자 만료 31일 전']),
    );
  });

  it('23c. exactly 60 days to visa expiry returns YELLOW', () => {
    // 2026-03-01 + 60 days = 2026-04-30
    const result = calculateTrafficLight(
      makeInput({ visaExpiry: '2026-04-30' }),
      NOW,
    );
    expect(result.status).toBe('YELLOW');
    expect(result.reasons).toEqual(
      expect.arrayContaining(['비자 만료 60일 전']),
    );
  });

  it('23d. exactly 61 days to visa expiry returns GREEN', () => {
    // 2026-03-01 + 61 days = 2026-05-01
    const result = calculateTrafficLight(
      makeInput({ visaExpiry: '2026-05-01' }),
      NOW,
    );
    expect(result.status).toBe('GREEN');
    expect(result.reasons).toEqual(['정상']);
  });
});

// ──────────────────────────────────────────────
// Batch processing
// ──────────────────────────────────────────────
describe('calculateTrafficLightBatch', () => {
  it('24. processes 5 students and returns Map with correct entries', () => {
    const students = [
      { id: 's1', ...makeInput() }, // GREEN
      { id: 's2', ...makeInput({ visaExpiry: '2026-03-15' }) }, // RED (14 days)
      { id: 's3', ...makeInput({ enrollmentStatus: 'ON_LEAVE' }) }, // YELLOW
      { id: 's4', ...makeInput({ visaStatus: 'EXPIRED' }) }, // RED
      { id: 's5', ...makeInput({ attendanceRate: 65 }) }, // YELLOW
    ];

    const results = calculateTrafficLightBatch(students, NOW);

    expect(results.size).toBe(5);
    expect(results.get('s1')?.status).toBe('GREEN');
    expect(results.get('s2')?.status).toBe('RED');
    expect(results.get('s3')?.status).toBe('YELLOW');
    expect(results.get('s4')?.status).toBe('RED');
    expect(results.get('s5')?.status).toBe('YELLOW');
  });

  it('25. empty array returns empty Map', () => {
    const results = calculateTrafficLightBatch([], NOW);
    expect(results.size).toBe(0);
    expect(results).toBeInstanceOf(Map);
  });
});
