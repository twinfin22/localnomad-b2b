import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withRbac } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/crypto';
import {
  parseVisaType,
  parseEnrollmentStatus,
  parseProgramType,
  parseInsuranceStatus,
  parseDate,
  parsePercentage,
  parseGpa,
  isValidEmail,
} from '@/lib/import-transformer';
import type {
  ColumnMapping,
  ImportValidatedRow,
  ImportValidationResult,
  ImportRowError,
  ImportDuplicateInfo,
} from '@/types';

// Required fields for student import — must be non-empty after transformation
const REQUIRED_FIELDS: { field: string; label: string }[] = [
  { field: 'nameEn', label: '영문 이름' },
  { field: 'visaType', label: '비자 유형' },
  { field: 'visaExpiry', label: '비자 만료일' },
  { field: 'department', label: '학과' },
  { field: 'enrollmentStatus', label: '재학 상태' },
  { field: 'programType', label: '과정 유형' },
];

// POST /api/import/validate — Validate mapped import data before execution
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const rbacError = withRbac(session, 'import', 'create');
    if (rbacError) return rbacError;

    const universityId = session!.user.universityId;

    const body = await request.json();
    const {
      fileName,
      mappings,
      data,
      headers,
    } = body as {
      fileName: string;
      mappings: ColumnMapping[];
      data: string[][];
      headers: string[];
    };

    // Validate request body
    if (!fileName || !mappings || !data || !headers) {
      return NextResponse.json(
        { success: false, error: '필수 요청 데이터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { success: false, error: '가져올 데이터가 없습니다.' },
        { status: 400 }
      );
    }

    // Build mapping index: targetField → column index in the row
    const mappingIndex = new Map<string, number>();
    for (const mapping of mappings) {
      if (mapping.targetField !== null) {
        const headerIdx = headers.indexOf(mapping.sourceColumn);
        if (headerIdx !== -1) {
          mappingIndex.set(mapping.targetField, headerIdx);
        }
      }
    }

    // Helper to extract a raw value from a row using the mapping index
    const getRawValue = (row: string[], targetField: string): string => {
      const idx = mappingIndex.get(targetField);
      if (idx === undefined) return '';
      return (row[idx] ?? '').trim();
    };

    // --- Step 1: Validate and transform each row ---
    const allRows: ImportValidatedRow[] = [];

    // Track values for batch duplicate detection
    const passportValues: { rowIndex: number; raw: string }[] = [];
    const arcValues: { rowIndex: number; raw: string }[] = [];
    const nameNationalityPairs: {
      rowIndex: number;
      nameEn: string;
      nationality: string;
    }[] = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const errors: ImportRowError[] = [];
      const rowData: Record<string, string | number | boolean | null> = {};

      // --- Extract and transform values ---

      // nameEn (string, required)
      const nameEn = getRawValue(row, 'nameEn');
      rowData.nameEn = nameEn || null;

      // nameKr (string, optional)
      const nameKr = getRawValue(row, 'nameKr');
      rowData.nameKr = nameKr || null;

      // nationality (string, optional but used for duplicate detection)
      const nationality = getRawValue(row, 'nationality');
      rowData.nationality = nationality || null;

      // visaType (enum, required)
      const visaTypeRaw = getRawValue(row, 'visaType');
      const visaTypeParsed = visaTypeRaw ? parseVisaType(visaTypeRaw) : null;
      rowData.visaType = visaTypeParsed;
      if (visaTypeRaw && !visaTypeParsed) {
        errors.push({
          field: 'visaType',
          message: `인식할 수 없는 비자 유형입니다: "${visaTypeRaw}"`,
        });
      }

      // visaExpiry (date, required)
      const visaExpiryRaw = getRawValue(row, 'visaExpiry');
      const visaExpiryParsed = visaExpiryRaw
        ? parseDate(visaExpiryRaw)
        : null;
      rowData.visaExpiry = visaExpiryParsed;
      if (visaExpiryRaw && !visaExpiryParsed) {
        errors.push({
          field: 'visaExpiry',
          message: `잘못된 날짜 형식입니다: "${visaExpiryRaw}"`,
        });
      }

      // department (string, required)
      const department = getRawValue(row, 'department');
      rowData.department = department || null;

      // enrollmentStatus (enum, required)
      const enrollmentStatusRaw = getRawValue(row, 'enrollmentStatus');
      const enrollmentStatusParsed = enrollmentStatusRaw
        ? parseEnrollmentStatus(enrollmentStatusRaw)
        : null;
      rowData.enrollmentStatus = enrollmentStatusParsed;
      if (enrollmentStatusRaw && !enrollmentStatusParsed) {
        errors.push({
          field: 'enrollmentStatus',
          message: `인식할 수 없는 재학 상태입니다: "${enrollmentStatusRaw}"`,
        });
      }

      // programType (enum, required)
      const programTypeRaw = getRawValue(row, 'programType');
      const programTypeParsed = programTypeRaw
        ? parseProgramType(programTypeRaw)
        : null;
      rowData.programType = programTypeParsed;
      if (programTypeRaw && !programTypeParsed) {
        errors.push({
          field: 'programType',
          message: `인식할 수 없는 과정 유형입니다: "${programTypeRaw}"`,
        });
      }

      // insuranceStatus (enum, optional)
      const insuranceStatusRaw = getRawValue(row, 'insuranceStatus');
      const insuranceStatusParsed = insuranceStatusRaw
        ? parseInsuranceStatus(insuranceStatusRaw)
        : null;
      rowData.insuranceStatus = insuranceStatusParsed;
      if (insuranceStatusRaw && !insuranceStatusParsed) {
        errors.push({
          field: 'insuranceStatus',
          message: `인식할 수 없는 보험 상태입니다: "${insuranceStatusRaw}"`,
        });
      }

      // passportExpiry (date, optional)
      const passportExpiryRaw = getRawValue(row, 'passportExpiry');
      const passportExpiryParsed = passportExpiryRaw
        ? parseDate(passportExpiryRaw)
        : null;
      rowData.passportExpiry = passportExpiryParsed;
      if (passportExpiryRaw && !passportExpiryParsed) {
        errors.push({
          field: 'passportExpiry',
          message: `잘못된 날짜 형식입니다: "${passportExpiryRaw}"`,
        });
      }

      // insuranceExpiry (date, optional)
      const insuranceExpiryRaw = getRawValue(row, 'insuranceExpiry');
      const insuranceExpiryParsed = insuranceExpiryRaw
        ? parseDate(insuranceExpiryRaw)
        : null;
      rowData.insuranceExpiry = insuranceExpiryParsed;
      if (insuranceExpiryRaw && !insuranceExpiryParsed) {
        errors.push({
          field: 'insuranceExpiry',
          message: `잘못된 날짜 형식입니다: "${insuranceExpiryRaw}"`,
        });
      }

      // partTimePermitExpiry (date, optional)
      const partTimePermitExpiryRaw = getRawValue(
        row,
        'partTimePermitExpiry'
      );
      const partTimePermitExpiryParsed = partTimePermitExpiryRaw
        ? parseDate(partTimePermitExpiryRaw)
        : null;
      rowData.partTimePermitExpiry = partTimePermitExpiryParsed;
      if (partTimePermitExpiryRaw && !partTimePermitExpiryParsed) {
        errors.push({
          field: 'partTimePermitExpiry',
          message: `잘못된 날짜 형식입니다: "${partTimePermitExpiryRaw}"`,
        });
      }

      // attendanceRate (percentage, optional)
      const attendanceRateRaw = getRawValue(row, 'attendanceRate');
      const attendanceRateParsed = attendanceRateRaw
        ? parsePercentage(attendanceRateRaw)
        : null;
      rowData.attendanceRate = attendanceRateParsed;
      if (attendanceRateRaw && attendanceRateParsed === null) {
        errors.push({
          field: 'attendanceRate',
          message: `잘못된 출석률 값입니다: "${attendanceRateRaw}"`,
        });
      }
      if (
        attendanceRateParsed !== null &&
        (attendanceRateParsed < 0 || attendanceRateParsed > 100)
      ) {
        errors.push({
          field: 'attendanceRate',
          message: '출석률은 0~100 범위여야 합니다.',
        });
      }

      // gpa (decimal, optional)
      const gpaRaw = getRawValue(row, 'gpa');
      const gpaParsed = gpaRaw ? parseGpa(gpaRaw) : null;
      rowData.gpa = gpaParsed;
      if (gpaRaw && gpaParsed === null) {
        errors.push({
          field: 'gpa',
          message: `잘못된 학점 값입니다: "${gpaRaw}"`,
        });
      }
      if (gpaParsed !== null && (gpaParsed < 0 || gpaParsed > 4.5)) {
        errors.push({
          field: 'gpa',
          message: '학점은 0~4.5 범위여야 합니다.',
        });
      }

      // email (string, optional but validate format if present)
      const email = getRawValue(row, 'email');
      rowData.email = email || null;
      if (email && !isValidEmail(email)) {
        errors.push({
          field: 'email',
          message: `잘못된 이메일 형식입니다: "${email}"`,
        });
      }

      // Pass-through string fields (optional)
      const passportNumber = getRawValue(row, 'passportNumber');
      rowData.passportNumber = passportNumber || null;

      const arcNumber = getRawValue(row, 'arcNumber');
      rowData.arcNumber = arcNumber || null;

      const semester = getRawValue(row, 'semester');
      rowData.semester = semester || null;

      const phone = getRawValue(row, 'phone');
      rowData.phone = phone || null;

      const kakaoId = getRawValue(row, 'kakaoId');
      rowData.kakaoId = kakaoId || null;

      const emergencyContact = getRawValue(row, 'emergencyContact');
      rowData.emergencyContact = emergencyContact || null;

      const address = getRawValue(row, 'address');
      rowData.address = address || null;

      const notes = getRawValue(row, 'notes');
      rowData.notes = notes || null;

      // --- Validate required fields ---
      for (const { field, label } of REQUIRED_FIELDS) {
        const value = rowData[field];
        if (value === null || value === undefined || value === '') {
          errors.push({
            field,
            message: `${label}은(는) 필수 항목입니다.`,
          });
        }
      }

      allRows.push({
        rowIndex: i,
        data: rowData,
        errors,
      });

      // Collect values for batch duplicate detection
      if (passportNumber) {
        passportValues.push({ rowIndex: i, raw: passportNumber });
      }
      if (arcNumber) {
        arcValues.push({ rowIndex: i, raw: arcNumber });
      }
      if (nameEn && nationality) {
        nameNationalityPairs.push({ rowIndex: i, nameEn, nationality });
      }
    }

    // --- Step 2: Batch duplicate detection ---
    const duplicateMap = new Map<number, ImportDuplicateInfo>();

    // Passport number duplicate check
    if (passportValues.length > 0) {
      const encryptedPassports = passportValues.map((pv) => ({
        rowIndex: pv.rowIndex,
        encrypted: encrypt(pv.raw),
      }));

      const existingByPassport = await prisma.student.findMany({
        where: {
          universityId,
          isDeleted: false,
          passportNumber: {
            in: encryptedPassports.map((ep) => ep.encrypted),
          },
        },
        select: { id: true, nameEn: true, passportNumber: true },
      });

      if (existingByPassport.length > 0) {
        // Build a reverse map: encrypted passport → existing student
        const passportToStudent = new Map(
          existingByPassport.map((s) => [s.passportNumber, s])
        );

        for (const ep of encryptedPassports) {
          const match = passportToStudent.get(ep.encrypted);
          if (match) {
            duplicateMap.set(ep.rowIndex, {
              existingStudentId: match.id,
              existingNameEn: match.nameEn,
              matchField: 'passportNumber',
            });
          }
        }
      }
    }

    // ARC number duplicate check
    if (arcValues.length > 0) {
      const encryptedArcs = arcValues.map((av) => ({
        rowIndex: av.rowIndex,
        encrypted: encrypt(av.raw),
      }));

      const existingByArc = await prisma.student.findMany({
        where: {
          universityId,
          isDeleted: false,
          arcNumber: {
            in: encryptedArcs.map((ea) => ea.encrypted),
          },
        },
        select: { id: true, nameEn: true, arcNumber: true },
      });

      if (existingByArc.length > 0) {
        const arcToStudent = new Map(
          existingByArc.map((s) => [s.arcNumber, s])
        );

        for (const ea of encryptedArcs) {
          // Do not overwrite a passport match (passport takes priority)
          if (duplicateMap.has(ea.rowIndex)) continue;

          const match = arcToStudent.get(ea.encrypted);
          if (match) {
            duplicateMap.set(ea.rowIndex, {
              existingStudentId: match.id,
              existingNameEn: match.nameEn,
              matchField: 'arcNumber',
            });
          }
        }
      }
    }

    // Name + nationality duplicate check (secondary, lower priority)
    if (nameNationalityPairs.length > 0) {
      // Only check rows that haven't been matched by passport or ARC
      const unmatchedPairs = nameNationalityPairs.filter(
        (p) => !duplicateMap.has(p.rowIndex)
      );

      if (unmatchedPairs.length > 0) {
        const existingByName = await prisma.student.findMany({
          where: {
            universityId,
            isDeleted: false,
            OR: unmatchedPairs.map((p) => ({
              nameEn: p.nameEn,
              nationality: p.nationality,
            })),
          },
          select: { id: true, nameEn: true, nationality: true },
        });

        if (existingByName.length > 0) {
          // Build lookup: "nameEn|nationality" → student
          const nameNatMap = new Map(
            existingByName.map((s) => [`${s.nameEn}|${s.nationality}`, s])
          );

          for (const p of unmatchedPairs) {
            const match = nameNatMap.get(`${p.nameEn}|${p.nationality}`);
            if (match) {
              duplicateMap.set(p.rowIndex, {
                existingStudentId: match.id,
                existingNameEn: match.nameEn,
                matchField: 'nameAndNationality',
              });
            }
          }
        }
      }
    }

    // --- Step 3: Classify rows ---
    const validRows: ImportValidatedRow[] = [];
    const errorRows: ImportValidatedRow[] = [];
    const duplicateRows: ImportValidatedRow[] = [];

    for (const row of allRows) {
      // Attach duplicate info to the row if found
      const dupInfo = duplicateMap.get(row.rowIndex);
      if (dupInfo) {
        row.duplicate = dupInfo;
      }

      if (row.errors.length > 0) {
        errorRows.push(row);
      } else if (dupInfo) {
        duplicateRows.push(row);
      } else {
        validRows.push(row);
      }
    }

    // --- Step 4: Build result ---
    const result: ImportValidationResult = {
      summary: {
        total: allRows.length,
        valid: validRows.length,
        errors: errorRows.length,
        duplicates: duplicateRows.length,
      },
      validRows,
      errorRows,
      duplicateRows,
    };

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Import validation error:', error.message);
    }
    return NextResponse.json(
      {
        success: false,
        error: '데이터 검증 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
