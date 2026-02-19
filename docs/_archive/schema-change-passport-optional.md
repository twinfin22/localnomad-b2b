# Schema Change: passportNumber/passportExpiry → optional

## 변경 내용

Prisma 스키마에서 `passportNumber`와 `passportExpiry`를 required → optional로 변경하세요.

### `prisma/schema.prisma` — Student 모델

변경 전:
```prisma
passportNumber        String            @db.VarChar(200)     // AES-256 암호화 저장
passportExpiry        DateTime          @db.Date
```

변경 후:
```prisma
passportNumber        String?           @db.VarChar(200)     // AES-256 암호화 저장 (optional — 위탁계약 체결 전까지)
passportExpiry        DateTime?         @db.Date             // (optional)
```

## 변경 이유

고유식별정보(여권번호, 외국인등록번호)는 개인정보보호법상 위탁계약 체결 후에 수집합니다. 위탁계약 체결 전에도 대시보드, 트래픽 라이트, 캘린더, 알림 등 핵심 기능은 학번+이름+비자만료일+학적상태만으로 동작해야 합니다.

## 연쇄 수정

이 변경으로 인해 아래 코드도 확인/수정이 필요합니다:

1. **Seed data** (`prisma/seed.ts`) — passportNumber 없는 학생 몇 명 포함하기
2. **Student 생성 API** (`src/app/api/students/route.ts`) — passportNumber를 필수 필드 검증에서 제거
3. **Student 상세 API** (`src/app/api/students/[id]/route.ts`) — passportNumber가 null일 때 decrypt 호출하지 않도록 처리
4. **Student form** (`src/components/students/student-form.tsx`) — passportNumber 필드를 optional로 표시

## 실행

```bash
npx prisma db push
npx prisma generate
npm run build
```

빌드 에러 0건 확인하세요.
