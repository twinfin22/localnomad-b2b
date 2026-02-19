import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
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
// Student templates: 50 students with deterministic distributions
// ---------------------------------------------------------------------------

interface StudentTemplate {
  nationality: string;
  nameIdx: number;
  visaType: 'D_2_1' | 'D_2_2' | 'D_2_3' | 'D_2_4' | 'D_2_6' | 'D_4_1' | 'D_4_7';
  programType: 'ASSOCIATE' | 'BACHELOR' | 'MASTER' | 'DOCTORATE' | 'LANGUAGE';
  enrollmentStatus: 'ENROLLED' | 'ON_LEAVE' | 'EXPELLED' | 'WITHDRAWN' | 'GRADUATED' | 'UNREGISTERED';
  visaStatus: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'REVOKED';
  insuranceStatus: 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'NONE';
}

// Build 50 templates with the required distributions
const studentTemplates: StudentTemplate[] = [
  // VN — 20 students (40%)
  { nationality: 'VN', nameIdx: 0,  visaType: 'D_2_2', programType: 'BACHELOR',  enrollmentStatus: 'ENROLLED',     visaStatus: 'ACTIVE',         insuranceStatus: 'ACTIVE' },
  { nationality: 'VN', nameIdx: 1,  visaType: 'D_2_2', programType: 'BACHELOR',  enrollmentStatus: 'ENROLLED',     visaStatus: 'ACTIVE',         insuranceStatus: 'ACTIVE' },
  { nationality: 'VN', nameIdx: 2,  visaType: 'D_2_2', programType: 'BACHELOR',  enrollmentStatus: 'ENROLLED',     visaStatus: 'ACTIVE',         insuranceStatus: 'EXPIRING' },
  { nationality: 'VN', nameIdx: 3,  visaType: 'D_2_3', programType: 'MASTER',    enrollmentStatus: 'ENROLLED',     visaStatus: 'ACTIVE',         insuranceStatus: 'ACTIVE' },
  { nationality: 'VN', nameIdx: 4,  visaType: 'D_2_3', programType: 'MASTER',    enrollmentStatus: 'ENROLLED',     visaStatus: 'EXPIRING_SOON',  insuranceStatus: 'ACTIVE' },
  { nationality: 'VN', nameIdx: 5,  visaType: 'D_4_1', programType: 'LANGUAGE',  enrollmentStatus: 'ENROLLED',     visaStatus: 'ACTIVE',         insuranceStatus: 'NONE' },
  { nationality: 'VN', nameIdx: 6,  visaType: 'D_4_1', programType: 'LANGUAGE',  enrollmentStatus: 'ENROLLED',     visaStatus: 'ACTIVE',         insuranceStatus: 'ACTIVE' },
  { nationality: 'VN', nameIdx: 7,  visaType: 'D_2_2', programType: 'BACHELOR',  enrollmentStatus: 'ENROLLED',     visaStatus: 'EXPIRING_SOON',  insuranceStatus: 'EXPIRING' },
  { nationality: 'VN', nameIdx: 8,  visaType: 'D_2_2', programType: 'BACHELOR',  enrollmentStatus: 'ON_LEAVE',     visaStatus: 'ACTIVE',         insuranceStatus: 'EXPIRED' },
  { nationality: 'VN', nameIdx: 9,  visaType: 'D_2_2', programType: 'BACHELOR',  enrollmentStatus: 'ENROLLED',     visaStatus: 'ACTIVE',         insuranceStatus: 'ACTIVE' },
  { nationality: 'VN', nameIdx: 10, visaType: 'D_2_2', programType: 'BACHELOR',  enrollmentStatus: 'ENROLLED',     visaStatus: 'ACTIVE',         insuranceStatus: 'ACTIVE' },
  { nationality: 'VN', nameIdx: 11, visaType: 'D_2_3', programType: 'MASTER',    enrollmentStatus: 'ENROLLED',     visaStatus: 'ACTIVE',         insuranceStatus: 'NONE' },
  { nationality: 'VN', nameIdx: 12, visaType: 'D_2_2', programType: 'BACHELOR',  enrollmentStatus: 'ENROLLED',     visaStatus: 'EXPIRED',        insuranceStatus: 'EXPIRED' },
  { nationality: 'VN', nameIdx: 13, visaType: 'D_2_2', programType: 'BACHELOR',  enrollmentStatus: 'WITHDRAWN',    visaStatus: 'EXPIRED',        insuranceStatus: 'NONE' },
  { nationality: 'VN', nameIdx: 14, visaType: 'D_2_2', programType: 'BACHELOR',  enrollmentStatus: 'ENROLLED',     visaStatus: 'ACTIVE',         insuranceStatus: 'ACTIVE' },
  { nationality: 'VN', nameIdx: 15, visaType: 'D_4_1', programType: 'LANGUAGE',  enrollmentStatus: 'ENROLLED',     visaStatus: 'EXPIRING_SOON',  insuranceStatus: 'ACTIVE' },
  { nationality: 'VN', nameIdx: 16, visaType: 'D_2_2', programType: 'BACHELOR',  enrollmentStatus: 'ENROLLED',     visaStatus: 'ACTIVE',         insuranceStatus: 'ACTIVE' },
  { nationality: 'VN', nameIdx: 17, visaType: 'D_2_1', programType: 'ASSOCIATE', enrollmentStatus: 'ENROLLED',     visaStatus: 'ACTIVE',         insuranceStatus: 'EXPIRING' },
  { nationality: 'VN', nameIdx: 18, visaType: 'D_2_2', programType: 'BACHELOR',  enrollmentStatus: 'GRADUATED',    visaStatus: 'EXPIRED',        insuranceStatus: 'EXPIRED' },
  { nationality: 'VN', nameIdx: 19, visaType: 'D_2_2', programType: 'BACHELOR',  enrollmentStatus: 'ENROLLED',     visaStatus: 'ACTIVE',         insuranceStatus: 'ACTIVE' },

  // CN — 13 students (26%)
  { nationality: 'CN', nameIdx: 0,  visaType: 'D_2_2', programType: 'BACHELOR',  enrollmentStatus: 'ENROLLED',     visaStatus: 'ACTIVE',         insuranceStatus: 'ACTIVE' },
  { nationality: 'CN', nameIdx: 1,  visaType: 'D_2_3', programType: 'MASTER',    enrollmentStatus: 'ENROLLED',     visaStatus: 'ACTIVE',         insuranceStatus: 'ACTIVE' },
  { nationality: 'CN', nameIdx: 2,  visaType: 'D_2_2', programType: 'BACHELOR',  enrollmentStatus: 'ENROLLED',     visaStatus: 'ACTIVE',         insuranceStatus: 'EXPIRING' },
  { nationality: 'CN', nameIdx: 3,  visaType: 'D_2_4', programType: 'DOCTORATE', enrollmentStatus: 'ENROLLED',     visaStatus: 'ACTIVE',         insuranceStatus: 'ACTIVE' },
  { nationality: 'CN', nameIdx: 4,  visaType: 'D_2_2', programType: 'BACHELOR',  enrollmentStatus: 'ENROLLED',     visaStatus: 'EXPIRING_SOON',  insuranceStatus: 'ACTIVE' },
  { nationality: 'CN', nameIdx: 5,  visaType: 'D_4_1', programType: 'LANGUAGE',  enrollmentStatus: 'ENROLLED',     visaStatus: 'ACTIVE',         insuranceStatus: 'NONE' },
  { nationality: 'CN', nameIdx: 6,  visaType: 'D_2_2', programType: 'BACHELOR',  enrollmentStatus: 'ON_LEAVE',     visaStatus: 'ACTIVE',         insuranceStatus: 'EXPIRED' },
  { nationality: 'CN', nameIdx: 7,  visaType: 'D_2_3', programType: 'MASTER',    enrollmentStatus: 'ENROLLED',     visaStatus: 'ACTIVE',         insuranceStatus: 'ACTIVE' },
  { nationality: 'CN', nameIdx: 8,  visaType: 'D_2_2', programType: 'BACHELOR',  enrollmentStatus: 'ENROLLED',     visaStatus: 'ACTIVE',         insuranceStatus: 'ACTIVE' },
  { nationality: 'CN', nameIdx: 9,  visaType: 'D_2_6', programType: 'BACHELOR',  enrollmentStatus: 'ENROLLED',     visaStatus: 'EXPIRING_SOON',  insuranceStatus: 'ACTIVE' },
  { nationality: 'CN', nameIdx: 10, visaType: 'D_2_2', programType: 'BACHELOR',  enrollmentStatus: 'ENROLLED',     visaStatus: 'ACTIVE',         insuranceStatus: 'ACTIVE' },
  { nationality: 'CN', nameIdx: 11, visaType: 'D_2_3', programType: 'MASTER',    enrollmentStatus: 'EXPELLED',     visaStatus: 'REVOKED',        insuranceStatus: 'NONE' },
  { nationality: 'CN', nameIdx: 12, visaType: 'D_2_2', programType: 'BACHELOR',  enrollmentStatus: 'ENROLLED',     visaStatus: 'ACTIVE',         insuranceStatus: 'ACTIVE' },

  // UZ — 7 students (14%)
  { nationality: 'UZ', nameIdx: 0,  visaType: 'D_2_2', programType: 'BACHELOR',  enrollmentStatus: 'ENROLLED',     visaStatus: 'ACTIVE',         insuranceStatus: 'ACTIVE' },
  { nationality: 'UZ', nameIdx: 1,  visaType: 'D_4_1', programType: 'LANGUAGE',  enrollmentStatus: 'ENROLLED',     visaStatus: 'ACTIVE',         insuranceStatus: 'EXPIRING' },
  { nationality: 'UZ', nameIdx: 2,  visaType: 'D_2_2', programType: 'BACHELOR',  enrollmentStatus: 'ENROLLED',     visaStatus: 'ACTIVE',         insuranceStatus: 'ACTIVE' },
  { nationality: 'UZ', nameIdx: 3,  visaType: 'D_2_3', programType: 'MASTER',    enrollmentStatus: 'ON_LEAVE',     visaStatus: 'ACTIVE',         insuranceStatus: 'EXPIRED' },
  { nationality: 'UZ', nameIdx: 4,  visaType: 'D_2_2', programType: 'BACHELOR',  enrollmentStatus: 'ENROLLED',     visaStatus: 'EXPIRING_SOON',  insuranceStatus: 'ACTIVE' },
  { nationality: 'UZ', nameIdx: 5,  visaType: 'D_2_2', programType: 'BACHELOR',  enrollmentStatus: 'ENROLLED',     visaStatus: 'ACTIVE',         insuranceStatus: 'ACTIVE' },
  { nationality: 'UZ', nameIdx: 6,  visaType: 'D_2_2', programType: 'BACHELOR',  enrollmentStatus: 'UNREGISTERED', visaStatus: 'REVOKED',        insuranceStatus: 'NONE' },

  // MN — 5 students (10%)
  { nationality: 'MN', nameIdx: 0,  visaType: 'D_2_2', programType: 'BACHELOR',  enrollmentStatus: 'ENROLLED',     visaStatus: 'ACTIVE',         insuranceStatus: 'ACTIVE' },
  { nationality: 'MN', nameIdx: 1,  visaType: 'D_2_3', programType: 'MASTER',    enrollmentStatus: 'ENROLLED',     visaStatus: 'ACTIVE',         insuranceStatus: 'ACTIVE' },
  { nationality: 'MN', nameIdx: 2,  visaType: 'D_4_1', programType: 'LANGUAGE',  enrollmentStatus: 'ENROLLED',     visaStatus: 'EXPIRING_SOON',  insuranceStatus: 'EXPIRING' },
  { nationality: 'MN', nameIdx: 3,  visaType: 'D_2_2', programType: 'BACHELOR',  enrollmentStatus: 'ON_LEAVE',     visaStatus: 'ACTIVE',         insuranceStatus: 'EXPIRED' },
  { nationality: 'MN', nameIdx: 4,  visaType: 'D_2_2', programType: 'BACHELOR',  enrollmentStatus: 'GRADUATED',    visaStatus: 'EXPIRED',        insuranceStatus: 'EXPIRED' },

  // Other — 5 students (10%) — NO passport data (위탁계약 미체결 상태 시뮬레이션)
  { nationality: 'NP', nameIdx: 0,  visaType: 'D_2_2', programType: 'BACHELOR',  enrollmentStatus: 'ENROLLED',     visaStatus: 'ACTIVE',         insuranceStatus: 'ACTIVE' },
  { nationality: 'BD', nameIdx: 1,  visaType: 'D_2_2', programType: 'BACHELOR',  enrollmentStatus: 'ENROLLED',     visaStatus: 'ACTIVE',         insuranceStatus: 'NONE' },
  { nationality: 'PH', nameIdx: 2,  visaType: 'D_4_7', programType: 'LANGUAGE',  enrollmentStatus: 'ENROLLED',     visaStatus: 'EXPIRING_SOON',  insuranceStatus: 'ACTIVE' },
  { nationality: 'ID', nameIdx: 3,  visaType: 'D_2_2', programType: 'BACHELOR',  enrollmentStatus: 'ENROLLED',     visaStatus: 'ACTIVE',         insuranceStatus: 'ACTIVE' },
  { nationality: 'NP', nameIdx: 4,  visaType: 'D_2_3', programType: 'MASTER',    enrollmentStatus: 'ENROLLED',     visaStatus: 'ACTIVE',         insuranceStatus: 'EXPIRING' },
];

