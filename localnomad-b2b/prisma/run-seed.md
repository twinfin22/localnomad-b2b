# Task: Seed 데이터 실행

## 목표
`prisma/seed.ts`를 실행하여 Supabase DB에 더미 데이터를 삽입한다.

## 사전 조건
- `.env` 또는 `.env.local`에 `DATABASE_URL`과 `AES_ENCRYPTION_KEY`가 설정되어 있어야 함
- `DATABASE_URL`은 Supabase **Session mode pooler** (port 5432) 사용
- `AES_ENCRYPTION_KEY`는 정확히 32자

## 실행 순서

### 1. 필요한 패키지 확인/설치
```bash
npm install dotenv pg @prisma/adapter-pg bcryptjs
npm install -D @types/pg @types/bcryptjs tsx
```

### 2. Prisma Client 생성
```bash
npx prisma generate
```

### 3. Seed 실행
```bash
npx tsx prisma/seed.ts
```

## 예상 결과
```
🌱 Seeding database...
   ✓ University created: 비캠대학교
   ✓ Users created: 3
   ✓ Students created: 50
   ✓ Alert Logs created: 10
   ✓ FIMS Reports created: 5
   ✓ Status Changes created: 10

✅ Seed complete!
   University: 1
   Users: 3
   Students: 50
   Alerts: 10
   FIMS Reports: 5
   Status Changes: 10
```

## 에러 발생 시
- `AES_ENCRYPTION_KEY must be exactly 32 bytes` → `.env`에서 키 길이 확인
- `P1001 connection refused` → `DATABASE_URL`이 올바른 Supabase pooler URI인지 확인
- `relation does not exist` → `npx prisma db push` 먼저 실행

## 하지 말 것
- seed.ts 내용 수정하지 말 것
- 다른 파일 건드리지 말 것
- DB 스키마 변경하지 말 것
