import 'dotenv/config';
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// ---------------------------------------------------------------------------
// Inline AES-256-GCM encrypt (no @/ alias — tsx runs outside Next.js)
// ---------------------------------------------------------------------------
function encrypt(text: string): string {
  const key = process.env.AES_ENCRYPTION_KEY;
  if (!key || key.length !== 32) {
    throw new Error('AES_ENCRYPTION_KEY must be exactly 32 bytes');
  }
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'utf-8'), iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

// ---------------------------------------------------------------------------
// Prisma client (standalone — no singleton needed for seed)
// ---------------------------------------------------------------------------
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// Helper: pick a random element from an array
// ---------------------------------------------------------------------------
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ---------------------------------------------------------------------------
// Helper: generate a date between two dates
// ---------------------------------------------------------------------------
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// ---------------------------------------------------------------------------
// Helper: Box-Muller transform for normal distribution
// ---------------------------------------------------------------------------
function boxMuller(mean: number, stddev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + z0 * stddev;
}

// ---------------------------------------------------------------------------
// Reference data
// ---------------------------------------------------------------------------

const DEPARTMENTS = [
  '컴퓨터공학과',
  '경영학과',
  '한국어학과',
  '기계공학과',
  '전자공학과',
  '화학공학과',
];

const SEMESTERS = ['1학기', '2학기', '3학기', '4학기', '5학기', '6학기', '7학기', '8학기'];

// Names by nationality — { nameKr, nameEn }
const NAMES_VN = [
  { nameKr: '응우옌 반 안', nameEn: 'NGUYEN VAN AN' },
  { nameKr: '쩐 티 빅', nameEn: 'TRAN THI BICH' },
  { nameKr: '레 반 뚜안', nameEn: 'LE VAN TUAN' },
  { nameKr: '팜 티 화', nameEn: 'PHAM THI HOA' },
  { nameKr: '호앙 반 둑', nameEn: 'HOANG VAN DUC' },
  { nameKr: '부이 티 마이', nameEn: 'BUI THI MAI' },
  { nameKr: '보 반 하이', nameEn: 'VO VAN HAI' },
  { nameKr: '당 티 랑', nameEn: 'DANG THI LANG' },
  { nameKr: '도 반 남', nameEn: 'DO VAN NAM' },
  { nameKr: '응우옌 티 투이', nameEn: 'NGUYEN THI THUY' },
  { nameKr: '쩐 반 롱', nameEn: 'TRAN VAN LONG' },
  { nameKr: '레 티 응옥', nameEn: 'LE THI NGOC' },
  { nameKr: '팜 반 꾸엉', nameEn: 'PHAM VAN CUONG' },
  { nameKr: '호앙 티 란', nameEn: 'HOANG THI LAN' },
  { nameKr: '부이 반 탄', nameEn: 'BUI VAN THANH' },
  { nameKr: '응우옌 반 프엉', nameEn: 'NGUYEN VAN PHUONG' },
  { nameKr: '쩐 티 하', nameEn: 'TRAN THI HA' },
  { nameKr: '레 반 흥', nameEn: 'LE VAN HUNG' },
  { nameKr: '팜 티 응아', nameEn: 'PHAM THI NGA' },
  { nameKr: '보 반 민', nameEn: 'VO VAN MINH' },
];

const NAMES_CN = [
  { nameKr: '왕 웨이', nameEn: 'WANG WEI' },
  { nameKr: '리 나', nameEn: 'LI NA' },
  { nameKr: '장 하오', nameEn: 'ZHANG HAO' },
  { nameKr: '류 양', nameEn: 'LIU YANG' },
  { nameKr: '천 징', nameEn: 'CHEN JING' },
  { nameKr: '자오 민', nameEn: 'ZHAO MIN' },
  { nameKr: '황 레이', nameEn: 'HUANG LEI' },
  { nameKr: '쑨 리', nameEn: 'SUN LI' },
  { nameKr: '우 샤오린', nameEn: 'WU XIAOLIN' },
  { nameKr: '저우 팡', nameEn: 'ZHOU FANG' },
  { nameKr: '쉬 잉', nameEn: 'XU YING' },
  { nameKr: '마 쯔이', nameEn: 'MA ZIYI' },
  { nameKr: '궈 위엔', nameEn: 'GUO YUAN' },
];

