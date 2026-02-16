// FAQ knowledge base for chatbot — pre-authored answers in 4 languages
// These are returned directly (no Claude API call) for matched intents

export type ChatLanguage = 'ko' | 'en' | 'zh' | 'vi' | 'uz' | 'mn';

export interface FAQItem {
  id: string;
  intent: string;
  keywords: Record<string, string[]>; // language → keywords
  answer: Record<string, string>; // language → pre-authored answer
  sources?: string[];
}

// Supported intents for FAQ
export type FAQIntent =
  | 'visa_extension'
  | 'visa_documents'
  | 'address_change'
  | 'part_time_work'
  | 'health_insurance'
  | 'immigration_office'
  | 'fims_report'
  | 'reentry_permit'
  | 'visa_type_change'
  | 'overstay_penalty'
  | 'enrollment_leave'
  | 'graduation_visa'
  | 'emergency_contact'
  | 'scholarship_info'
  | 'dormitory_info';

// Escalation intents (not FAQ — these trigger escalation flow)
export type EscalationIntent =
  | 'escalation_legal'
  | 'escalation_prediction'
  | 'escalation_overstay'
  | 'escalation_case_specific'
  | 'pii_request';

export type ChatIntent = FAQIntent | EscalationIntent;

// Disclaimer for Uzbek/Mongolian (languages without full FAQ translations)
const UZ_MN_DISCLAIMER: Record<string, string> = {
  uz: "Hozirda bu xizmat faqat koreys, ingliz, xitoy va vyetnam tillarida mavjud. Iltimos, quyidagi ma'lumotni ko'ring yoki xodimga murojaat qiling.",
  mn: 'Одоогоор энэ үйлчилгээ зөвхөн солонгос, англи, хятад, вьетнам хэлээр ашиглах боломжтой. Доорх мэдээллийг үзнэ үү эсвэл ажилтанд хандана уу.',
};

export const getUzMnDisclaimer = (lang: ChatLanguage): string | null => {
  return UZ_MN_DISCLAIMER[lang] ?? null;
};

