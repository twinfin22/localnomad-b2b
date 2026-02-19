# 카카오 알림톡(Alimtalk) B2B SaaS 스타트업 구현 가이드

## 1. 셋업 프로세스 (Setup Process)

### 1.1 초기 설정 단계

카카오 알림톡을 시작하기 위한 기본 프로세스:

1. **비즈니스 채널 생성**
   - 카카오 비즈니스 페이지에서 KakaoTalk Business Channel 회원가입
   - 사업자 등록번호 입력
   - 필요한 서류 업로드 (사업자등록증, 회사 로고, 프로필 이미지 등)

2. **비즈니스 검증**
   - 사업자 정보 제출 및 인증
   - 검증 완료 후 특별 배지 획득
   - 검증된 계정으로 알림톡 발송 가능

3. **템플릿 등록**
   - 카카오 비즈 메시지 사이트에서 템플릿 등록
   - 템플릿 검수를 위한 신청
   - 자동 검수 프로세스 시작 (평균 2-3일 소요)

4. **API 연동 (선택사항)**
   - 두 가지 방식 지원:
     - **BizMessage Agent 설치**: 에이전트 기반 접근
     - **BizMessage API 사용**: REST API를 통한 프로그래밍 방식
   - 계약 시점에 적절한 방식을 선택

### 1.2 API 연동 요구사항

- **인증 방식**: OAuth 2.0 API 인증 필수
- **클라이언트 정보**: 계약 시 발급받은 Client ID와 Client Secret 필요
- **요청 헤더**: Authorization 헤더를 통해 기본 클라이언트 정보 전달
- **메시지 발송 방식**: Push 또는 Polling 방식 지원 (계약에 따라 선택)

### 1.3 중요 제약사항

- **비즈니스 검증 필수**: 사업자등록증 기반 비즈니스 인증 필수
- **대리업체 제약**: 개발 대행업체가 생성한 앱의 경우, 앱 기본 정보가 서비스 소유자(사업 주체)의 사업자 정보와 동일해야 함
- **스팸 제재**: 불법적인 스팸 발송 시 알림톡 및 KakaoTalk 채널 정지, 벌금 부과 가능

---

## 2. 비용 구조 (Costs)

### 2.1 발송 비용

현재까지 수집된 정보:
- **장문 메시지 지원**: 알림톡은 최대 1,000자의 장문 메시지 발송 가능
- **비용 효율성**: SMS 대비 낮은 비용으로 장문 발송 가능
- **대체 발송**: 알림톡 미발송 시 SMS/LMS로 자동 전환 가능 (별도 요금)

### 2.2 비용 정보 확인 방법

정확한 가격 정보는 공개적으로 상세히 게시되지 않으므로:
- 카카오 비즈니스 공식 사이트 직접 확인
- 카카오 비즈니스 지원팀 문의
- 카카오 메시징 파트너 또는 리셀러 연락

### 2.3 추가 비용 구조

- **SMS 대체 발송**: 별도 SMS/LMS 요금 부과
- **구성에 따른 차등 가격**: 사용 패턴과 계약 규모에 따라 상이

---

## 3. 템플릿 검수 및 승인 (Template Approval)

### 3.1 승인 프로세스

1. **템플릿 등록**
   - 카카오 비즈 메시지 사이트에서 템플릿 작성
   - 템플릿 내용 및 설명 입력

2. **자동 검수 시작**
   - 템플릿 등록 후 자동 검수 프로세스 개시
   - 상태: "Pending" (대기 중)

3. **승인 기간**
   - **평균 소요 시간**: 2-3일
   - 수동 검수 프로세스 진행

### 3.2 거절 및 재검수

**거절 시 처리 방법**:
- 카카오 검수자의 간단한 질의 사항이 있을 경우, 질의 응답 필드에 답변 등록 가능
- 상태는 검수자 재검토 후 변경됨
- 거절된 템플릿 수정 후 재검수 신청 가능

**템플릿 승인 가이드**:
- 명확한 설명 제공 (영어 또는 한국어)
- 비친구 사용자에게 해당 템플릿 발송이 정당한 이유 설명
- 비즈니스 관계 및 고객과의 상호작용 맥락 명시