const NAMES_UZ = [
  { nameKr: '아지즈 카리모프', nameEn: 'AZIZ KARIMOV' },
  { nameKr: '딜노자 라히모바', nameEn: 'DILNOZA RAHIMOVA' },
  { nameKr: '쟈소르 미르자예프', nameEn: 'JASUR MIRZAYEV' },
  { nameKr: '마디나 유수포바', nameEn: 'MADINA YUSUPOVA' },
  { nameKr: '노디르 압둘라예프', nameEn: 'NODIR ABDULLAYEV' },
  { nameKr: '굴노라 이스모일로바', nameEn: 'GULNORA ISMOILOVA' },
  { nameKr: '사르도르 투라예프', nameEn: 'SARDOR TURAYEV' },
  { nameKr: '무니라 토시포바', nameEn: 'MUNIRA TOSHPOVA' },
];

const NAMES_MN = [
  { nameKr: '바트바야르', nameEn: 'BATBAYAR GANBOLD' },
  { nameKr: '오윤차강', nameEn: 'OYUNCHIMEG DORJ' },
  { nameKr: '에르덴바트', nameEn: 'ERDENBAT BOLD' },
  { nameKr: '바야르마', nameEn: 'BAYARMA DASH' },
  { nameKr: '뭉흐바트', nameEn: 'MUNKHBAT ENKHTUR' },
];

const NAMES_OTHER = [
  { nameKr: '라즈 쿠마르', nameEn: 'RAJ KUMAR', nationality: 'NP' },
  { nameKr: '모하마드 알리', nameEn: 'MOHAMMAD ALI', nationality: 'BD' },
  { nameKr: '마리아 산토스', nameEn: 'MARIA SANTOS', nationality: 'PH' },
  { nameKr: '안디 위자야', nameEn: 'ANDI WIJAYA', nationality: 'ID' },
  { nameKr: '아미르 칸', nameEn: 'AMIR KHAN', nationality: 'NP' },
];

// ---------------------------------------------------------------------------
// Distribution configs for 1,000 students
// ---------------------------------------------------------------------------

// Nationality: VN 30%, CN 30%, UZ 10%, MN 10%, Other 20%
type NationalityEntry = { code: string; weight: number };
const NATIONALITY_DIST: NationalityEntry[] = [
  { code: 'VN', weight: 0.30 },
  { code: 'CN', weight: 0.30 },
  { code: 'UZ', weight: 0.10 },
  { code: 'MN', weight: 0.10 },
];
const OTHER_NATIONALITIES = ['NP', 'BD', 'PH', 'ID', 'MM', 'KH', 'LK', 'PK'];

// Enrollment: ENROLLED 75%, ON_LEAVE 10%, GRADUATED 5%, EXPELLED 3%, WITHDRAWN 3%, UNREGISTERED 4%
type EnrollmentEntry = { status: 'ENROLLED' | 'ON_LEAVE' | 'GRADUATED' | 'EXPELLED' | 'WITHDRAWN' | 'UNREGISTERED'; weight: number };
const ENROLLMENT_DIST: EnrollmentEntry[] = [
  { status: 'ENROLLED', weight: 0.75 },
  { status: 'ON_LEAVE', weight: 0.10 },
  { status: 'GRADUATED', weight: 0.05 },
  { status: 'EXPELLED', weight: 0.03 },
  { status: 'WITHDRAWN', weight: 0.03 },
  { status: 'UNREGISTERED', weight: 0.04 },
];

