# FIMS (유학생정보시스템) 연구 보고서
Foreign Student Information Management System (외국인 유학생정보 시스템) 공개 정보 취합

---

## 1. FIMS 개요 (FIMS Overview)

### 시스템 정의
FIMS는 **유학생정보시스템 (Foreign Student Information Management System)**으로, 한국 정부에서 운영하는 외국인 유학생의 학적 및 체류 정보를 종합적으로 관리하는 시스템입니다.

### 운영 기관
- **주관기관**: 법무부 출입국·외국인정책본부 (Ministry of Justice, Immigration Service)
- **교육부 협력**: 교육부 (Ministry of Education)
- **포털명**: Hi, Korea (하이코리아)

### 시스템 기본 정보
- **공식 웹사이트**: https://fims.hikorea.go.kr/
- **로그인 페이지**:
  - https://fims.hikorea.go.kr/isi/login.jsp
  - https://www.hikorea.go.kr/isi/login.jsp
- **시스템 유형**: 웹 기반 시스템 (Web-based Information System)

### 주요 기능
1. **유학생 표준입학허가서 관리** - 대학에서 발급하는 표준입학허가서의 확인 및 관리
2. **학적정보 등록 및 관리** - 학과, 학번, 출석률, 취득학점, 성적 등의 학사정보 입력 및 관리
3. **체류정보 관리** - 체류자격 확인 및 체류 상태 모니터링
4. **정기보고 및 변동신고** - 유학생 현황을 주기적으로 법무부에 보고
5. **통계 조회** - 유학생의 교육과정별, 국적별, 학교별 통계 데이터 제공

---

## 2. FIMS 보고 요건 (FIMS Reporting Requirements)

### 정기보고 (Periodic Reporting)
**보고주기**: 연 4회
**보고 기한**: 매년 2월, 5월, 8월, 11월 말일까지

**보고 대상**:
- 각 교육기관의 학교 장(長)이 유학생 현황을 출입국관리사무소장에 보고
- 매 학기별로 학적 현황 변동사항을 통보

### 변동신고 (Change of Status Reporting)
**신고 기한**: 사유 발생 후 **15일 이내**

**변동신고 대상 사항**:
1. 학생이 학기 등록 기간 내에 등록하지 않은 경우
2. 휴학 (Leave of Absence)을 신청한 경우
3. 유학이 종료된 경우 (제적, 중퇴, 학위 수여)
4. 경우에 따른 학적 변동사항 (Expulsion, Suspension, 행방불명 등)

**신고 방법**:
- 유학생정보시스템(FIMS)을 통해 **고용·연수(유학)외국인 변동사유 신고**
- 대학의 체류관리담당자가 시스템에 직접 입력

### 보고 및 신고 담당자
- **유학생 관리 부서**: 국제교육처, 국제학생팀 등
- **체류관리담당자**: 각 대학이 지정하는 FIMS 접속 권한자
- **주관부서의 장**: 법무부에서 정한 기일 내에 유학생 현황을 통보하는 책임

---

## 3. FIMS 데이터 항목 (FIMS Data Fields/Categories)

### 학생 기본 정보 (Student Basic Information)
- 성명 (Name)
- 성별 (Gender)
- 국적 (Nationality/Country)
- 학생 등록번호 (Student ID Number)
- 외국인등록번호 (Alien Registration Number)

### 학적 정보 (Academic Information)
- 학과 (Department/Major)
- 학번 (Student ID)
- 출석률 (Attendance Rate)
- 취득 학점 (Credits Acquired)
- 성적 (Grades)
- 학년 (Academic Year)

### 체류 정보 (Residence Information)
- 체류자격 (Visa Type - D-2 Study)
- 체류 기간 (Period of Stay)
- 학교명 (School Name)
- 교육 과정 유형 (Program Type)

### 통계 분류 항목 (Statistical Categories)
FIMS에서 수집하고 제공하는 통계는 다음과 같이 분류됩니다:

#### 교육과정별 분류 (By Curriculum Type)
- 학위과정 (Degree Programs)
  - 학사과정 (Undergraduate)
  - 석사과정 (Master's Degree)
  - 박사과정 (Doctorate)
- 비학위과정 (Non-Degree Programs)
  - 어학연수 (Language Training)
  - 연수/교환 프로그램 (Training/Exchange Programs)

#### 국적별 분류 (By Nationality)
- 국가/지역별 분포 (Distribution by Country/Region)
- 주요 송출국: 중국, 베트남, 우즈베키스탄, 몽골, 일본 등

#### 유학 중단 사유별 분류 (By Reasons for Study Discontinuation)
- 학업 부진
- 경제적 어려움
- 학적 사항 (제적, 중퇴)
- 건강상 문제
- 기타 사유

#### 학교별 분류 (By Institution Type)
- 대학 (Universities)
- 전문대학 (Junior Colleges)
- 대학원 (Graduate Schools)
- 학술연구기관 (Research Institutes)

---

## 4. FIMS 시스템 접속 및 기술 정보 (FIMS Technical Details)

### 시스템 구성
- **시스템 유형**: 웹 기반 시스템 (Web-based Platform)
- **접속 URL**: https://fims.hikorea.go.kr/
- **로그인 진행**: ID/Password 기반 로그인

### 사용자 권한 관리
- **FIMS 접속 권한**: 각 대학이 지정한 체류관리담당자에게 부여
- **권한 신청 절차**: "신규유학생담당자지정신청"을 통한 권한 신청
  - 신청 페이지: https://fims.hikorea.go.kr/isi/charge/appl/IntlStudChargeContr.jsp

### 브라우저 호환성
공개 정보에서 구체적인 브라우저 요구사항이 명시되지 않았으나, 일반적인 정부 웹사이트 기준:
- 표준 웹 브라우저 (Chrome, Firefox, Edge 등) 지원 가능성 높음

### 시스템 메뉴 구조
FIMS 시스템 내 주요 메뉴 예시:
- 사증업무관리 (Visa Management)
  - 표준입학허가서 (Standard Admission Permit)
  - 통합 표준입학허가서 관리 (Integrated Standard Admission Permit Management)
- 유학생 정보 조회 및 수정
- 정기보고 및 변동신고 신청

---

## 5. 변동신고 입력 항목 상세 (Specific Fields for Status Change Reports)

### 변동신고 필수 입력 항목
공개 정보 기반으로 변동신고에 필요한 주요 항목:

1. **변동 사유 선택** (Reason for Change)
   - 미등록 (Non-enrollment)
   - 휴학 (Leave of absence)
   - 제적 (Withdrawal)
   - 중퇴 (Discontinuation)
   - 기타 변동사항

2. **변동 발생 일자** (Date of Change)
   - 구체적인 발생 년/월/일 입력

3. **학생 기본 정보** (Student Information)
   - 학생명
   - 학번
   - 외국인등록번호 또는 여권번호

4. **학적 정보** (Academic Information)
   - 소속 학과/전공
   - 학년
   - 등록 상태

5. **비고 사항** (Remarks)
   - 추가 설명 또는 특이사항 기록

### 신고 절차
1. FIMS 로그인
2. 변동신고 메뉴 선택
3. 필수 항목 입력
4. 변동 사유 상세 기재
5. 담당자 확인 및 승인
6. 시스템 제출 및 접수 완료

---

## 6. 대학의 FIMS 운영 현황 및 과제 (Universities' FIMS Implementation & Challenges)

### 대학의 FIMS 관리 책임
각 교육기관은 다음 사항을 담당합니다:

1. **FIMS 접속 권한 관리**
   - 전담 체류관리담당자 지정
   - 권한 신청 및 유지 관리

2. **정기적 정보 업데이트**
   - 학생 학적정보 정확성 유지
   - 체류 현황 정보 제출

3. **변동신고 신청**
   - 발생 후 15일 이내 신고 의무
   - 정확한 변동 사유 기재

### 대학 FIMS 운영 상 주요 과제 (Pain Points & Challenges)

#### 공개 정보 기반 식별된 문제점
1. **시스템 사용성**
   - 복잡한 입력 절차
   - 부서 간 정보 연동 미흡
   - 실시간 정보 동기화 어려움

2. **관리 부담**
   - 정기보고 기한 준수 부담 (연 4회)
   - 변동신고 신속 대응 필요 (15일 제한)
   - 신규 학생 정보 등록 업무 증가

3. **정확성 및 일관성**
   - 다양한 교육과정 유형 분류의 복잡성
   - 학사 시스템과의 수동 입력 방식
   - 데이터 입력 오류 가능성

4. **시스템 개선 요청**
   - 대학 학사관리 시스템과의 자동 연동 필요
   - 입력 항목 단순화 요청
   - 모바일 접속 환경 개선

### 정부 차원의 관리 체계
- **교육국제화 역량인증제 (2012년 이후)**:
  - 연 1회 대학 평가 실시
  - 불법 체류율, 휴학률, 언어능력 충족률 등 핵심 지표 평가
  - 인증 미획득 대학에 대한 제재 (예: 비자 발급 제한 1년)

---

## 7. 관련 정부 지침 및 규정 (Related Government Guidelines & Regulations)

### 주요 정책 문서

#### 교육부/법무부 합동 지침
- **외국인 유학생 및 어학연수생 표준업무처리요령** (2019.4.30 개정)
  - https://moe.go.kr/boardCnts/fileDown.do?m=040103&s=moe&fileSeq=889b4cc3c586896b4754fb6ec953a462

- **외국인 유학생 및 어학연수생 표준업무처리요령**
  - 다양한 버전이 웹상에서 제공 중

#### 각 대학의 내부 규정 사례
- **외국인유학생 사증발급 및 체류관리 지침** (대학별 수립)
  - https://research.kau.ac.kr/upfile/2022/11/20221108163943-8217.pdf

- **외국인 유학생 및 어학연수생 관리 규정** (각 대학)
  - 대학별로 상이한 세부 규정 운영

### 관련 법령
- **출입국관리법** (Immigration Act)
- **개인정보 보호법** (Personal Information Protection Act)
- **학교생활기록 관리 지침**

---

## 8. FIMS와 연계 시스템 (Related Systems & Integration)

### 연계 기관 및 시스템
1. **법무부 시스템**
   - 외국인 등록 정보 연계
   - 비자 체류자격 관리 시스템

2. **교육부 시스템**
   - 한국교육개발원(KEDI) 교육통계조사
   - 학교별 학적 관리 정보

3. **출입국관리사무소**
   - 유학생 현황 보고서 제출 대상
   - 체류 조건 및 신고 사항 관리

### 공개 데이터 연동
- **공공데이터포털 (data.go.kr)**
  - 법무부 유학생관리정보 데이터셋 제공
  - https://www.data.go.kr/data/3069982/fileData.do
  - 업데이트: 분기별 (2025.06.30 기준)

- **한국교육개발원 교육통계서비스 (KEDI)**
  - 외국인 유학생 현황 통계 제공
  - https://kess.kedi.re.kr/index
  - 고등교육통계조사: https://hi.kedi.re.kr/

---

## 9. FIMS 통계 데이터 현황 (FIMS Statistical Data & Current Status)

### 최근 유학생 통계 (2022년 4월 1일 기준)
**전체 외국인 유학생 수**: 181,842명
- 전년 대비 증가율: 9.0% (14,950명 증가)

**교육 프로그램별 분포**:
- 학위과정: 129,240명 (71.1%)
- 비학위과정: 52,602명 (28.9%)
  - 비학위과정 증가율: 25.0% (전년 대비)

**국가별 분포** (상위 5개국):
1. 중국: 37.4% (68,065명)
2. 베트남: 23.8% (43,361명)
3. 우즈베키스탄: 5.7% (10,409명)
4. 몽골: 5.7% (10,375명)
5. 일본: 3.2% (5,850명)

### 통계 조회 처리 시간
공개 정보에서 구체적인 조회 시간이 명시되지 않음.
일반적으로 정기보고 마감 후 수집 및 통계화에 1-2개월 소요 예상.

---

## 10. FIMS 접근성 및 공개 정보 한계 (Accessibility & Information Limitations)

### 공개 가능한 정보
1. 시스템 기본 접속 정보
2. 보고 의무 및 기한
3. 일반적인 정책 지침
4. 통계 현황 데이터

### 공개 제한 정보
1. 시스템 세부 사용 매뉴얼 (로그인 필수 접근)
2. 입력 화면 스크린샷 (보안상 이유)
3. 개별 학생 정보 (개인정보보호)
4. 대학별 상세 신고 현황
5. 시스템 에러 및 기술 문제 상세 정보

### 추가 정보 접근 방법
- **FIMS 공식 사이트**: https://fims.hikorea.go.kr/ - 로그인 후 매뉴얼 확인 가능
- **법무부 출입국·외국인정책본부**: 공식 문의 및 기술 지원
- **교육부**: 정책 관련 문의 (전화: 044-203-6797)
- **각 대학 국제처/학생팀**: 실무 운영 방법 상담
- **공공데이터포털**: 통계 데이터 다운로드 및 조회

---

## 11. 참고 자료 및 출처 (Sources & References)

### 공식 웹사이트
- FIMS 공식 포털: https://fims.hikorea.go.kr/
- FIMS 로그인 페이지: https://fims.hikorea.go.kr/isi/login.jsp
- Hi Korea 웹사이트: https://www.hikorea.go.kr/isi/login.jsp

### 정부 기관 자료
- 교육부 유학생 정책: https://www.moe.go.kr/boardCnts/listRenew.do?boardID=350&m=0309&s=moe
- 외국인 유학생 표준업무처리요령: https://moe.go.kr/boardCnts/fileDown.do?m=040103&s=moe&fileSeq=889b4cc3c586896b4754fb6ec953a462
- 법무부 공공데이터: https://www.data.go.kr/data/3069982/fileData.do
- 법무부 월별 유학생 현황: https://www.data.go.kr/data/15100039/fileData.do?recommendDataYn=Y
- 법무부 연도별 유학생 체류 현황: https://www.data.go.kr/data/15100038/fileData.do

### 교육통계 자료
- 한국교육개발원 교육통계서비스: https://kess.kedi.re.kr/index
- 고등교육통계조사: https://hi.kedi.re.kr/
- 한국교육개발원 공공데이터: https://www.data.go.kr/data/15050054/fileData.do?recommendDataYn=Y
- 교육지표 조회: https://www.index.go.kr/unity/potal/main/EachDtlPageDetail.do?idx_cd=1534

### 대학 자료 사례
- 고려대학교 외국인유학생 사증발급 및 체류관리 지침: https://research.kau.ac.kr/upfile/2022/11/20221108163943-8217.pdf
- 아주대학교 D-2(유학) 자격 안내: https://www.ajou.ac.kr/gs/community/notice.do?mode=download&articleNo=191484&attachNo=173287

### 일반 정보 포털
- 한국유학종합시스템: https://www.studyinkorea.go.kr/
- 국가법령정보센터: https://www.law.go.kr/
- 찾기쉬운 생활법령: https://easylaw.go.kr/
- 공공데이터포털: https://www.data.go.kr/
- 정부24: https://www.gov.kr/

---

## 12. 결론 및 종합 평가 (Conclusion & Summary)

FIMS는 한국의 유학생 관리를 위한 핵심 정부 시스템으로:

**장점**:
- 통일된 관리 기준 제공
- 정기적 통계 데이터 축적
- 중앙 집중식 정보 관리

**개선 필요 분야**:
- 대학 학사 시스템과의 자동 연동 부족
- 시스템 사용성 개선 요청
- 신속한 변동신고 처리의 부담

**활용 방안**:
- 유학생 모집 및 관리 의사결정
- 정부 유학생 정책 수립 근거
- 교육국제화 발전 추세 파악

---

**작성일**: 2026년 2월 13일
**자료 수집 기간**: 2026년 2월 13일
**자료 기준일**: 2025년 6월 30일 (최신 공공데이터 기준)
**정보 제공**: 공개 웹 검색 기반 취합

*본 문서는 공개된 정보만을 바탕으로 작성되었으며, 시스템의 정확한 운영 절차는 각 기관의 공식 매뉴얼을 참조하기 바랍니다.*
