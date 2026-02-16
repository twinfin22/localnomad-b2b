// Korean label mappings for all domain enums

export const ENROLLMENT_STATUS_LABELS: Record<string, string> = {
  ENROLLED: '재학',
  ON_LEAVE: '휴학',
  EXPELLED: '제적',
  WITHDRAWN: '자퇴',
  GRADUATED: '졸업',
  UNREGISTERED: '미등록',
};

export const VISA_STATUS_LABELS: Record<string, string> = {
  ACTIVE: '유효',
  EXPIRING_SOON: '만료 임박',
  EXPIRED: '만료',
  REVOKED: '취소',
};

export const INSURANCE_STATUS_LABELS: Record<string, string> = {
  ACTIVE: '유효',
  EXPIRING: '만료 임박',
  EXPIRED: '만료',
  NONE: '미가입',
};

export const VISA_TYPE_LABELS: Record<string, string> = {
  D_2_1: 'D-2-1 (전문학사)',
  D_2_2: 'D-2-2 (학사)',
  D_2_3: 'D-2-3 (석사)',
  D_2_4: 'D-2-4 (박사)',
  D_2_5: 'D-2-5 (연구)',
  D_2_6: 'D-2-6 (교환)',
  D_2_7: 'D-2-7 (동반)',
  D_2_8: 'D-2-8 (단기)',
  D_4_1: 'D-4-1 (어학연수)',
  D_4_7: 'D-4-7 (기타연수)',
};

export const TRAFFIC_LIGHT_LABELS: Record<string, string> = {
  GREEN: '정상',
  YELLOW: '주의',
  RED: '긴급',
};

export const PROGRAM_TYPE_LABELS: Record<string, string> = {
  ASSOCIATE: '전문학사',
  BACHELOR: '학사',
  MASTER: '석사',
  DOCTORATE: '박사',
  LANGUAGE: '어학연수',
};

export const ALERT_TYPE_LABELS: Record<string, string> = {
  VISA_EXPIRY: '비자 만료 임박',
  ATTENDANCE_LOW: '출석률 저조',
  FIMS_DEADLINE: 'FIMS 변동신고 기한',
  IEQAS_WARNING: 'IEQAS 경고',
  INSURANCE_EXPIRY: '보험 만료',
  DOCUMENT_REQUEST: '서류 요청',
  CHAT_ESCALATION: 'AI 상담 에스컬레이션',
};

// StatusChange field → Korean labels
export const STATUS_CHANGE_FIELD_LABELS: Record<string, string> = {
  enrollmentStatus: '학적 상태',
  visaStatus: '비자 상태',
  visaType: '비자 유형',
  department: '소속 학과',
};

// FIMS report type → Korean labels
export const FIMS_REPORT_TYPE_LABELS: Record<string, string> = {
  STATUS_CHANGE: '변동신고',
  PERIODIC: '정기보고',
};

// FIMS change type → Korean labels
export const FIMS_CHANGE_TYPE_LABELS: Record<string, string> = {
  ON_LEAVE: '휴학',
  EXPELLED: '제적',
  WITHDRAWN: '자퇴',
  GRADUATED: '졸업',
  UNREGISTERED: '미등록',
  TRANSFER: '소속변경',
};

// FIMS report status → Korean labels
export const FIMS_REPORT_STATUS_LABELS: Record<string, string> = {
  PENDING: '대기',
  READY: '준비 완료',
  SUBMITTED: '제출 완료',
  OVERDUE: '기한 초과',
};

// Alert channel → Korean labels
export const ALERT_CHANNEL_LABELS: Record<string, string> = {
  IN_APP: '앱 내',
  EMAIL: '이메일',
  KAKAO: '카카오톡',
  SMS: 'SMS',
};