// ---------------------------------------------------------------------------
// Name lookup
// ---------------------------------------------------------------------------
function getNameForTemplate(t: StudentTemplate): { nameKr: string; nameEn: string } {
  switch (t.nationality) {
    case 'VN': return NAMES_VN[t.nameIdx % NAMES_VN.length];
    case 'CN': return NAMES_CN[t.nameIdx % NAMES_CN.length];
    case 'UZ': return NAMES_UZ[t.nameIdx % NAMES_UZ.length];
    case 'MN': return NAMES_MN[t.nameIdx % NAMES_MN.length];
    default:   return NAMES_OTHER[t.nameIdx % NAMES_OTHER.length];
  }
}

// ---------------------------------------------------------------------------
// Generate passport/ARC numbers
// ---------------------------------------------------------------------------
function genPassport(nationality: string, idx: number): string {
  const prefix: Record<string, string> = { VN: 'B', CN: 'E', UZ: 'AA', MN: 'E', NP: 'PA', BD: 'BK', PH: 'P', ID: 'A' };
  const p = prefix[nationality] ?? 'M';
  return `${p}${String(idx + 1).padStart(7, '0')}`;
}

function genArc(idx: number): string | null {
  // ~70% of students have an ARC
  if (idx % 10 >= 7) return null;
  const first6 = String(900101 + idx * 11).slice(0, 6);
  const last7 = String(1000000 + idx * 137).slice(0, 7);
  return `${first6}-${last7}`;
}