### 3.3 일반적인 거절 사유 (추정)

검색된 정보에 따르면, 다음과 같은 경우 거절될 가능성:
- 광고 목적의 메시지 (알림톡은 정보성 메시지만 허용)
- 불명확한 비즈니스 목적
- 템플릿 설명 부족
- 정책 위반 내용 포함
- 과도한 자극적 표현 또는 링크

---

## 4. 다국어 지원 (Multilingual Support)

### 4.1 현재 지원 언어

**알림톡 직접 지원**:
- 한국어 (Korean)
- 영어 (English)

### 4.2 다국어 템플릿 특성

- 템플릿 등록 시 여러 언어 중 하나 선택 가능
- 각 언어별 템플릿은 별도로 검수 필요
- 영어 및 한국어 이외 언어 (베트남어, 우즈베크어, 몽골어 등)에 대한 직접 지원은 현재 명확하지 않음

### 4.3 국제화 고려사항

**제한 사항**:
- 알림톡의 주요 목적: 한국 시장 고객 대상
- 해외 수취인을 위한 경우: 대체 발송 방식 (SMS)로 변경 필요
- 국제 번호로 발송 시 resendType을 SMS로 변경하여 실패 없이 발송 가능

**국제 지원**:
- KakaoTalk 자체는 15개 이상의 언어 지원, 130개 이상 국가에서 사용
- 그러나 알림톡은 한국 중심의 비즈니스 메시징 서비스

---

## 5. API 문서 및 기술 요구사항 (API Documentation & Technical Requirements)

### 5.1 공식 API 문서

**Kakao i Connect Message API**:
- 공식 문서: https://docs.kakaoi.ai/kakao_i_connect_message/bizmessage_eng/api/api_reference/
- 언어: 영어, 한국어 지원

**Kakao Developers**:
- 메인 문서: https://developers.kakao.com/docs/latest/en/kakaotalk-message/rest-api
- 개념 설명: https://developers.kakao.com/docs/latest/en/kakaotalk-message/common
- FAQ: https://developers.kakao.com/docs/latest/en/kakaotalk-message/faq

### 5.2 API 특징

**메시지 타입**:
1. **Alim Talk (알림톡)**: 정보성 메시지
   - 주문 확인, 예약 확인
   - 결제 정보, 배송 상태
   - 비친구 사용자에게도 발송 가능

2. **Brand Message (브랜드 메시지)**: 광고 메시지
   - 마케팅 수락자에게만 발송
   - 친구 채널 사용자에게만 발송

3. **Friend Talk**: 친구 채널 메시지
4. **XMS**: SMS/LMS (문자메시지)
5. **RCS**: Rich Communication Services

### 5.3 기술 요구사항

**인증**:
- OAuth 2.0 기반 인증
- Client ID, Client Secret 필수
- Authorization 헤더를 통한 요청

**API 호출 방식**:
- RESTful API 지원
- Push 방식: 서버에서 주기적으로 메시지 발송
- Polling 방식: 서버가 메시지 상태 조회

**문서 제공 업체**:
- NHN Cloud: API v1.4, v2.3, v3.0 가이드
- Kakao i (dk techpin): 공식 문서 제공
- 제3의 통합 업체: Sendbird, Sinch, Infobip, Alcmeon 등

### 5.4 NHN Cloud API 가이드

NHN Cloud는 Kakao 메시지 서비스의 주요 플랫폼:
- **콘솔 가이드**: 웹 기반 관리 인터페이스
- **API 가이드**: 프로그래밍 방식 연동
- **템플릿 관리**: 템플릿 등록 및 검수 상태 추적
- **채널 관리**: KakaoTalk 채널 관리 및 설정

---

## 6. 대체 솔루션 비교 (Alternatives)

### 6.1 주요 한국 메시징 서비스 비교

