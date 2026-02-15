import 'dotenv/config';

// ---------------------------------------------------------------------------
// Performance Test Script
// ---------------------------------------------------------------------------
// Authenticates via NextAuth credentials endpoint, then measures API response
// times against target thresholds.
//
// Prerequisites:
//   - Dev server running at http://localhost:3000
//   - Database seeded with seed-large.ts (1,000 students)
//
// Usage:
//   npx tsx scripts/performance-test.ts
// ---------------------------------------------------------------------------

const BASE_URL = 'http://localhost:3000';

interface TestCase {
  name: string;
  endpoint: string;
  targetMs: number;
}

const TEST_CASES: TestCase[] = [
  {
    name: 'Students (page=1, limit=20)',
    endpoint: '/api/students?page=1&limit=20',
    targetMs: 500,
  },
  {
    name: 'Students (page=1, limit=100)',
    endpoint: '/api/students?page=1&limit=100',
    targetMs: 1000,
  },
  {
    name: 'Traffic Light summary',
    endpoint: '/api/students/traffic-light',
    targetMs: 2000,
  },
  {
    name: 'Dashboard summary',
    endpoint: '/api/dashboard/summary',
    targetMs: 1000,
  },
  {
    name: 'Calendar (2026-03)',
    endpoint: '/api/calendar?year=2026&month=3',
    targetMs: 1000,
  },
  {
    name: 'Students filtered (RED)',
    endpoint: '/api/students?trafficLight=RED',
    targetMs: 3000,
  },
];

const ITERATIONS = 3;

// ---------------------------------------------------------------------------
// Auth: get CSRF token + session cookie
// ---------------------------------------------------------------------------
async function authenticate(): Promise<string> {
  console.log('Authenticating...');

  // Step 1: Get CSRF token
  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
  if (!csrfRes.ok) {
    throw new Error(`Failed to get CSRF token: ${csrfRes.status} ${csrfRes.statusText}`);
  }
  const csrfData = (await csrfRes.json()) as { csrfToken: string };
  const csrfToken = csrfData.csrfToken;
  console.log(`   CSRF token obtained`);

  // Collect cookies from CSRF response
  const csrfCookies = csrfRes.headers.getSetCookie?.() ?? [];

  // Step 2: Login via credentials
  const loginRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: csrfCookies.join('; '),
    },
    body: new URLSearchParams({
      csrfToken,
      email: 'admin@hoseo.edu',
      password: 'admin1234!',
    }).toString(),
    redirect: 'manual', // Don't follow redirects — we need the Set-Cookie header
  });

  // NextAuth returns a 302 redirect on successful login
  if (loginRes.status !== 302 && loginRes.status !== 200) {
    throw new Error(`Login failed: ${loginRes.status} ${loginRes.statusText}`);
  }

  // Extract session cookie from Set-Cookie headers
  const setCookieHeaders = loginRes.headers.getSetCookie?.() ?? [];
  const allCookies = [...csrfCookies, ...setCookieHeaders];

  // Parse cookie names and values (take the most recent value for each name)
  const cookieMap = new Map<string, string>();
  for (const cookieStr of allCookies) {
    const nameValue = cookieStr.split(';')[0].trim();
    const eqIdx = nameValue.indexOf('=');
    if (eqIdx > 0) {
      const name = nameValue.substring(0, eqIdx);
      cookieMap.set(name, nameValue);
    }
  }

  const sessionCookie = Array.from(cookieMap.values()).join('; ');

  if (!sessionCookie) {
    throw new Error('No session cookie received after login');
  }

  console.log(`   Authenticated successfully`);
  return sessionCookie;
}

// ---------------------------------------------------------------------------
// Measure a single endpoint
// ---------------------------------------------------------------------------
async function measureEndpoint(
  endpoint: string,
  cookie: string,
): Promise<{ ms: number; status: number }> {
  const start = performance.now();
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { Cookie: cookie },
  });
  const end = performance.now();

  // Consume the body to ensure the response is fully received
  await res.text();

  return { ms: end - start, status: res.status };
}

// ---------------------------------------------------------------------------
// Format table row
// ---------------------------------------------------------------------------
function padRight(str: string, len: number): string {
  return str.length >= len ? str.substring(0, len) : str + ' '.repeat(len - str.length);
}

function padLeft(str: string, len: number): string {
  return str.length >= len ? str.substring(0, len) : ' '.repeat(len - str.length) + str;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('=== Performance Test ===');
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   Iterations per endpoint: ${ITERATIONS}`);
  console.log('');

  // Authenticate
  const sessionCookie = await authenticate();
  console.log('');

  // Run tests
  interface TestResult {
    name: string;
    endpoint: string;
    avgMs: number;
    targetMs: number;
    pass: boolean;
    httpStatus: number;
  }

  const results: TestResult[] = [];

  for (const testCase of TEST_CASES) {
    const times: number[] = [];
    let lastStatus = 0;

    for (let iter = 0; iter < ITERATIONS; iter++) {
      const { ms, status } = await measureEndpoint(testCase.endpoint, sessionCookie);
      times.push(ms);
      lastStatus = status;
    }

    const avgMs = times.reduce((sum, t) => sum + t, 0) / times.length;
    const pass = avgMs <= testCase.targetMs && lastStatus >= 200 && lastStatus < 400;

    results.push({
      name: testCase.name,
      endpoint: testCase.endpoint,
      avgMs,
      targetMs: testCase.targetMs,
      pass,
      httpStatus: lastStatus,
    });

    console.log(
      `   ${pass ? 'PASS' : 'FAIL'} | ${testCase.name} | avg: ${avgMs.toFixed(0)}ms | target: ${testCase.targetMs}ms | HTTP ${lastStatus}`,
    );
  }

  // Print summary table
  console.log('');
  console.log('=== Results ===');
  console.log('');

  const COL_NAME = 32;
  const COL_AVG = 10;
  const COL_TARGET = 10;
  const COL_STATUS = 8;
  const COL_RESULT = 8;

  const header = [
    padRight('Endpoint', COL_NAME),
    padLeft('Avg (ms)', COL_AVG),
    padLeft('Target', COL_TARGET),
    padLeft('HTTP', COL_STATUS),
    padLeft('Result', COL_RESULT),
  ].join(' | ');

  const separator = '-'.repeat(header.length);

  console.log(header);
  console.log(separator);

  for (const r of results) {
    const row = [
      padRight(r.name, COL_NAME),
      padLeft(r.avgMs.toFixed(0), COL_AVG),
      padLeft(`${r.targetMs}`, COL_TARGET),
      padLeft(`${r.httpStatus}`, COL_STATUS),
      padLeft(r.pass ? 'PASS' : 'FAIL', COL_RESULT),
    ].join(' | ');
    console.log(row);
  }

  console.log(separator);

  // Overall result
  const allPassed = results.every((r) => r.pass);
  console.log('');
  console.log(`Overall: ${allPassed ? 'PASS' : 'FAIL'}`);
  console.log('');

  if (!allPassed) {
    const failures = results.filter((r) => !r.pass);
    console.log('Failed endpoints:');
    for (const f of failures) {
      console.log(`   - ${f.name}: ${f.avgMs.toFixed(0)}ms (target: ${f.targetMs}ms, HTTP ${f.httpStatus})`);
    }
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('Performance test failed:', e);
  process.exit(1);
});