// Visa status: ACTIVE 70%, EXPIRING_SOON 15%, EXPIRED 10%, REVOKED 5%
type VisaStatusEntry = { status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'REVOKED'; weight: number };
const VISA_STATUS_DIST: VisaStatusEntry[] = [
  { status: 'ACTIVE', weight: 0.70 },
  { status: 'EXPIRING_SOON', weight: 0.15 },
  { status: 'EXPIRED', weight: 0.10 },
  { status: 'REVOKED', weight: 0.05 },
];

// Visa types: D_2_2 40%, D_2_3 20%, D_2_6 10%, D_4_1 20%, D_4_7 10%
type VisaTypeEntry = { type: 'D_2_2' | 'D_2_3' | 'D_2_6' | 'D_4_1' | 'D_4_7'; weight: number };
const VISA_TYPE_DIST: VisaTypeEntry[] = [
  { type: 'D_2_2', weight: 0.40 },
  { type: 'D_2_3', weight: 0.20 },
  { type: 'D_2_6', weight: 0.10 },
  { type: 'D_4_1', weight: 0.20 },
  { type: 'D_4_7', weight: 0.10 },
];

// Insurance: ACTIVE 60%, EXPIRING 15%, EXPIRED 10%, NONE 15%
type InsuranceEntry = { status: 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'NONE'; weight: number };
const INSURANCE_DIST: InsuranceEntry[] = [
  { status: 'ACTIVE', weight: 0.60 },
  { status: 'EXPIRING', weight: 0.15 },
  { status: 'EXPIRED', weight: 0.10 },
  { status: 'NONE', weight: 0.15 },
];

// Program type mapping from visa type
const VISA_TO_PROGRAM: Record<string, 'ASSOCIATE' | 'BACHELOR' | 'MASTER' | 'DOCTORATE' | 'LANGUAGE'> = {
  D_2_2: 'BACHELOR',
  D_2_3: 'MASTER',
  D_2_6: 'BACHELOR', // exchange students usually bachelor level
  D_4_1: 'LANGUAGE',
  D_4_7: 'LANGUAGE',
};

// ---------------------------------------------------------------------------
// Weighted random selection
// ---------------------------------------------------------------------------
function weightedPick<T extends { weight: number }>(dist: T[]): T {
  const r = Math.random();
  let cumulative = 0;
  for (const entry of dist) {
    cumulative += entry.weight;
    if (r < cumulative) return entry;
  }
  return dist[dist.length - 1];
}

// ---------------------------------------------------------------------------
// Name lookup by nationality and index (cycle with modulo)
// ---------------------------------------------------------------------------
function getNameForNationality(nationality: string, idx: number): { nameKr: string; nameEn: string } {
  switch (nationality) {
    case 'VN': return NAMES_VN[idx % NAMES_VN.length];
    case 'CN': return NAMES_CN[idx % NAMES_CN.length];
    case 'UZ': return NAMES_UZ[idx % NAMES_UZ.length];
    case 'MN': return NAMES_MN[idx % NAMES_MN.length];
    default:   return NAMES_OTHER[idx % NAMES_OTHER.length];
  }
}

// ---------------------------------------------------------------------------
// Generate passport/ARC numbers
// ---------------------------------------------------------------------------
function genPassport(nationality: string, idx: number): string {
  const prefix: Record<string, string> = { VN: 'B', CN: 'E', UZ: 'AA', MN: 'E', NP: 'PA', BD: 'BK', PH: 'P', ID: 'A', MM: 'M', KH: 'K', LK: 'N', PK: 'AB' };
  const p = prefix[nationality] ?? 'M';
  return `${p}${String(idx + 1).padStart(7, '0')}`;
}

function genArc(idx: number): string | null {
  // ~60% of students have an ARC
  if (idx % 10 >= 6) return null;
  const first6 = String(900101 + idx * 11).slice(0, 6);
  const last7 = String(1000000 + idx * 137).slice(0, 7);
  return `${first6}-${last7}`;
}

