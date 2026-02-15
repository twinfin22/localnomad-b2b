import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withRbac } from '@/lib/rbac';
import * as XLSX from 'xlsx';
import type { ParseResult } from '@/types';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_EXTENSIONS = ['.xlsx', '.xls', '.csv', '.tsv'];

// POST /api/import/parse — Parse uploaded file and return headers + preview
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const rbacError = withRbac(session, 'import', 'create');
    if (rbacError) return rbacError;

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    // Validate: file exists
    if (!file) {
      return NextResponse.json(
        { success: false, error: '파일이 선택되지 않았습니다.' },
        { status: 400 }
      );
    }

    // Validate: file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: '파일 크기가 50MB를 초과합니다.' },
        { status: 400 }
      );
    }

    // Validate: file extension
    const fileName = file.name.toLowerCase();
    const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) =>
      fileName.endsWith(ext)
    );
    if (!hasValidExtension) {
      return NextResponse.json(
        {
          success: false,
          error:
            '지원하지 않는 파일 형식입니다. (.xlsx, .xls, .csv, .tsv만 가능)',
        },
        { status: 400 }
      );
    }

    // Parse file in-memory (no disk storage)
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });

    if (data.length === 0) {
      return NextResponse.json(
        { success: false, error: '파일에 데이터가 없습니다.' },
        { status: 400 }
      );
    }

    // Extract headers from first row
    const headers = (data[0] || []).map((h) => String(h ?? '').trim());

    // Preview rows 1-5 (skip header row)
    const previewRows = data.slice(1, 6).map((row) =>
      headers.map((_, i) => String((row as string[])[i] ?? ''))
    );

    // All data rows (for validation API)
    const allData = data.slice(1).map((row) =>
      headers.map((_, i) => String((row as string[])[i] ?? ''))
    );

    const totalRows = data.length - 1; // Exclude header row

    const result: ParseResult = {
      fileName: file.name,
      totalRows,
      headers,
      preview: previewRows,
      previewRowCount: Math.min(5, totalRows),
    };

    return NextResponse.json({ success: true, data: { ...result, allData } });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Import parse error:', error.message);
    }
    return NextResponse.json(
      {
        success: false,
        error: '파일을 파싱하는 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