| 서비스 | 특징 | 용도 | 비용 대비 효과 |
|--------|------|------|--------------|
| **카카오 알림톡** | 모바일 메시지 (KakaoTalk 앱 내 전송) | 고객 알림, 주문/결제 확인 | 매우 높음 (SMS 대비 저가) |
| **NHN Cloud SMS/LMS** | 문자메시지 | 폴백, 국제 발송 | 중간 (장문 LMS 지원) |
| **DirectSend** | 로컬 SMS 게이트웨이 | SMS 발송 | 중간 |
| **Twilio** | 국제 SMS 플랫폼 | 국제 발송, 멀티 채널 | 높음 (국제 지원) |
| **Infobip** | 멀티채널 통신 플랫폼 | KakaoTalk + SMS 폴백 | 중간 |

### 6.2 알림톡 vs SMS 비교

**카카오 알림톡의 장점**:
- 더 낮은 비용 (SMS 대비)
- 최대 1,000자 장문 메시지 지원
- KakaoTalk 앱 내 전송으로 더 높은 가시성
- 비친구 사용자에게도 발송 가능
- 국내 사용자 대상으로 높은 도달률

**SMS의 장점**:
- 국제 발송 지원
- 스마트폰 미보유자도 수신 가능
- 더 광범위한 대상 범위
- 레거시 시스템과의 호환성

**브랜드 메시지의 장점**:
- 더 정교한 양식 및 이미지 지원
- 버튼 및 상호작용 기능
- 더 프로페셔널한 외관

### 6.3 추천 전략

**한국 B2B SaaS 스타트업의 경우**:
1. **주요 채널**: 카카오 알림톡 (높은 도달률, 저비용)
2. **폴백**: NHN Cloud SMS/LMS (알림톡 실패 시)
3. **국제 고객**: Twilio 또는 Infobip (국제 발송)
4. **통합 솔루션**: Infobip (KakaoTalk + SMS 통합)

---

## 7. 외국인 사용자 대상 발송 (Foreign Users)

### 7.1 한국 핸드폰 번호 없는 외국인

**현 상황 분석**:
- 알림톡은 기본적으로 **한국 핸드폰 번호** 기반으로 작동
- 코드 예제에서는 "01012345678" 형식의 한국 번호 사용 확인
- 해외 번호에 대한 직접 지원 여부는 문서에서 명확하지 않음

### 7.2 국제 번호 발송 방법

**대체 발송 (Fallback) 전략**:
1. 알림톡 발송 시도
2. 실패 시 자동으로 SMS로 전환
3. SMS 서비스 비용 별도 청구

**설정 방법**:
- 대체 발송(Alternative Delivery) 활성화
- resendType을 SMS로 설정
- NHN Cloud SMS 서비스 동시 사용 필수

### 7.3 외국인 사용자 고려사항

**제약 사항**:
- 알림톡의 주 대상: 한국 내 KakaoTalk 사용자
- 해외 거주 외국인: SMS/LMS로 대체 필요
- 비용 증가: SMS는 알림톡보다 비용이 높음

**권장 사항**:
- 한국 사용자: 알림톡 (저비용)
- 국제 사용자: SMS/LMS 또는 Twilio 등 국제 서비스 사용
- 혼합 전략: 전화번호 국가 코드 확인 후 자동 선택

---

## 8. 구현 체크리스트

### 8.1 사전 준비
- [ ] 사업자등록증 준비
- [ ] 회사 로고 및 프로필 이미지 준비
- [ ] 카카오 비즈니스 계정 생성
- [ ] 비즈니스 검증 신청

### 8.2 초기 설정
- [ ] KakaoTalk Business Channel 생성
- [ ] 사업자 정보 등록 및 검증
- [ ] 알림톡 템플릿 설계 (한국어 및 영어)
- [ ] 템플릿 검수 신청 (2-3일 대기)

### 8.3 API 연동
- [ ] Kakao i BizMessage 계약 또는 NHN Cloud 가입
- [ ] Client ID, Client Secret 발급 받기
- [ ] OAuth 2.0 인증 구현
- [ ] API 통합 테스트