// ---------------------------------------------------------------------------
// Generate visa expiry based on status
// Spread from 30 days ago to 365 days ahead
// ---------------------------------------------------------------------------
const TODAY = new Date('2026-02-16');

function genVisaExpiry(visaStatus: string): Date {
  switch (visaStatus) {
    case 'EXPIRED':
      // 30 days ago to yesterday
      return randomDate(new Date('2026-01-17'), new Date('2026-02-15'));
    case 'REVOKED':
      return randomDate(new Date('2025-09-01'), new Date('2026-02-15'));
    case 'EXPIRING_SOON':
      // Within next 60 days
      return randomDate(new Date('2026-02-17'), new Date('2026-04-17'));
    case 'ACTIVE':
    default:
      // 60 days to 365 days ahead
      return randomDate(new Date('2026-04-18'), new Date('2027-02-16'));
  }
}

// ---------------------------------------------------------------------------
// Generate insurance expiry based on status
// ---------------------------------------------------------------------------
function genInsuranceExpiry(status: string): Date | null {
  switch (status) {
    case 'ACTIVE':
      return randomDate(new Date('2026-06-01'), new Date('2027-06-01'));
    case 'EXPIRING':
      return randomDate(new Date('2026-02-17'), new Date('2026-04-15'));
    case 'EXPIRED':
      return randomDate(new Date('2025-06-01'), new Date('2026-02-15'));
    case 'NONE':
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Counters for tracking per-nationality indices (for name cycling)
// ---------------------------------------------------------------------------
const nationalityCounters: Record<string, number> = {};

function getNextNameIdx(nationality: string): number {
  if (!(nationality in nationalityCounters)) {
    nationalityCounters[nationality] = 0;
  }
  return nationalityCounters[nationality]++;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const startTime = performance.now();
  console.log('=== Large Seed: 1,000 Students ===');
  console.log('');

  // -----------------------------------------------------------------------
  // 1. Look up or create university + users
  // -----------------------------------------------------------------------
  let university = await prisma.university.findFirst({
    where: { name: '호서대학교' },
  });

  let adminUser: { id: string };
  let managerUser: { id: string };
  let viewerUser: { id: string };

  if (university) {
    console.log(`   Found existing university: ${university.name} (${university.id})`);

    // Look up existing users
    const existingAdmin = await prisma.user.findFirst({
      where: { universityId: university.id, role: 'ADMIN' },
    });
    const existingManager = await prisma.user.findFirst({
      where: { universityId: university.id, role: 'MANAGER' },
    });
    const existingViewer = await prisma.user.findFirst({
      where: { universityId: university.id, role: 'VIEWER' },
    });

    if (!existingAdmin || !existingManager || !existingViewer) {
      throw new Error('Expected 3 users (ADMIN, MANAGER, VIEWER) for the university');
    }

    adminUser = existingAdmin;
    managerUser = existingManager;
    viewerUser = existingViewer;
    console.log('   Using existing users');
  } else {
    university = await prisma.university.create({
      data: {
        name: '호서대학교',
        region: '충남 아산',
        ieqasStatus: 'CERTIFIED',
        overstayRate: 1.2,
        planType: 'STANDARD',
        contractStart: new Date('2026-01-01'),
        contractEnd: new Date('2026-12-31'),
        fimsTemplateVersion: 'v2.1',
      },
    });
    console.log(`   Created university: ${university.name}`);

    adminUser = await prisma.user.create({
      data: {
        universityId: university.id,
        email: 'admin@hoseo.edu',
        name: '김현정',
        hashedPassword: bcrypt.hashSync('admin1234!', 10),
        role: 'ADMIN',
        isActive: true,
        lastLogin: new Date('2026-02-14T09:00:00Z'),
      },
    });

    managerUser = await prisma.user.create({
      data: {
        universityId: university.id,
        email: 'manager@hoseo.edu',
        name: '박지수',
        hashedPassword: bcrypt.hashSync('manager1234!', 10),
        role: 'MANAGER',
        isActive: true,
        lastLogin: new Date('2026-02-13T14:30:00Z'),
      },
    });

    viewerUser = await prisma.user.create({
      data: {
        universityId: university.id,
        email: 'viewer@hoseo.edu',
        name: '이민호',
        hashedPassword: bcrypt.hashSync('viewer1234!', 10),
        role: 'VIEWER',
        isActive: true,
        lastLogin: new Date('2026-02-10T11:00:00Z'),
      },
    });

    console.log('   Created 3 users');
  }

  // -----------------------------------------------------------------------
  // 2. Delete existing students + related data for this university
  // -----------------------------------------------------------------------
  console.log('   Deleting existing data for university...');

  // Get existing student IDs for this university
  const existingStudents = await prisma.student.findMany({
    where: { universityId: university.id },
    select: { id: true },
  });
  const existingStudentIds = existingStudents.map((s) => s.id);

  if (existingStudentIds.length > 0) {
    // Delete in dependency order: statusChanges, fimsReports, alertLogs, then students
    await prisma.statusChange.deleteMany({
      where: { studentId: { in: existingStudentIds } },
    });
    await prisma.fimsReport.deleteMany({
      where: { studentId: { in: existingStudentIds } },
    });
    await prisma.alertLog.deleteMany({
      where: { studentId: { in: existingStudentIds } },
    });
    await prisma.student.deleteMany({
      where: { universityId: university.id },
    });
    console.log(`   Deleted ${existingStudentIds.length} existing students and related data`);
  } else {
    // Also delete any orphaned alertLogs for this university's users
    await prisma.alertLog.deleteMany({
      where: { userId: { in: [adminUser.id, managerUser.id, viewerUser.id] } },
    });
    console.log('   No existing students found');
  }

  // -----------------------------------------------------------------------
  // 3. Generate 1,000 students with createMany (batches of 100)
  // -----------------------------------------------------------------------
  console.log('   Generating 1,000 students...');
  const studentGenStart = performance.now();

  const TOTAL_STUDENTS = 1000;
  const BATCH_SIZE = 100;

  for (let batch = 0; batch < TOTAL_STUDENTS / BATCH_SIZE; batch++) {
    const batchData: Prisma.StudentCreateManyInput[] = [];

    for (let j = 0; j < BATCH_SIZE; j++) {
      const i = batch * BATCH_SIZE + j;

      // Nationality
      let nationality: string;
      const natRoll = Math.random();
      if (natRoll < 0.30) {
        nationality = 'VN';
      } else if (natRoll < 0.60) {
        nationality = 'CN';
      } else if (natRoll < 0.70) {
        nationality = 'UZ';
      } else if (natRoll < 0.80) {
        nationality = 'MN';
      } else {
        nationality = pick(OTHER_NATIONALITIES);
      }

      // Name (cycle through with per-nationality counter)
      const nameIdx = getNextNameIdx(nationality);
      const names = getNameForNationality(nationality, nameIdx);

      // Enrollment status
      const enrollment = weightedPick(ENROLLMENT_DIST).status;

      // Visa status
      const visaStatus = weightedPick(VISA_STATUS_DIST).status;

      // Visa type
      const visaType = weightedPick(VISA_TYPE_DIST).type;

      // Program type derived from visa type
      const programType = VISA_TO_PROGRAM[visaType];

      // Insurance status
      const insuranceStatus = weightedPick(INSURANCE_DIST).status;

      // PII: 80% have passportNumber, 60% have arcNumber
      const hasPassport = Math.random() < 0.80;
      const hasArc = Math.random() < 0.60;
      const passportNum = hasPassport ? genPassport(nationality, i) : null;
      const arcNum = hasArc ? genArc(i) : null;

      // Dates
      const visaExpiry = genVisaExpiry(visaStatus);
      const passportExpiry = hasPassport ? randomDate(new Date('2027-01-01'), new Date('2032-12-31')) : null;
      const insuranceExpiry = genInsuranceExpiry(insuranceStatus);

      // Attendance: 10% null, rest normal distribution centered at 85 (stddev 10), clamped to 0-100
      let attendanceRate: number | null = null;
      if (Math.random() >= 0.10) {
        const raw = boxMuller(85, 10);
        attendanceRate = parseFloat(Math.max(0, Math.min(100, raw)).toFixed(1));
      }

      // GPA: 10% null, rest uniform 1.5–4.5
      const gpa = Math.random() < 0.10 ? null : parseFloat((1.5 + Math.random() * 3.0).toFixed(2));

      const hasPhone = Math.random() > 0.15;
      const hasEmail = Math.random() > 0.12;

      batchData.push({
        universityId: university.id,
        nameKr: names.nameKr,
        nameEn: names.nameEn,
        nationality,
        passportNumber: passportNum ? encrypt(passportNum) : null,
        passportExpiry,
        arcNumber: arcNum ? encrypt(arcNum) : null,
        visaType,
        visaExpiry,
        visaStatus,
        enrollmentStatus: enrollment,
        programType,
        department: DEPARTMENTS[i % DEPARTMENTS.length],
        semester: enrollment === 'ENROLLED' ? SEMESTERS[i % SEMESTERS.length] : null,
        attendanceRate,
        gpa,
        insuranceStatus,
        insuranceExpiry,
        address: i % 3 === 0 ? `충남 아산시 배방읍 호서로 ${79 + (i % 200)}` : null,
        addressReported: i % 3 === 0,
        phone: hasPhone ? `010-${String(1000 + (i % 9000)).padStart(4, '0')}-${String(1000 + ((i * 7) % 9000)).padStart(4, '0')}` : null,
        email: hasEmail ? `student${i + 1}@hoseo.edu` : null,
        partTimePermit: i % 8 === 0,
        partTimePermitExpiry: i % 8 === 0 ? new Date('2026-08-31') : null,
        isDeleted: false,
        createdById: adminUser.id,
        notes: i % 15 === 0 ? '출석률 관리 필요' : null,
      });
    }

    await prisma.student.createMany({ data: batchData });
    console.log(`   Batch ${batch + 1}/10 complete (${(batch + 1) * BATCH_SIZE} students)`);
  }

  const studentGenEnd = performance.now();
  console.log(`   Students created in ${((studentGenEnd - studentGenStart) / 1000).toFixed(2)}s`);

  // -----------------------------------------------------------------------
  // 4. Query students back to get IDs for AlertLog creation
  // -----------------------------------------------------------------------
  console.log('   Querying student IDs...');
  const allStudents = await prisma.student.findMany({
    where: { universityId: university.id },
    select: { id: true, visaStatus: true, enrollmentStatus: true, insuranceStatus: true, attendanceRate: true },
    orderBy: { createdAt: 'asc' },
  });
  console.log(`   Found ${allStudents.length} students`);

  // -----------------------------------------------------------------------
  // 5. Generate 200 AlertLog entries across students
  // -----------------------------------------------------------------------
  console.log('   Generating 200 alert logs...');
  const alertGenStart = performance.now();

  const alertTypes: Array<'VISA_EXPIRY' | 'ATTENDANCE_LOW' | 'FIMS_DEADLINE' | 'IEQAS_WARNING' | 'INSURANCE_EXPIRY' | 'DOCUMENT_REQUEST'> = [
    'VISA_EXPIRY',
    'ATTENDANCE_LOW',
    'FIMS_DEADLINE',
    'IEQAS_WARNING',
    'INSURANCE_EXPIRY',
    'DOCUMENT_REQUEST',
  ];

  const alertChannels: Array<'IN_APP' | 'EMAIL' | 'KAKAO' | 'SMS'> = [
    'IN_APP',
    'EMAIL',
    'KAKAO',
    'SMS',
  ];

  const alertTemplates: Record<string, { titles: string[]; messages: string[] }> = {
    VISA_EXPIRY: {
      titles: ['비자 만료 임박', '비자 만료 경고', '비자 만료'],
      messages: [
        '비자 만료까지 60일 미만입니다. 연장 신청을 안내해 주세요.',
        '비자 만료까지 30일 미만입니다. 즉시 확인이 필요합니다.',
        '비자가 만료되었습니다. 출입국관리사무소 방문이 필요합니다.',
        '비자 만료까지 45일 미만입니다. 연장 준비를 시작해 주세요.',
      ],
    },
    ATTENDANCE_LOW: {
      titles: ['출석률 저조 경고', '출석률 저조'],
      messages: [
        '출석률이 80% 미만입니다. 학생 면담이 필요합니다.',
        '출석률이 75% 미만으로 떨어졌습니다. 학사 경고 대상입니다.',
        '출석률이 70% 미만입니다. 비자 연장에 영향을 줄 수 있습니다.',
      ],
    },
    FIMS_DEADLINE: {
      titles: ['FIMS 변동신고 기한 임박', 'FIMS 변동신고 기한 초과', 'FIMS 정기보고 기한 안내'],
      messages: [
        '변동신고 기한까지 5일 남았습니다.',
        '변동신고 기한이 초과되었습니다. 즉시 처리가 필요합니다.',
        '정기보고 기한이 다가오고 있습니다. 보고서를 준비해 주세요.',
      ],
    },
    IEQAS_WARNING: {
      titles: ['IEQAS 불법체류율 경고', 'IEQAS 인증 주의'],
      messages: [
        '불법체류율이 1.5%를 초과했습니다. 주의가 필요합니다.',
        'IEQAS 인증 유지를 위해 불법체류율 관리가 필요합니다.',
      ],
    },
    INSURANCE_EXPIRY: {
      titles: ['보험 만료 임박', '보험 만료'],
      messages: [
        '건강보험 만료가 30일 이내입니다. 갱신을 안내해 주세요.',
        '건강보험이 만료되었습니다. 재가입이 필요합니다.',
      ],
    },
    DOCUMENT_REQUEST: {
      titles: ['서류 제출 요청', '서류 미비 알림'],
      messages: [
        '재학증명서 제출이 필요합니다.',
        '보험가입증명서가 미비합니다. 제출을 요청해 주세요.',
        '외국인등록증 사본 제출이 필요합니다.',
      ],
    },
  };

  const alertLogData: Prisma.AlertLogCreateManyInput[] = [];

  for (let a = 0; a < 200; a++) {
    const student = allStudents[Math.floor(Math.random() * allStudents.length)];
    const alertType = pick(alertTypes);
    const channel = pick(alertChannels);
    const template = alertTemplates[alertType];
    const title = pick(template.titles);
    const message = pick(template.messages);
    const isRead = Math.random() < 0.4;
    const sentAt = randomDate(new Date('2026-01-01'), new Date('2026-02-16'));

    alertLogData.push({
      studentId: student.id,
      userId: pick([adminUser.id, managerUser.id]),
      type: alertType,
      channel,
      title,
      message,
      isRead,
      sentAt,
      readAt: isRead ? new Date(sentAt.getTime() + Math.random() * 86400000) : null,
    });
  }

  await prisma.alertLog.createMany({ data: alertLogData });

  const alertGenEnd = performance.now();
  console.log(`   Alert logs created in ${((alertGenEnd - alertGenStart) / 1000).toFixed(2)}s`);

  // -----------------------------------------------------------------------
  // 6. Summary
  // -----------------------------------------------------------------------
  const totalTime = performance.now() - startTime;
  console.log('');
  console.log('=== Seed Complete ===');
  console.log(`   University: 1 (호서대학교)`);
  console.log(`   Users: 3`);
  console.log(`   Students: ${allStudents.length}`);
  console.log(`   Alert Logs: 200`);
  console.log(`   Total time: ${(totalTime / 1000).toFixed(2)}s`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