export const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'faq-visa-extension',
    intent: 'visa_extension',
    keywords: {
      ko: ['비자 연장', '체류기간 연장', '비자 갱신', '연장 신청', '체류 연장'],
      en: ['visa extension', 'extend visa', 'renew visa', 'extension application'],
      zh: ['签证延期', '延长签证', '续签', '签证更新'],
      vi: ['gia hạn visa', 'kéo dài visa', 'gia hạn thị thực'],
    },
    answer: {
      ko: '📋 **비자 연장 안내**\n\n체류기간 연장은 만료일 **4개월 전부터** 신청 가능합니다.\n\n**필요 서류:**\n1. 통합신청서\n2. 여권 원본\n3. 외국인등록증\n4. 재학증명서\n5. 성적증명서 (직전 학기)\n6. 은행 잔고증명서 (₩20,000,000 이상)\n7. 건강보험 가입증명서\n8. 수수료: ₩60,000\n\n**신청 방법:** 관할 출입국관리사무소 방문 또는 하이코리아(Hi Korea) 온라인 신청\n\n⚠️ 만료 전 반드시 신청하세요. 기한 초과 시 벌금 및 불법체류 처리될 수 있습니다.',
      en: '📋 **Visa Extension Guide**\n\nYou can apply for extension starting **4 months before** your visa expiry date.\n\n**Required Documents:**\n1. Integrated Application Form\n2. Original Passport\n3. Alien Registration Card (ARC)\n4. Certificate of Enrollment\n5. Academic Transcript (previous semester)\n6. Bank Balance Certificate (≥ ₩20,000,000)\n7. Health Insurance Certificate\n8. Fee: ₩60,000\n\n**How to apply:** Visit your local Immigration Office or apply online via Hi Korea\n\n⚠️ Apply before your visa expires. Overstaying may result in fines and deportation.',
      zh: '📋 **签证延期指南**\n\n可以在签证到期前 **4个月** 开始申请延期。\n\n**所需材料：**\n1. 综合申请表\n2. 护照原件\n3. 外国人登录证\n4. 在学证明\n5. 成绩证明（上学期）\n6. 银行余额证明（≥ 2,000万韩元）\n7. 健康保险证明\n8. 费用：60,000韩元\n\n**申请方式：** 前往管辖出入境管理事务所或通过Hi Korea在线申请\n\n⚠️ 请务必在签证到期前申请。逾期滞留可能导致罚款和遣返。',
      vi: '📋 **Hướng dẫn gia hạn visa**\n\nBạn có thể nộp đơn gia hạn từ **4 tháng trước** ngày hết hạn visa.\n\n**Giấy tờ cần thiết:**\n1. Đơn tổng hợp\n2. Hộ chiếu gốc\n3. Thẻ đăng ký người nước ngoài (ARC)\n4. Giấy chứng nhận đang học\n5. Bảng điểm (học kỳ trước)\n6. Chứng nhận số dư ngân hàng (≥ 20,000,000 won)\n7. Chứng nhận bảo hiểm y tế\n8. Phí: 60,000 won\n\n**Cách nộp:** Đến Văn phòng Di trú hoặc nộp trực tuyến qua Hi Korea\n\n⚠️ Hãy nộp đơn trước khi visa hết hạn. Quá hạn có thể bị phạt và trục xuất.',
    },
    sources: ['출입국관리법 시행규칙 제76조', 'hikorea.go.kr'],
  },
  {
    id: 'faq-visa-documents',
    intent: 'visa_documents',
    keywords: {
      ko: ['비자 서류', '필요 서류', '구비서류', '준비물'],
      en: ['visa documents', 'required documents', 'what do i need'],
      zh: ['签证材料', '所需文件', '需要什么材料'],
      vi: ['giấy tờ visa', 'tài liệu cần thiết', 'cần chuẩn bị gì'],
    },
    answer: {
      ko: '📄 **비자 관련 서류 안내**\n\n일반적으로 필요한 서류:\n- 통합신청서\n- 여권 원본 + 사본\n- 외국인등록증\n- 재학증명서\n- 표준입학허가서\n- 성적증명서\n- 은행 잔고증명서\n\n⚠️ 비자 유형에 따라 추가 서류가 필요할 수 있습니다. 정확한 서류는 국제교류처에 문의해 주세요.',
      en: '📄 **Visa Document Guide**\n\nGenerally required documents:\n- Integrated Application Form\n- Passport (original + copy)\n- Alien Registration Card\n- Certificate of Enrollment\n- Standard Admission Letter\n- Academic Transcript\n- Bank Balance Certificate\n\n⚠️ Additional documents may be required depending on your visa type. Contact the International Office for exact requirements.',
      zh: '📄 **签证材料指南**\n\n一般所需材料：\n- 综合申请表\n- 护照原件+复印件\n- 外国人登录证\n- 在学证明\n- 标准入学许可书\n- 成绩证明\n- 银行余额证明\n\n⚠️ 根据签证类型可能需要额外材料。请联系国际交流处确认。',
      vi: '📄 **Hướng dẫn giấy tờ visa**\n\nGiấy tờ thường cần:\n- Đơn tổng hợp\n- Hộ chiếu (gốc + bản sao)\n- Thẻ đăng ký người nước ngoài\n- Giấy chứng nhận đang học\n- Thư nhập học tiêu chuẩn\n- Bảng điểm\n- Chứng nhận số dư ngân hàng\n\n⚠️ Có thể cần thêm giấy tờ tùy loại visa. Liên hệ Phòng Quốc tế để biết chi tiết.',
    },
    sources: ['hikorea.go.kr'],
  },
  {
    id: 'faq-address-change',
    intent: 'address_change',
    keywords: {
      ko: ['주소 변경', '체류지 변경', '이사', '주소 신고', '체류지 신고'],
      en: ['address change', 'change address', 'move', 'report address', 'new address'],
      zh: ['地址变更', '更改地址', '搬家', '住所变更'],
      vi: ['thay đổi địa chỉ', 'đổi địa chỉ', 'chuyển nhà', 'báo địa chỉ mới'],
    },
    answer: {
      ko: '🏠 **체류지 변경 신고 안내**\n\n이사 후 **14일 이내**에 체류지 변경 신고를 해야 합니다.\n\n**신고 방법:**\n1. **온라인:** 하이코리아(hikorea.go.kr) → 체류지 변경신고\n2. **방문:** 관할 출입국관리사무소 또는 주민센터\n\n**필요 서류:**\n- 체류지 변경신고서\n- 여권 + 외국인등록증\n- 새 주소 확인 서류 (임대차계약서 등)\n\n⚠️ 14일 이내 미신고 시 과태료(최대 200만원)가 부과될 수 있습니다.',
      en: '🏠 **Address Change Report Guide**\n\nYou must report your address change within **14 days** of moving.\n\n**How to report:**\n1. **Online:** Hi Korea (hikorea.go.kr) → Address Change Report\n2. **In person:** Immigration Office or Community Service Center\n\n**Required documents:**\n- Address Change Report Form\n- Passport + ARC\n- Proof of new address (lease contract, etc.)\n\n⚠️ Failure to report within 14 days may result in a fine (up to ₩2,000,000).',
      zh: '🏠 **住所变更申报指南**\n\n搬家后必须在 **14天内** 申报住所变更。\n\n**申报方式：**\n1. **在线：** Hi Korea (hikorea.go.kr) → 住所变更申报\n2. **现场：** 出入境管理事务所或居民中心\n\n**所需材料：**\n- 住所变更申报书\n- 护照 + 外国人登录证\n- 新住所证明（租赁合同等）\n\n⚠️ 14天内未申报可能被处以罚款（最高200万韩元）。',
      vi: '🏠 **Hướng dẫn báo thay đổi địa chỉ**\n\nBạn phải báo thay đổi địa chỉ trong vòng **14 ngày** sau khi chuyển nhà.\n\n**Cách báo:**\n1. **Trực tuyến:** Hi Korea (hikorea.go.kr) → Báo thay đổi địa chỉ\n2. **Trực tiếp:** Văn phòng Di trú hoặc Trung tâm Dịch vụ Cộng đồng\n\n**Giấy tờ cần thiết:**\n- Đơn báo thay đổi địa chỉ\n- Hộ chiếu + ARC\n- Giấy tờ xác nhận địa chỉ mới (hợp đồng thuê nhà, v.v.)\n\n⚠️ Không báo trong 14 ngày có thể bị phạt (tối đa 2,000,000 won).',
    },
    sources: ['출입국관리법 제36조'],
  },
  {
    id: 'faq-part-time-work',
    intent: 'part_time_work',
    keywords: {
      ko: ['아르바이트', '시간제 취업', '일하기', '취업허가', '알바'],
      en: ['part time', 'part-time work', 'work permit', 'can i work', 'job'],
      zh: ['兼职', '打工', '工作许可', '可以工作吗', '打工许可'],
      vi: ['làm thêm', 'việc làm bán thời gian', 'giấy phép lao động', 'có được đi làm không'],
    },
    answer: {
      ko: '💼 **시간제 취업(아르바이트) 안내**\n\n유학생(D-2, D-4)은 **시간제취업 허가**를 받은 후 아르바이트가 가능합니다.\n\n**허용 시간:**\n- 학기 중: 주 20시간\n- 방학 중: 무제한 (허가 범위 내)\n\n**신청 방법:** 하이코리아(hikorea.go.kr) → 체류허가 → 시간제취업허가\n\n**필요 서류:**\n- 시간제취업허가 신청서\n- 여권 + 외국인등록증\n- 재학증명서\n- 지도교수 추천서 또는 국제교류처 확인서\n\n⚠️ 무허가 취업 시 과태료 및 비자 취소 가능. 업종 제한도 있으니 반드시 확인하세요.',
      en: '💼 **Part-time Work Guide**\n\nInternational students (D-2, D-4) can work part-time after getting a **Part-time Work Permit**.\n\n**Allowed hours:**\n- During semester: 20 hours/week\n- During vacation: Unlimited (within permit scope)\n\n**How to apply:** Hi Korea (hikorea.go.kr) → Stay Permit → Part-time Work Permit\n\n**Required documents:**\n- Part-time Work Permit Application\n- Passport + ARC\n- Certificate of Enrollment\n- Recommendation from advisor or International Office\n\n⚠️ Working without permit may result in fines and visa cancellation. Some industries are restricted.',
      zh: '💼 **兼职工作指南**\n\n留学生(D-2, D-4)获得 **兼职工作许可** 后可以打工。\n\n**允许时间：**\n- 学期中：每周20小时\n- 假期中：无限制（许可范围内）\n\n**申请方式：** Hi Korea (hikorea.go.kr) → 滞留许可 → 兼职工作许可\n\n**所需材料：**\n- 兼职工作许可申请书\n- 护照 + 外国人登录证\n- 在学证明\n- 导师推荐信或国际交流处确认书\n\n⚠️ 无许可工作可能被罚款或取消签证。部分行业有限制。',
      vi: '💼 **Hướng dẫn làm thêm**\n\nSinh viên quốc tế (D-2, D-4) có thể làm thêm sau khi có **Giấy phép Làm việc Bán thời gian**.\n\n**Thời gian cho phép:**\n- Trong học kỳ: 20 giờ/tuần\n- Trong kỳ nghỉ: Không giới hạn (trong phạm vi giấy phép)\n\n**Cách nộp đơn:** Hi Korea (hikorea.go.kr) → Giấy phép cư trú → Giấy phép làm việc bán thời gian\n\n**Giấy tờ cần thiết:**\n- Đơn xin giấy phép làm việc bán thời gian\n- Hộ chiếu + ARC\n- Giấy chứng nhận đang học\n- Thư giới thiệu từ giáo sư hoặc Phòng Quốc tế\n\n⚠️ Làm việc không phép có thể bị phạt và hủy visa. Một số ngành bị hạn chế.',
    },
    sources: ['출입국관리법 시행령 제23조'],
  },
  {
    id: 'faq-health-insurance',
    intent: 'health_insurance',
    keywords: {
      ko: ['건강보험', '보험', '의료보험', '국민건강보험', '보험 가입'],
      en: ['health insurance', 'insurance', 'medical insurance', 'NHIS'],
      zh: ['健康保险', '医疗保险', '保险', '国民健康保险'],
      vi: ['bảo hiểm y tế', 'bảo hiểm', 'bảo hiểm sức khỏe'],
    },
    answer: {
      ko: '🏥 **건강보험 안내**\n\n외국인 유학생은 **국민건강보험 의무가입** 대상입니다 (2021년 3월부터).\n\n**월 보험료:** 약 ₩70,000 ~ ₩130,000 (소득에 따라 변동)\n\n**가입 방법:**\n- 외국인등록 후 자동 가입 (지역가입자)\n- 국민건강보험공단 지사에서 확인 가능\n\n**혜택:** 병원비 약 70% 할인\n\n⚠️ 미가입 또는 보험료 체납 시 비자 연장이 거부될 수 있습니다.\n💡 학교에서 단체보험을 제공하는 경우도 있으니 국제교류처에 확인하세요.',
      en: '🏥 **Health Insurance Guide**\n\nInternational students are **required to enroll** in National Health Insurance (since March 2021).\n\n**Monthly premium:** Approx. ₩70,000 ~ ₩130,000 (varies by income)\n\n**How to enroll:**\n- Auto-enrolled after alien registration (regional subscriber)\n- Verify at NHIS branch office\n\n**Benefits:** ~70% discount on hospital bills\n\n⚠️ Not having insurance or unpaid premiums may result in visa extension denial.\n💡 Some universities offer group insurance — check with the International Office.',
      zh: '🏥 **健康保险指南**\n\n外国留学生 **必须加入** 国民健康保险（2021年3月起）。\n\n**月保费：** 约 70,000 ~ 130,000韩元（根据收入变动）\n\n**加入方式：**\n- 外国人登录后自动加入（地区加入者）\n- 可在国民健康保险公团支社确认\n\n**福利：** 医院费用约70%折扣\n\n⚠️ 未加入或欠缴保费可能导致签证延期被拒。\n💡 部分学校提供团体保险，请咨询国际交流处。',
      vi: '🏥 **Hướng dẫn Bảo hiểm Y tế**\n\nSinh viên quốc tế **bắt buộc tham gia** Bảo hiểm Y tế Quốc gia (từ tháng 3/2021).\n\n**Phí hàng tháng:** Khoảng 70,000 ~ 130,000 won (tùy thu nhập)\n\n**Cách tham gia:**\n- Tự động đăng ký sau khi đăng ký người nước ngoài\n- Xác nhận tại chi nhánh NHIS\n\n**Quyền lợi:** Giảm ~70% chi phí bệnh viện\n\n⚠️ Không có bảo hiểm hoặc nợ phí có thể bị từ chối gia hạn visa.\n💡 Một số trường cung cấp bảo hiểm nhóm — hãy hỏi Phòng Quốc tế.',
    },
    sources: ['국민건강보험법 제109조'],
  },
  {
    id: 'faq-immigration-office',
    intent: 'immigration_office',
    keywords: {
      ko: ['출입국관리사무소', '출입국', '이민국', '사무소 위치', '사무소 번호'],
      en: ['immigration office', 'immigration', 'where is immigration', 'immigration location'],
      zh: ['出入境管理', '移民局', '出入境事务所', '在哪里'],
      vi: ['văn phòng di trú', 'xuất nhập cảnh', 'cục di trú', 'ở đâu'],
    },
    answer: {
      ko: '🏢 **출입국관리사무소 안내**\n\n**대전 출입국·외국인사무소 (충남 관할):**\n- 주소: 대전광역시 서구 둔산중로 100\n- 전화: 1345 (외국인종합안내센터)\n- 운영: 평일 09:00~18:00\n\n**방문 전 예약:** 하이코리아(hikorea.go.kr)에서 사전 예약 필수\n\n💡 간단한 민원은 하이코리아 온라인으로 처리 가능합니다.\n📞 1345는 20개 국어 상담 지원 (한국어, 영어, 중국어, 베트남어 등)',
      en: '🏢 **Immigration Office Guide**\n\n**Daejeon Immigration Office (Chungnam jurisdiction):**\n- Address: 100 Dunsan-jung-ro, Seo-gu, Daejeon\n- Phone: 1345 (Foreigner Information Center)\n- Hours: Weekdays 09:00-18:00\n\n**Reserve before visiting:** Appointment required via Hi Korea (hikorea.go.kr)\n\n💡 Simple requests can be handled online via Hi Korea.\n📞 1345 supports 20 languages including English, Chinese, Vietnamese.',
      zh: '🏢 **出入境管理事务所指南**\n\n**大田出入境·外国人事务所（忠南管辖）：**\n- 地址：大田广域市西区屯山中路100\n- 电话：1345（外国人综合咨询中心）\n- 时间：工作日 09:00~18:00\n\n**来访前预约：** 需通过Hi Korea (hikorea.go.kr)预约\n\n💡 简单业务可通过Hi Korea在线办理。\n📞 1345支持20种语言咨询。',
      vi: '🏢 **Hướng dẫn Văn phòng Di trú**\n\n**Văn phòng Di trú Daejeon (quản lý Chungnam):**\n- Địa chỉ: 100 Dunsan-jung-ro, Seo-gu, Daejeon\n- Điện thoại: 1345 (Trung tâm Thông tin Người nước ngoài)\n- Giờ làm việc: Thứ 2-6, 09:00-18:00\n\n**Đặt lịch trước:** Cần đặt lịch qua Hi Korea (hikorea.go.kr)\n\n💡 Các yêu cầu đơn giản có thể xử lý trực tuyến qua Hi Korea.\n📞 1345 hỗ trợ 20 ngôn ngữ.',
    },
    sources: ['hikorea.go.kr', '1345 외국인종합안내센터'],
  },
  {
    id: 'faq-fims-report',
    intent: 'fims_report',
    keywords: {
      ko: ['변동신고', 'FIMS', '정기보고', '신고', '휴학 신고'],
      en: ['status change report', 'FIMS', 'periodic report'],
      zh: ['变动申报', 'FIMS', '定期报告', '申报'],
      vi: ['báo cáo thay đổi', 'FIMS', 'báo cáo định kỳ'],
    },
    answer: {
      ko: '📊 **FIMS 변동신고 안내**\n\n학생의 학적 상태가 변경되면(휴학, 제적, 자퇴, 졸업, 미등록) **15일 이내** FIMS에 변동신고해야 합니다.\n\n**FIMS (외국인유학생정보시스템):** fims.hikorea.go.kr\n\n이 절차는 **대학 국제교류처**에서 처리합니다. 학생 개인이 직접 신고하는 것이 아닙니다.\n\n❓ 학적 변동이 있을 경우 국제교류처에 반드시 알려주세요.',
      en: '📊 **FIMS Status Change Report**\n\nWhen a student\'s enrollment status changes (leave, expulsion, withdrawal, graduation, unregistered), the university must report to FIMS within **15 days**.\n\n**FIMS:** fims.hikorea.go.kr\n\nThis is handled by the **International Office**, not by students directly.\n\n❓ If your enrollment status changes, please notify the International Office immediately.',
      zh: '📊 **FIMS变动申报**\n\n学生学籍状态变更时（休学、除籍、退学、毕业、未注册），大学必须在 **15天内** 向FIMS申报。\n\n**FIMS：** fims.hikorea.go.kr\n\n此手续由 **国际交流处** 处理，不需要学生本人操作。\n\n❓ 如果您的学籍发生变动，请立即通知国际交流处。',
      vi: '📊 **Báo cáo thay đổi FIMS**\n\nKhi tình trạng nhập học thay đổi (nghỉ phép, đình chỉ, thôi học, tốt nghiệp, chưa đăng ký), trường phải báo cáo FIMS trong vòng **15 ngày**.\n\n**FIMS:** fims.hikorea.go.kr\n\nViệc này do **Phòng Quốc tế** xử lý, không phải sinh viên tự làm.\n\n❓ Nếu tình trạng nhập học thay đổi, vui lòng thông báo ngay cho Phòng Quốc tế.',
    },
    sources: ['출입국관리법 제19조', 'fims.hikorea.go.kr'],
  },
  {
    id: 'faq-reentry-permit',
    intent: 'reentry_permit',
    keywords: {
      ko: ['재입국허가', '재입국', '출국', '일시 귀국', '방학 귀국'],
      en: ['reentry permit', 're-entry', 'leave korea', 'go home', 'travel abroad'],
      zh: ['再入国许可', '再入境', '出国', '回国'],
      vi: ['giấy phép tái nhập cảnh', 'tái nhập cảnh', 'về nước', 'xuất cảnh'],
    },
    answer: {
      ko: '✈️ **재입국허가 안내**\n\n외국인등록을 한 유학생이 출국 후 재입국할 때는 **재입국허가**가 필요합니다.\n\n**종류:**\n- 단수 재입국허가: 1회 출입국 (₩30,000)\n- 복수 재입국허가: 체류기간 내 횟수 무제한 (₩50,000)\n\n**신청:** 하이코리아 온라인 또는 출입국관리사무소\n\n⚠️ 재입국허가 없이 출국하면 외국인등록이 말소되며, 재입국 시 새로 비자를 받아야 합니다.',
      en: '✈️ **Re-entry Permit Guide**\n\nRegistered foreign students need a **re-entry permit** to leave and return to Korea.\n\n**Types:**\n- Single re-entry: 1 trip (₩30,000)\n- Multiple re-entry: Unlimited trips within visa period (₩50,000)\n\n**Apply:** Via Hi Korea online or Immigration Office\n\n⚠️ Leaving without a re-entry permit cancels your alien registration. You\'ll need a new visa to return.',
      zh: '✈️ **再入国许可指南**\n\n已登录的外国留学生出国后再入境需要 **再入国许可**。\n\n**种类：**\n- 单次再入国许可：1次出入（30,000韩元）\n- 多次再入国许可：滞留期间内无限次（50,000韩元）\n\n**申请：** 通过Hi Korea在线或出入境管理事务所\n\n⚠️ 未获再入国许可出国将导致外国人登录被注销，需重新申请签证。',
      vi: '✈️ **Hướng dẫn Giấy phép Tái nhập cảnh**\n\nSinh viên nước ngoài đã đăng ký cần **giấy phép tái nhập cảnh** để xuất cảnh và quay lại Hàn Quốc.\n\n**Loại:**\n- Tái nhập cảnh đơn: 1 lần (30,000 won)\n- Tái nhập cảnh đa: Không giới hạn trong thời gian visa (50,000 won)\n\n**Nộp đơn:** Qua Hi Korea trực tuyến hoặc Văn phòng Di trú\n\n⚠️ Xuất cảnh không có giấy phép sẽ hủy đăng ký người nước ngoài. Cần xin visa mới để quay lại.',
    },
    sources: ['출입국관리법 제30조'],
  },
  {
    id: 'faq-visa-type-change',
    intent: 'visa_type_change',
    keywords: {
      ko: ['비자 변경', '체류자격 변경', 'D-2 변경', 'D-4에서 D-2'],
      en: ['change visa type', 'visa status change', 'switch visa', 'D-4 to D-2'],
      zh: ['更改签证类型', '签证变更', '转签证'],
      vi: ['đổi loại visa', 'thay đổi visa', 'chuyển visa'],
    },
    answer: {
      ko: '🔄 **체류자격 변경 안내**\n\n비자 유형을 변경하려면 (예: D-4→D-2) 체류자격 변경허가를 받아야 합니다.\n\n**필요 서류:**\n- 통합신청서\n- 여권 + 외국인등록증\n- 새 학교 입학허가서\n- 수수료: ₩100,000\n\n**신청:** 출입국관리사무소 방문\n\n⚠️ 반드시 현재 비자 만료 전에 신청하세요. 국제교류처에서 안내를 받으시기 바랍니다.',
      en: '🔄 **Visa Type Change Guide**\n\nTo change your visa type (e.g., D-4→D-2), you need a Status Change Permit.\n\n**Required documents:**\n- Integrated Application Form\n- Passport + ARC\n- New school admission letter\n- Fee: ₩100,000\n\n**Apply:** Visit Immigration Office\n\n⚠️ Apply before your current visa expires. Contact the International Office for guidance.',
      zh: '🔄 **签证类型变更指南**\n\n如需变更签证类型（如D-4→D-2），需要申请滞留资格变更许可。\n\n**所需材料：**\n- 综合申请表\n- 护照 + 外国人登录证\n- 新学校入学许可书\n- 费用：100,000韩元\n\n**申请：** 前往出入境管理事务所\n\n⚠️ 请务必在当前签证到期前申请。请联系国际交流处获取指导。',
      vi: '🔄 **Hướng dẫn Đổi loại Visa**\n\nĐể đổi loại visa (ví dụ: D-4→D-2), bạn cần Giấy phép Thay đổi Tư cách Cư trú.\n\n**Giấy tờ cần thiết:**\n- Đơn tổng hợp\n- Hộ chiếu + ARC\n- Thư nhập học trường mới\n- Phí: 100,000 won\n\n**Nộp đơn:** Tại Văn phòng Di trú\n\n⚠️ Hãy nộp đơn trước khi visa hiện tại hết hạn. Liên hệ Phòng Quốc tế để được hướng dẫn.',
    },
    sources: ['출입국관리법 제24조'],
  },
  {
    id: 'faq-overstay-penalty',
    intent: 'overstay_penalty',
    keywords: {
      ko: ['불법체류', '오버스테이', '벌금', '체류기간 초과', '초과 체류'],
      en: ['overstay', 'overstaying', 'penalty', 'illegal stay', 'expired visa'],
      zh: ['非法滞留', '逾期滞留', '罚款', '超期'],
      vi: ['quá hạn', 'lưu trú bất hợp pháp', 'phạt', 'hết hạn visa'],
    },
    answer: {
      ko: '⚠️ **불법체류(오버스테이) 안내**\n\n체류기간을 초과하면 **불법체류**로 처리됩니다.\n\n**벌금:**\n- 10일 이내: 무벌금 (자진출국 시)\n- 10일~1개월: ₩500,000\n- 1~3개월: ₩1,000,000\n- 3개월 이상: ₩2,000,000\n\n**추가 불이익:**\n- 입국 금지 (1~10년)\n- 대학 IEQAS 인증에 악영향\n- 강제 퇴거 가능\n\n🚨 체류기간이 임박했다면 즉시 국제교류처에 연락하세요!',
      en: '⚠️ **Overstay Penalties**\n\nStaying beyond your visa expiry is classified as **illegal overstay**.\n\n**Fines:**\n- Within 10 days: No fine (voluntary departure)\n- 10 days~1 month: ₩500,000\n- 1~3 months: ₩1,000,000\n- 3+ months: ₩2,000,000\n\n**Additional consequences:**\n- Entry ban (1-10 years)\n- Negative impact on university IEQAS certification\n- Possible deportation\n\n🚨 If your visa is expiring soon, contact the International Office immediately!',
      zh: '⚠️ **非法滞留处罚**\n\n超过签证有效期属于 **非法滞留**。\n\n**罚款：**\n- 10天内：无罚款（自愿出境时）\n- 10天~1个月：500,000韩元\n- 1~3个月：1,000,000韩元\n- 3个月以上：2,000,000韩元\n\n**其他后果：**\n- 禁止入境（1-10年）\n- 影响大学IEQAS认证\n- 可能被强制遣返\n\n🚨 如果签证即将到期，请立即联系国际交流处！',
      vi: '⚠️ **Hình phạt Quá hạn Visa**\n\nỞ quá hạn visa được xếp loại **lưu trú bất hợp pháp**.\n\n**Phạt:**\n- Trong 10 ngày: Không phạt (tự nguyện xuất cảnh)\n- 10 ngày~1 tháng: 500,000 won\n- 1~3 tháng: 1,000,000 won\n- Trên 3 tháng: 2,000,000 won\n\n**Hậu quả khác:**\n- Cấm nhập cảnh (1-10 năm)\n- Ảnh hưởng xấu đến chứng nhận IEQAS của trường\n- Có thể bị trục xuất\n\n🚨 Nếu visa sắp hết hạn, hãy liên hệ Phòng Quốc tế ngay!',
    },
    sources: ['출입국관리법 제68조, 제92조'],
  },
  {
    id: 'faq-enrollment-leave',
    intent: 'enrollment_leave',
    keywords: {
      ko: ['휴학', '복학', '휴학 신청', '학기 휴학'],
      en: ['leave of absence', 'take leave', 'semester off', 'return to school'],
      zh: ['休学', '复学', '请假', '休学申请'],
      vi: ['nghỉ học', 'xin nghỉ', 'bảo lưu', 'quay lại trường'],
    },
    answer: {
      ko: '📝 **휴학 시 유의사항**\n\n유학생이 휴학하면 다음 절차가 필요합니다:\n\n1. **FIMS 변동신고** — 대학에서 15일 이내 처리\n2. **비자 관리** — 휴학 중에도 체류기간은 변경되지 않음\n3. **건강보험** — 휴학 중에도 보험료 납부 의무\n4. **체류 조건** — 휴학 기간 중 아르바이트 불가 (허가 취소됨)\n\n⚠️ 장기 휴학(1년 이상) 시 비자 연장이 거부될 수 있습니다.\n\n국제교류처에 먼저 상담 후 휴학을 결정하세요.',
      en: '📝 **Leave of Absence — Important Notes**\n\nWhen a student takes leave:\n\n1. **FIMS Report** — University reports within 15 days\n2. **Visa** — Stay period does not change during leave\n3. **Health Insurance** — Still required to pay premiums\n4. **Work Permit** — Part-time work permit is cancelled\n\n⚠️ Extended leave (1+ year) may result in visa extension denial.\n\nConsult the International Office before deciding.',
      zh: '📝 **休学注意事项**\n\n学生休学时需注意：\n\n1. **FIMS变动申报** — 大学15天内处理\n2. **签证管理** — 休学期间滞留期不变\n3. **健康保险** — 休学期间仍需缴纳保费\n4. **工作许可** — 兼职工作许可被取消\n\n⚠️ 长期休学（1年以上）可能导致签证延期被拒。\n\n请先咨询国际交流处后再决定。',
      vi: '📝 **Lưu ý khi Nghỉ học**\n\nKhi sinh viên nghỉ học:\n\n1. **Báo cáo FIMS** — Trường báo cáo trong 15 ngày\n2. **Visa** — Thời gian cư trú không thay đổi\n3. **Bảo hiểm** — Vẫn phải đóng phí bảo hiểm\n4. **Giấy phép làm việc** — Bị hủy\n\n⚠️ Nghỉ dài hạn (trên 1 năm) có thể bị từ chối gia hạn visa.\n\nHãy tham vấn Phòng Quốc tế trước khi quyết định.',
    },
    sources: ['출입국관리법 제19조'],
  },
  {
    id: 'faq-graduation-visa',
    intent: 'graduation_visa',
    keywords: {
      ko: ['졸업 후 비자', '구직비자', 'D-10', '졸업 후'],
      en: ['after graduation', 'job seeking visa', 'D-10', 'post graduation'],
      zh: ['毕业后签证', '求职签证', 'D-10', '毕业后'],
      vi: ['visa sau tốt nghiệp', 'visa tìm việc', 'D-10', 'sau khi tốt nghiệp'],
    },
    answer: {
      ko: '🎓 **졸업 후 비자 안내**\n\n졸업 후에는 D-10 (구직활동) 비자로 변경 가능합니다.\n\n**D-10 비자:**\n- 기간: 최대 6개월 (1회 연장 가능, 총 1년)\n- 활동: 구직활동, 인턴십 가능\n\n**필요 서류:**\n- 졸업증명서\n- 구직활동 계획서\n- 은행 잔고증명서\n\n⚠️ 졸업일로부터 30일 이내에 비자 변경 신청하세요.\n\n취업이 확정되면 E-7 (특정활동) 등 취업 비자로 전환 가능합니다.',
      en: '🎓 **Post-Graduation Visa Guide**\n\nAfter graduation, you can switch to D-10 (Job Seeking) visa.\n\n**D-10 Visa:**\n- Duration: Up to 6 months (extendable once, total 1 year)\n- Activities: Job seeking, internships allowed\n\n**Required documents:**\n- Graduation certificate\n- Job seeking plan\n- Bank balance certificate\n\n⚠️ Apply for visa change within 30 days of graduation.\n\nOnce employed, you can switch to E-7 or other work visas.',
      zh: '🎓 **毕业后签证指南**\n\n毕业后可以变更为D-10（求职活动）签证。\n\n**D-10签证：**\n- 期限：最长6个月（可延期1次，共1年）\n- 活动：求职活动、实习\n\n**所需材料：**\n- 毕业证明\n- 求职活动计划书\n- 银行余额证明\n\n⚠️ 请在毕业后30天内申请签证变更。\n\n就业确定后可转换为E-7等工作签证。',
      vi: '🎓 **Hướng dẫn Visa sau Tốt nghiệp**\n\nSau khi tốt nghiệp, bạn có thể chuyển sang visa D-10 (Tìm việc).\n\n**Visa D-10:**\n- Thời hạn: Tối đa 6 tháng (gia hạn 1 lần, tổng 1 năm)\n- Hoạt động: Tìm việc, thực tập\n\n**Giấy tờ cần thiết:**\n- Giấy chứng nhận tốt nghiệp\n- Kế hoạch tìm việc\n- Chứng nhận số dư ngân hàng\n\n⚠️ Nộp đơn đổi visa trong vòng 30 ngày sau tốt nghiệp.\n\nKhi có việc làm, có thể chuyển sang visa E-7 hoặc visa làm việc khác.',
    },
    sources: ['출입국관리법 시행령 제12조'],
  },
  {
    id: 'faq-emergency-contact',
    intent: 'emergency_contact',
    keywords: {
      ko: ['긴급연락처', '긴급', '응급', '경찰', '소방', '구급차'],
      en: ['emergency', 'emergency contact', 'police', 'ambulance', 'fire'],
      zh: ['紧急联系', '紧急', '警察', '救护车', '消防'],
      vi: ['liên hệ khẩn cấp', 'khẩn cấp', 'cảnh sát', 'cứu thương', 'cứu hỏa'],
    },
    answer: {
      ko: '🚨 **긴급연락처**\n\n- 🚔 경찰: **112**\n- 🚒 소방/구급: **119**\n- 📞 외국인종합안내: **1345** (20개 국어)\n- 🏥 응급의료정보: **1339**\n- 💬 범죄피해 상담: **1577-1366**\n\n**대학 국제교류처 연락처는 학교별로 다릅니다.**\n학교 홈페이지에서 국제교류처 전화번호를 확인하세요.',
      en: '🚨 **Emergency Contacts**\n\n- 🚔 Police: **112**\n- 🚒 Fire/Ambulance: **119**\n- 📞 Foreigner Helpline: **1345** (20 languages)\n- 🏥 Emergency Medical Info: **1339**\n- 💬 Crime Victim Hotline: **1577-1366**\n\n**University International Office contacts vary by school.**\nCheck your school website for the International Office phone number.',
      zh: '🚨 **紧急联系电话**\n\n- 🚔 警察：**112**\n- 🚒 消防/急救：**119**\n- 📞 外国人综合咨询：**1345**（20种语言）\n- 🏥 急救医疗信息：**1339**\n- 💬 犯罪受害咨询：**1577-1366**\n\n**各大学国际交流处联系方式不同。**\n请在学校网站查询国际交流处电话。',
      vi: '🚨 **Liên hệ Khẩn cấp**\n\n- 🚔 Cảnh sát: **112**\n- 🚒 Cứu hỏa/Cứu thương: **119**\n- 📞 Đường dây hỗ trợ Người nước ngoài: **1345** (20 ngôn ngữ)\n- 🏥 Thông tin Y tế Khẩn cấp: **1339**\n- 💬 Đường dây Nạn nhân Tội phạm: **1577-1366**\n\n**Liên hệ Phòng Quốc tế tùy theo trường.**\nKiểm tra trang web trường để biết số điện thoại Phòng Quốc tế.',
    },
    sources: [],
  },
  {
    id: 'faq-scholarship-info',
    intent: 'scholarship_info',
    keywords: {
      ko: ['장학금', '학비 지원', '재정 지원'],
      en: ['scholarship', 'financial aid', 'tuition support'],
      zh: ['奖学金', '学费资助', '经济援助'],
      vi: ['học bổng', 'hỗ trợ tài chính', 'hỗ trợ học phí'],
    },
    answer: {
      ko: '🎓 **장학금 안내**\n\n유학생 장학금은 학교마다 다릅니다. 일반적인 유형:\n\n1. **교내 장학금** — 성적 우수 장학금, 입학 장학금 등\n2. **정부 장학금** — GKS (Global Korea Scholarship)\n3. **외부 장학금** — 기업, 재단 등\n\n📌 장학금 정보는 학교 국제교류처 또는 장학팀에 문의하세요.\n💡 GKS 장학금 정보: www.studyinkorea.go.kr',
      en: '🎓 **Scholarship Guide**\n\nScholarships vary by university. Common types:\n\n1. **University Scholarships** — Merit-based, entrance scholarships\n2. **Government Scholarships** — GKS (Global Korea Scholarship)\n3. **External Scholarships** — Corporate, foundation-funded\n\n📌 Check with your International Office or Scholarship Team.\n💡 GKS info: www.studyinkorea.go.kr',
      zh: '🎓 **奖学金指南**\n\n奖学金因学校而异。常见类型：\n\n1. **校内奖学金** — 成绩优秀奖学金、入学奖学金\n2. **政府奖学金** — GKS（韩国政府奖学金）\n3. **外部奖学金** — 企业、基金会等\n\n📌 请咨询国际交流处或奖学金部门。\n💡 GKS信息：www.studyinkorea.go.kr',
      vi: '🎓 **Hướng dẫn Học bổng**\n\nHọc bổng khác nhau theo trường. Các loại phổ biến:\n\n1. **Học bổng trường** — Học bổng thành tích, nhập học\n2. **Học bổng chính phủ** — GKS (Global Korea Scholarship)\n3. **Học bổng bên ngoài** — Doanh nghiệp, quỹ\n\n📌 Liên hệ Phòng Quốc tế hoặc Phòng Học bổng.\n💡 Thông tin GKS: www.studyinkorea.go.kr',
    },
    sources: ['www.studyinkorea.go.kr'],
  },
  {
    id: 'faq-dormitory-info',
    intent: 'dormitory_info',
    keywords: {
      ko: ['기숙사', '숙소', '기숙사 신청'],
      en: ['dormitory', 'dorm', 'housing', 'accommodation'],
      zh: ['宿舍', '住宿', '宿舍申请'],
      vi: ['ký túc xá', 'nhà ở', 'nơi ở'],
    },
    answer: {
      ko: '🏠 **기숙사 안내**\n\n기숙사 관련 정보는 학교마다 다릅니다.\n\n**일반 안내:**\n- 신입생은 대부분 기숙사 우선 배정\n- 신청 시기: 학기 시작 2~3개월 전\n- 비용: 월 ₩200,000 ~ ₩500,000 (학교별 상이)\n\n📌 기숙사 신청은 학교 홈페이지 또는 학생처에서 확인하세요.\n💡 기숙사가 만실이면 학교 주변 원룸/하숙 정보를 국제교류처에서 안내받을 수 있습니다.',
      en: '🏠 **Dormitory Guide**\n\nDormitory info varies by university.\n\n**General info:**\n- New students usually get priority placement\n- Application period: 2-3 months before semester\n- Cost: ₩200,000 ~ ₩500,000/month (varies by school)\n\n📌 Check your school website or Student Affairs Office for applications.\n💡 If dorms are full, the International Office can help find nearby housing.',
      zh: '🏠 **宿舍指南**\n\n宿舍信息因学校而异。\n\n**一般信息：**\n- 新生通常优先安排\n- 申请时间：开学前2-3个月\n- 费用：月 200,000 ~ 500,000韩元（各校不同）\n\n📌 请在学校网站或学生处确认申请。\n💡 宿舍满员时，国际交流处可帮助寻找附近住房。',
      vi: '🏠 **Hướng dẫn Ký túc xá**\n\nThông tin KTX khác nhau theo trường.\n\n**Thông tin chung:**\n- Sinh viên mới thường được ưu tiên\n- Thời gian đăng ký: 2-3 tháng trước học kỳ\n- Chi phí: 200,000 ~ 500,000 won/tháng (tùy trường)\n\n📌 Kiểm tra trang web trường hoặc Phòng Công tác Sinh viên.\n💡 Nếu KTX hết chỗ, Phòng Quốc tế có thể giúp tìm nhà ở gần trường.',
    },
    sources: [],
  },
];