// ---------------------------------------------------------------------------
// Generate visa expiry based on status
// ---------------------------------------------------------------------------
const TODAY = new Date('2026-02-15');

function genVisaExpiry(visaStatus: string): Date {
  switch (visaStatus) {
    case 'EXPIRED':
      return randomDate(new Date('2025-06-01'), new Date('2026-02-14'));
    case 'REVOKED':
      return randomDate(new Date('2025-09-01'), new Date('2026-02-14'));
    case 'EXPIRING_SOON':
      return randomDate(new Date('2026-02-16'), new Date('2026-04-15'));
    case 'ACTIVE':
    default:
      return randomDate(new Date('2026-06-01'), new Date('2028-02-15'));
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
      return randomDate(new Date('2026-02-16'), new Date('2026-04-15'));
    case 'EXPIRED':
      return randomDate(new Date('2025-06-01'), new Date('2026-02-14'));
    case 'NONE':
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data in reverse dependency order
  await prisma.statusChange.deleteMany();
  await prisma.fimsReport.deleteMany();
  await prisma.alertLog.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();
  await prisma.university.deleteMany();

  // -----------------------------------------------------------------------
  // 1. University
  // -----------------------------------------------------------------------
  const university = await prisma.university.create({
    data: {
      name: '비캠대학교',
      region: '서울 성동구',
      ieqasStatus: 'CERTIFIED',
      overstayRate: 1.2,
      planType: 'STANDARD',
      contractStart: new Date('2026-01-01'),
      contractEnd: new Date('2026-12-31'),
      fimsTemplateVersion: 'v2.1',
    },
  });
  console.log(`   ✓ University created: ${university.name}`);

  // -----------------------------------------------------------------------
  // 2. Users
  // -----------------------------------------------------------------------
  const adminUser = await prisma.user.create({
    data: {
      universityId: university.id,
      email: 'admin@visacampus.org',
      name: '김현정',
      hashedPassword: bcrypt.hashSync('admin1234!', 10),
      role: 'ADMIN',
      isActive: true,
      lastLogin: new Date('2026-02-14T09:00:00Z'),
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      universityId: university.id,
      email: 'manager@visacampus.org',
      name: '박지수',
      hashedPassword: bcrypt.hashSync('manager1234!', 10),
      role: 'MANAGER',
      isActive: true,
      lastLogin: new Date('2026-02-13T14:30:00Z'),
    },
  });

  const viewerUser = await prisma.user.create({
    data: {
      universityId: university.id,
      email: 'viewer@visacampus.org',
      name: '이민호',
      hashedPassword: bcrypt.hashSync('viewer1234!', 10),
      role: 'VIEWER',
      isActive: true,
      lastLogin: new Date('2026-02-10T11:00:00Z'),
    },
  });

  // Test account (test@visacampus.org / test1234)
  await prisma.user.create({
    data: {
      universityId: university.id,
      email: 'test@visacampus.org',
      name: '테스트관리자',
      hashedPassword: bcrypt.hashSync('test1234', 10),
      role: 'ADMIN',
      isActive: true,
      lastLogin: new Date('2026-02-15T10:00:00Z'),
    },
  });

  console.log('   ✓ Users created: 4 (including test account)');

  // -----------------------------------------------------------------------
  // 3. Students (50)
  // -----------------------------------------------------------------------
  const students: { id: string; enrollmentStatus: string; visaStatus: string; nameEn: string }[] = [];

  for (let i = 0; i < studentTemplates.length; i++) {
    const t = studentTemplates[i];
    const names = getNameForTemplate(t);
    // Indices 45-49 (Other group): no passport data — simulates pre-위탁계약 onboarding
    const noPassport = i >= 45;
    const passportNum = noPassport ? null : genPassport(t.nationality, i);
    const arcNum = genArc(i);
    const visaExpiry = genVisaExpiry(t.visaStatus);
    const passportExpiry = noPassport ? null : randomDate(new Date('2027-01-01'), new Date('2032-12-31'));
    const insuranceExpiry = genInsuranceExpiry(t.insuranceStatus);

    // attendanceRate: 70-100, some null (~10%)
    const attendanceRate = i % 10 === 0 ? null : parseFloat((70 + Math.random() * 30).toFixed(1));
    // gpa: 1.5-4.5, some null (~10%)
    const gpa = i % 10 === 5 ? null : parseFloat((1.5 + Math.random() * 3.0).toFixed(2));

    const hasPhone = i % 5 !== 0;
    const hasEmail = i % 7 !== 0;

    const student = await prisma.student.create({
      data: {
        universityId: university.id,
        nameKr: names.nameKr,
        nameEn: names.nameEn,
        nationality: t.nationality,
        passportNumber: passportNum ? encrypt(passportNum) : null,
        passportExpiry,  // null for noPassport students
        arcNumber: arcNum ? encrypt(arcNum) : null,
        visaType: t.visaType,
        visaExpiry,
        visaStatus: t.visaStatus,
        enrollmentStatus: t.enrollmentStatus,
        programType: t.programType,
        department: DEPARTMENTS[i % DEPARTMENTS.length],
        semester: t.enrollmentStatus === 'ENROLLED' ? SEMESTERS[i % SEMESTERS.length] : null,
        attendanceRate,
        gpa,
        insuranceStatus: t.insuranceStatus,
        insuranceExpiry,
        address: i % 3 === 0 ? `서울 성동구 왕십리로 ${79 + i}` : null,
        addressReported: i % 3 === 0,
        phone: hasPhone ? `010-${String(1000 + i).slice(0, 4)}-${String(5000 + i * 7).slice(0, 4)}` : null,
        email: hasEmail ? `student${i + 1}@visacampus.org` : null,
        partTimePermit: i % 8 === 0,
        partTimePermitExpiry: i % 8 === 0 ? new Date('2026-08-31') : null,
        isDeleted: false,
        createdById: adminUser.id,
        notes: i % 10 === 0 ? '출석률 관리 필요' : null,
      },
    });

    students.push({
      id: student.id,
      enrollmentStatus: t.enrollmentStatus,
      visaStatus: t.visaStatus,
      nameEn: names.nameEn,
    });
  }

  console.log(`   ✓ Students created: ${students.length}`);

  // -----------------------------------------------------------------------
  // 4. Alert Logs (10)
  // -----------------------------------------------------------------------
  const alertData: {
    studentIdx: number;
    type: 'VISA_EXPIRY' | 'ATTENDANCE_LOW' | 'FIMS_DEADLINE' | 'IEQAS_WARNING' | 'INSURANCE_EXPIRY' | 'DOCUMENT_REQUEST';
    channel: 'IN_APP' | 'EMAIL' | 'KAKAO' | 'SMS';
    title: string;
    message: string;
    isRead: boolean;
    sentAt: Date;
  }[] = [
    {
      studentIdx: 7,
      type: 'VISA_EXPIRY',
      channel: 'IN_APP',
      title: '비자 만료 임박',
      message: '비자 만료까지 60일 미만입니다. 연장 신청을 안내해 주세요.',
      isRead: true,
      sentAt: new Date('2026-02-10T09:00:00Z'),
    },
    {
      studentIdx: 4,
      type: 'VISA_EXPIRY',
      channel: 'EMAIL',
      title: '비자 만료 임박',
      message: '비자 만료까지 45일 미만입니다. 즉시 확인이 필요합니다.',
      isRead: true,
      sentAt: new Date('2026-02-08T10:30:00Z'),
    },
    {
      studentIdx: 12,
      type: 'VISA_EXPIRY',
      channel: 'IN_APP',
      title: '비자 만료',
      message: '비자가 만료되었습니다. 출입국관리사무소 방문이 필요합니다.',
      isRead: false,
      sentAt: new Date('2026-02-14T08:00:00Z'),
    },
    {
      studentIdx: 0,
      type: 'ATTENDANCE_LOW',
      channel: 'IN_APP',
      title: '출석률 저조 경고',
      message: '출석률이 80% 미만입니다. 학생 면담이 필요합니다.',
      isRead: false,
      sentAt: new Date('2026-02-12T14:00:00Z'),
    },
    {
      studentIdx: 8,
      type: 'ATTENDANCE_LOW',
      channel: 'KAKAO',
      title: '출석률 저조',
      message: '출석률이 75% 미만으로 떨어졌습니다. 학사 경고 대상입니다.',
      isRead: true,
      sentAt: new Date('2026-02-05T11:00:00Z'),
    },
    {
      studentIdx: 13,
      type: 'FIMS_DEADLINE',
      channel: 'IN_APP',
      title: 'FIMS 변동신고 기한 임박',
      message: '자퇴 변동신고 기한까지 5일 남았습니다.',
      isRead: false,
      sentAt: new Date('2026-02-13T09:00:00Z'),
    },
    {
      studentIdx: 31,
      type: 'FIMS_DEADLINE',
      channel: 'EMAIL',
      title: 'FIMS 변동신고 기한 초과',
      message: '제적 변동신고 기한이 초과되었습니다. 즉시 처리가 필요합니다.',
      isRead: false,
      sentAt: new Date('2026-02-14T16:00:00Z'),
    },
    {
      studentIdx: 2,
      type: 'INSURANCE_EXPIRY',
      channel: 'IN_APP',
      title: '보험 만료 임박',
      message: '건강보험 만료가 30일 이내입니다. 갱신을 안내해 주세요.',
      isRead: true,
      sentAt: new Date('2026-02-11T10:00:00Z'),
    },
    {
      studentIdx: 15,
      type: 'VISA_EXPIRY',
      channel: 'SMS',
      title: '비자 만료 임박',
      message: '비자 만료까지 30일 미만입니다. 연장 준비를 시작해 주세요.',
      isRead: false,
      sentAt: new Date('2026-02-15T07:00:00Z'),
    },
    {
      studentIdx: 29,
      type: 'VISA_EXPIRY',
      channel: 'IN_APP',
      title: '비자 만료 임박 (교환학생)',
      message: '교환학생 비자 만료가 임박합니다. 귀국 일정을 확인해 주세요.',
      isRead: true,
      sentAt: new Date('2026-02-09T15:00:00Z'),
    },
  ];

  for (const alert of alertData) {
    await prisma.alertLog.create({
      data: {
        studentId: students[alert.studentIdx].id,
        userId: adminUser.id,
        type: alert.type,
        channel: alert.channel,
        title: alert.title,
        message: alert.message,
        isRead: alert.isRead,
        sentAt: alert.sentAt,
        readAt: alert.isRead ? new Date(alert.sentAt.getTime() + 3600000) : null,
      },
    });
  }

  console.log('   ✓ Alert Logs created: 10');

  // -----------------------------------------------------------------------
  // 5. FIMS Reports (5)
  // -----------------------------------------------------------------------
  // Link to students with non-ENROLLED status:
  //   idx 8  (VN, ON_LEAVE)
  //   idx 13 (VN, WITHDRAWN)
  //   idx 18 (VN, GRADUATED)
  //   idx 26 (CN, ON_LEAVE)
  //   idx 31 (CN, EXPELLED)
  const fimsData: {
    studentIdx: number;
    reportType: 'STATUS_CHANGE' | 'PERIODIC';
    changeType: 'ON_LEAVE' | 'EXPELLED' | 'WITHDRAWN' | 'GRADUATED' | 'UNREGISTERED' | 'TRANSFER' | null;
    status: 'PENDING' | 'READY' | 'SUBMITTED' | 'OVERDUE';
    detectedAt: Date;
    deadline: Date;
    submittedAt: Date | null;
  }[] = [
    {
      studentIdx: 8,
      reportType: 'STATUS_CHANGE',
      changeType: 'ON_LEAVE',
      status: 'SUBMITTED',
      detectedAt: new Date('2026-01-15T10:00:00Z'),
      deadline: new Date('2026-01-30'),
      submittedAt: new Date('2026-01-28T14:00:00Z'),
    },
    {
      studentIdx: 13,
      reportType: 'STATUS_CHANGE',
      changeType: 'WITHDRAWN',
      status: 'PENDING',
      detectedAt: new Date('2026-02-10T09:00:00Z'),
      deadline: new Date('2026-02-25'),
      submittedAt: null,
    },
    {
      studentIdx: 18,
      reportType: 'STATUS_CHANGE',
      changeType: 'GRADUATED',
      status: 'READY',
      detectedAt: new Date('2026-02-05T11:00:00Z'),
      deadline: new Date('2026-02-20'),
      submittedAt: null,
    },
    {
      studentIdx: 31,
      reportType: 'STATUS_CHANGE',
      changeType: 'EXPELLED',
      status: 'OVERDUE',
      detectedAt: new Date('2026-01-20T08:00:00Z'),
      deadline: new Date('2026-02-04'),
      submittedAt: null,
    },
    {
      studentIdx: 26,
      reportType: 'PERIODIC',
      changeType: null,
      status: 'SUBMITTED',
      detectedAt: new Date('2026-02-01T00:00:00Z'),
      deadline: new Date('2026-02-28'),
      submittedAt: new Date('2026-02-12T16:00:00Z'),
    },
  ];

  for (const fims of fimsData) {
    await prisma.fimsReport.create({
      data: {
        studentId: students[fims.studentIdx].id,
        reportType: fims.reportType,
        changeType: fims.changeType,
        detectedAt: fims.detectedAt,
        deadline: fims.deadline,
        status: fims.status,
        submittedAt: fims.submittedAt,
        submittedById: fims.submittedAt ? adminUser.id : null,
      },
    });
  }

  console.log('   ✓ FIMS Reports created: 5');

  // -----------------------------------------------------------------------
  // 6. Status Changes (10)
  // -----------------------------------------------------------------------
  const statusChangeData: {
    studentIdx: number;
    field: string;
    oldValue: string;
    newValue: string;
    createdAt: Date;
  }[] = [
    { studentIdx: 8,  field: 'enrollmentStatus', oldValue: 'ENROLLED',     newValue: 'ON_LEAVE',     createdAt: new Date('2026-01-15T10:00:00Z') },
    { studentIdx: 13, field: 'enrollmentStatus', oldValue: 'ENROLLED',     newValue: 'WITHDRAWN',    createdAt: new Date('2026-02-10T09:00:00Z') },
    { studentIdx: 13, field: 'visaStatus',       oldValue: 'ACTIVE',       newValue: 'EXPIRED',      createdAt: new Date('2026-02-10T09:05:00Z') },
    { studentIdx: 18, field: 'enrollmentStatus', oldValue: 'ENROLLED',     newValue: 'GRADUATED',    createdAt: new Date('2026-02-05T11:00:00Z') },
    { studentIdx: 18, field: 'visaStatus',       oldValue: 'ACTIVE',       newValue: 'EXPIRED',      createdAt: new Date('2026-02-05T11:05:00Z') },
    { studentIdx: 26, field: 'enrollmentStatus', oldValue: 'ENROLLED',     newValue: 'ON_LEAVE',     createdAt: new Date('2026-02-01T14:00:00Z') },
    { studentIdx: 31, field: 'enrollmentStatus', oldValue: 'ENROLLED',     newValue: 'EXPELLED',     createdAt: new Date('2026-01-20T08:00:00Z') },
    { studentIdx: 31, field: 'visaStatus',       oldValue: 'ACTIVE',       newValue: 'REVOKED',      createdAt: new Date('2026-01-20T08:05:00Z') },
    { studentIdx: 36, field: 'enrollmentStatus', oldValue: 'ENROLLED',     newValue: 'UNREGISTERED', createdAt: new Date('2026-01-25T16:00:00Z') },
    { studentIdx: 36, field: 'visaStatus',       oldValue: 'EXPIRING_SOON',newValue: 'REVOKED',      createdAt: new Date('2026-01-25T16:05:00Z') },
  ];

  for (const sc of statusChangeData) {
    await prisma.statusChange.create({
      data: {
        studentId: students[sc.studentIdx].id,
        field: sc.field,
        oldValue: sc.oldValue,
        newValue: sc.newValue,
        changedBy: adminUser.id,
        createdAt: sc.createdAt,
      },
    });
  }

  console.log('   ✓ Status Changes created: 10');

  // -----------------------------------------------------------------------
  // Done
  // -----------------------------------------------------------------------
  console.log('');
  console.log('✅ Seed complete!');
  console.log(`   University: 1`);
  console.log(`   Users: 3`);
  console.log(`   Students: 50`);
  console.log(`   Alerts: 10`);
  console.log(`   FIMS Reports: 5`);
  console.log(`   Status Changes: 10`);
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
