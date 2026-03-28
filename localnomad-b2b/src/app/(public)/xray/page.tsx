import XRayContent from './components/XRayContent';

export default function XRayPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header — server-rendered branding */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-6 md:py-8">
          <div className="text-center mb-8">
            <p className="text-sm font-semibold text-indigo-600 tracking-wide uppercase mb-2">
              VisaCampus
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              유학생 X-Ray
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              우리 대학 유학생 국적 편중도, 성장 국적, 유치 기회를 한눈에 분석합니다.
            </p>
          </div>
        </div>
      </header>

      {/* Interactive content — client boundary */}
      <XRayContent />

      {/* Footer — server-rendered attribution */}
      <footer className="bg-white border-t border-gray-100 mt-16 pb-20">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="text-center text-xs text-gray-400 space-y-2">
            <p className="font-semibold text-gray-500">공공누리 제1유형 출처표시</p>
            <p>
              이 서비스는 공공데이터포털(data.go.kr)의 공공데이터를 활용하였습니다.
            </p>
            <p>
              법무부 출입국외국인정책본부 - 유학생관리정보 데이터 ·
              법무부 - 월별 외국인 유학생 국적(지역)별 현황 ·
              한국교육개발원(KEDI) - 외국인 유학생 현황 ·
              교육부 대학알리미 - 대학주요정보 ·
              법무부 - 체류외국인 통계
            </p>
            <p className="mt-4 text-gray-300">
              &copy; 2026 VisaCampus. 데이터 기준일: 2025.12.31
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