/**
 * Search FAQ by intent. Returns the FAQ item if found.
 */
export const searchFAQByIntent = (intent: string): FAQItem | null => {
  return FAQ_ITEMS.find((item) => item.intent === intent) ?? null;
};

/**
 * Get a FAQ answer in the specified language.
 * Falls back to Korean if the language is not available.
 * Adds uz/mn disclaimer if applicable.
 */
export const getFAQAnswer = (
  faq: FAQItem,
  language: ChatLanguage,
): { answer: string; sources: string[] } => {
  const disclaimer = getUzMnDisclaimer(language);
  // For uz/mn, show Korean answer with disclaimer prefix
  const effectiveLang = (language === 'uz' || language === 'mn') ? 'ko' : language;
  const answer = faq.answer[effectiveLang] ?? faq.answer['ko'];

  const fullAnswer = disclaimer ? `${disclaimer}\n\n---\n\n${answer}` : answer;
  return { answer: fullAnswer, sources: faq.sources ?? [] };
};

/**
 * Get all FAQ keywords for a specific language, mapped to their intents.
 * Used by the intent classifier for keyword matching.
 */
export const getAllKeywords = (language: string): Map<string, string> => {
  const keywordMap = new Map<string, string>();
  const lang = language as ChatLanguage;

  for (const faq of FAQ_ITEMS) {
    const keywords = faq.keywords[lang] ?? faq.keywords['ko'];
    for (const keyword of keywords) {
      keywordMap.set(keyword.toLowerCase(), faq.intent);
    }
  }

  return keywordMap;
};