### 8.4 발송 설정
- [ ] SMS 폴백 서비스 설정 (선택)
- [ ] 대체 발송 설정 (국제 고객용)
- [ ] 에러 핸들링 및 로깅 구현
- [ ] 전송 성공률 모니터링

### 8.5 운영 관리
- [ ] 템플릿 변경 시 재검수 프로세스 이해
- [ ] 월별 발송량 모니터링
- [ ] 비용 추적 및 예산 관리
- [ ] 고객 피드백 수집 및 개선

---

## 9. 주요 참고 자료 및 출처

### 9.1 공식 문서

1. **Kakao i BizMessage 공식 문서**
   - https://docs.kakaoi.ai/kakao_i_connect_message/bizmessage_eng/api/api_reference/
   - https://docs.kakaoi.ai/kakao_i_connect_message/bizmessage_eng/agent/at/

2. **Kakao Developers**
   - https://developers.kakao.com/docs/latest/en/kakaotalk-message/rest-api
   - https://developers.kakao.com/docs/latest/en/kakaotalk-message/common
   - https://developers.kakao.com/docs/latest/en/kakaotalk-message/faq

3. **NHN Cloud 문서**
   - https://docs.nhncloud.com/en/Notification/KakaoTalk%20Bizmessage/en/alimtalk-overview/
   - https://docs.nhncloud.com/en/Notification/KakaoTalk%20Bizmessage/en/alimtalk-api-guide/
   - https://guide.ncloud-docs.com/docs/en/sens-attemplate

### 9.2 통합 플랫폼

1. **Sendbird**
   - https://sendbird.com/docs/business-messaging/user-guide/v2/channels/kakaoalimtalk
   - https://sendbird.com/products/business-messaging/kakaotalk

2. **Sinch**
   - https://developers.sinch.com/docs/conversation/channel-support/kakaotalk
   - https://developers.sinch.com/docs/conversation/templates/channel-specific/kakaotalk
   - https://community.sinch.com/t5/KakaoTalk/What-is-AlimTalk-%EC%95%8C%EB%A6%BC%ED%86%A1/ta-p/7916

3. **Infobip**
   - https://www.infobip.com/docs/kakaotalk
   - https://www.infobip.com/docs/kakaotalk/message-types
   - https://www.infobip.com/kakao-business

4. **Alcmeon**
   - https://help.alcmeon.ai/en_US/kakaotalk/kakaotalk-overview-global

### 9.3 스타트업 및 비즈니스 가이드

1. **Respond.io Guide**
   - https://respond.io/blog/kakao-for-business

2. **Inquivix Guide**
   - https://inquivix.com/kakao-business-account-setup/

3. **8x8 Blog**
   - https://www.8x8.com/blog/kakaotalk-for-business

4. **TAKO (Asiance)**
   - https://www.lets-tako.com/

### 9.4 SMS 및 대체 솔루션

1. **WP SMS - SMS 게이트웨이 비교**
   - https://wp-sms-pro.com/35800/sms-gateway-for-korea/

2. **NAVER Cloud Platform**
   - https://www.ncloud.com/v2/product/applicationService/sens

---

## 10. 추가 조사 필요 항목

다음 사항들은 추가 정보 수집이 필요하므로, 직접 카카오 비즈니스 또는 파트너사에 문의하시기 바랍니다:

1. **정확한 가격 정보**
   - 월간 기본료 여부
   - 정확한 메시지당 비용
   - 대량 발송 할인 정책
   - 벌크 계약 조건

2. **템플릿 거절 사유 상세**
   - 카카오의 공식 가이드라인 문서
   - 실제 거절 사례 분석
   - 재검수 승인률

3. **외국인 사용자 지원**
   - 해외 번호 정확한 지원 범위
   - 베트남어, 우즈베크어 등 추가 언어 지원 여부
   - 다국어 템플릿 검수 기준

4. **확장성 및 운영**
   - 월별 발송량 제한
   - API 호출 제한 (Rate Limit)
   - SLA 및 고장 보상 정책

---

**문서 작성일**: 2025년 2월 13일
**검색 기준**: 2025년 최신 정보
**대상**: 한국 B2B SaaS 스타트업
